/*global importScripts protocol localforage delete_doc create_doc insert_doc autosubmit create_trie msgpack*/
importScripts('localforage.min.js')
importScripts('msgpack.min.js')
importScripts('protocol.js')
importScripts('search.js')

const
    WS_URL = location.protocol.replace('http', 'ws') + '//' + location.host + '/ws',
    DB_KEY = '8x8-records',
    STATE = 'state',
    save = state => {
        self[STATE] = state
        return localforage.setItem(DB_KEY, msgpack.encode(state))
    },
    load = () =>
        self[STATE]
            ? console.log(self[STATE]) || Promise.resolve(self[STATE])
            : localforage.getItem(DB_KEY).then(_ =>
                _
                    ? msgpack.decode(_)
                    : {
                        records: [],
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
        ws = new WebSocket(url, String(state.records.length))
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
            state.records.forEach(record =>
                protocol.load_record({
                    text: record.text,
                    note: record.note,
                    time: record.time
                })
            )
            return state
        })
        .then(state =>
            connection(
                WS_URL,
                state,
                record => {
                    const id = state.records.length
                    state.records.push(record)
                    insert_doc(state.trie, create_doc(record.note, record2search_payload(record), id))
                    save(state)
                    protocol.load_record({
                        text: record.text,
                        note: record.note,
                        time: record.time
                    })
                }
            )
        )
)

onmessage = protocol
    .on_create_record(({file, note}) => send({file, note}))
    .on_delete_record(id =>
        load().then(state => {
            const record = state.records[id]
            state.records.splice(id, 1)
            delete_doc(state.trie, create_doc(record.note, record2search_payload(record), id))
            save(state)
        })
    )
    .on_search_request(request =>
        load().then(state =>
            protocol.search_response(autosubmit(state.trie, request))
        )
    )
    .on_audio_request(id =>
        load().then(state =>
            protocol.audio_response({
                file: state.records[id].file,
                id
            })
        )
    )
    .onmessage
