/*global importScripts protocol localforage delete_doc create_doc insert_doc autosubmit create_trie msgpack*/
importScripts('localforage.min.js')
importScripts('msgpack.min.js')
importScripts('protocol.js')
importScripts('search.js')

const
    enum_type = {
        CREATE: 0,
        CONVERTED: 1,
        RECOGNIZED: 2,
        DELETE: 3
    },
    WS_URL = location.protocol.replace('http', 'ws') + '//' + location.host + '/ws',
    DB_KEY = '8x8-records',
    STATE = 'state',
    save = state => {
        self[STATE] = state
        return localforage.setItem(DB_KEY, msgpack.encode(state))
    },
    load = () =>
        self[STATE]
            ? Promise.resolve(self[STATE])
            : localforage.getItem(DB_KEY).then(_ =>
                _
                    ? msgpack.decode(_)
                    : {
                        records: {},
                        log: [],
                        trie: create_trie()
                      }
            ),
    record2search_payload = record =>
        record.text.results.reduce(
            (frase, speach) =>
                frase + ' ' + speach.alternatives[0].transcript,
            ''
        )

let
    ws

function send (_) {
    ws && ws.readyState === 1 && ws.send(msgpack.encode(_))
}

function connection (url, state, onrecord) {
    const
        reconnect = () => setTimeout(() => connection(url, state, onrecord), 5000)

    try {
        ws = new WebSocket(url, String(Object.keys(state.records).length))
        ws.onclose = reconnect
        ws.onerror = () => ws.close()
        ws.binaryType = 'arraybuffer'
        ws.onmessage = ({data}) => {
            onrecord(msgpack.decode(new Uint8Array(data)))
        }
    } catch (e) {
        reconnect()
    }
}


localforage.ready(() =>
    load()
        .then(state => {
            state.log.forEach(protocol.load_record)
            return state
        })
        .then(state =>
            connection(
                WS_URL,
                state,
                commit => {
                    const
                        {type, payload} = commit,
                        {id} = payload,
                        {trie, records} = state

                    records[id] = records[id] || {}

                    const record = records[id]

                    switch (type) {
                        case enum_type.CREATE:
                            record.id = id
                            record.note = payload.note
                            record.create_time = payload.create_time
                            if (!record.deleted) {
                                insert_doc(trie, create_doc(payload.note, '', id))
                            }
                            break
                        case enum_type.RECOGNIZED:
                            record.text = payload.text
                            record.recognized_time = payload.recognized_time

                            if (!record.deleted) {
                                //delete_doc(trie, create_doc(record.note, '', id))
                                insert_doc(trie, create_doc(record.note, record2search_payload(record), id))
                            }
                            break
                        case enum_type.CONVERTED:
                            record.audio_link = payload.audio_link
                            record.converted_time = payload.converted_time
                            break
                        case enum_type.DELETE:
                            record.deleted = payload.deleted
                            record.deleted_time = payload.deleted_time

                            //if (record.note !== undefined)
                            //    delete_doc(trie, create_doc(record.note, '', id))
                            //if (record.text !== undefined)
                            //    delete_doc(trie, create_doc(record.note, record2search_payload(record), id))
                            break
                    }
                    state.log.push(commit)
                    save(state)
                    protocol.load_record(commit)
                }
            )
        )
)

onmessage = protocol
    .on_create_record(payload =>
        send({
            type: enum_type.CREATE,
            payload
        })
    )
    .on_delete_record(payload =>
        send({
            type: enum_type.DELETE,
            payload
        })
    )
    .on_search_request(request =>
        load().then(state =>
            protocol.search_response(autosubmit(state.trie, request))
        )
    )
    .onmessage
