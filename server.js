const
    http = require('http'),
    fs = require('fs'),
    WebSocket = require('ws'),
    consumers = require('./consumers'),
    {port} = require('./config'),
    handshake = require('./handshake'),
    router = require('./router'),
    redis = require('./redis'),
    fetch = require('node-fetch'),
    Headers = fetch.Headers,
    msgpack = require('msgpack-lite'),
    arrayBufferToBuffer = require('arraybuffer-to-buffer'),
    spawn = require('child_process').spawn,
    create_socket_send = ws => issue => (ws.readyState === 1) && ws.send(issue)


module.exports.start_ws_server = () =>
    redis((e, db) => db.lrange(redis.RECORDS, 0, -1, (err, _) => {
        const
            server = http.createServer(router),
            wss = new WebSocket.Server({noServer: true}),
            records = _.length ? _ : [
                //msgpack.encode({
                //    file: "bla-bla-bla010111010001",
                //    note: "some record",
                //    time: Date.now(),
                //    text: "Hi A, Hi B, .."
                //}),
                //msgpack.encode({
                //    file: "bla-bla-bla010101010001",
                //    note: "some other record",
                //    time: Date.now() + 1000,
                //    text: "Hi C, Hi D, .."
                //})
            ]

        server.on('upgrade', (req, socket, head) =>
            handshake(req, {
                consumer: offset =>
                    wss.handleUpgrade(req, socket, head, ws => {
                        const consumer = create_socket_send(ws)
                        ws.onclose = () => consumers.del(consumer)
                        ws.onerror = () => ws.close()
                        ws.binaryType = 'arraybuffer';
                        ws.onmessage = ({data}) => {
                            const {file, note} = msgpack.decode(new Uint8Array(data))
                            fetch(
                                'https://gateway-lon.watsonplatform.net/speech-to-text/api/v1/recognize?model=en-US_NarrowbandModel',
                                {
                                    method: 'post',
                                    body: arrayBufferToBuffer(file),
                                    headers: new Headers({
                                        'Content-Type': 'audio/basic',
                                        'Authorization': 'Basic ' + Buffer.from("apikey:SbF_X4RNAbPAD2If9es0u1TliJDjdKOS8Gd4l-sJEXfk").toString('base64')
                                    })
                                }
                            )
                                .then(res => res.json())
                                .then(text =>
                                    msgpack.encode({
                                        file,
                                        note,
                                        time: Date.now(),
                                        text
                                    })
                                )
                                .then(pack =>
                                    db.rpush(
                                        redis.RECORDS,
                                        pack,
                                        () => {
                                            records.push(pack)
                                            consumers.get_all().forEach(_ => _(pack))
                                        }
                                    )
                                )
                                .catch(console.log(e))
                        }

                        consumers.add(consumer)
                        while (offset < records.length) consumer(records[offset++])
                    })
            })
        )

        server.listen(port)
    }))
