const
    http = require('http'),
    fs = require('fs'),
    WebSocket = require('ws'),
    consumers = require('./consumers'),
    {port, format} = require('./config'),
    handshake = require('./handshake'),
    router = require('./router'),
    redis = require('./redis'),
    fetch = require('node-fetch'),
    Headers = fetch.Headers,
    msgpack = require('msgpack-lite'),
    arrayBufferToBuffer = require('arraybuffer-to-buffer'),
    ffmpegPath = require('@ffmpeg-installer/ffmpeg').path,
    ffmpeg = require('fluent-ffmpeg'),
    streamifier = require('streamifier'),
    create_socket_send = ws => issue => (ws.readyState === 1) && ws.send(issue),
    CREATE = 0,
    CONVERTED = 1,
    RECOGNIZED = 2,
    DELETE = 3

ffmpeg.setFfmpegPath(ffmpegPath)

module.exports.start_ws_server = () =>
    redis((e, db) => db.lrange(redis.LOG, 0, -1, (err, _) => {
        const
            server = http.createServer(router(db)),
            wss = new WebSocket.Server({noServer: true}),
            log = _.length ? _ : []

        server.on('upgrade', (req, socket, head) =>
            handshake(req, {
                consumer: offset =>
                    wss.handleUpgrade(req, socket, head, ws => {
                        const consumer = create_socket_send(ws)
                        ws.onclose = () => consumers.del(consumer)
                        ws.onerror = () => ws.close()
                        ws.binaryType = 'arraybuffer';
                        ws.onmessage = ({data}) => {
                            const {type, payload} = msgpack.decode(new Uint8Array(data))
                            if (type === DELETE) {
                                const {id} = payload
                                const pack_delete = msgpack.encode({
                                    type: DELETE,
                                    payload: {
                                        id,
                                        deleted: true,
                                        deleted_time: Date.now()
                                    }
                                })
                                db.rpush(
                                    redis.LOG,
                                    pack_delete,
                                    e => {
                                        if (e) process.exit(console.log(e))
                                        log.push(pack_delete)
                                        consumers.get_all().forEach(_ => _(pack_delete))
                                    }
                                )
                            } else {
                                const {file, note} = payload

                                const file_buffer = arrayBufferToBuffer(file)
                                const id = Date.now() + Math.random()
                                const pack_create = msgpack.encode({
                                    type: CREATE,
                                    payload: {
                                        id,
                                        note,
                                        create_time: Date.now()
                                    }
                                })
                                db.rpush(
                                    redis.LOG,
                                    pack_create,
                                    e => {
                                        if (e) process.exit(console.log(e))
                                        log.push(pack_create)
                                        consumers.get_all().forEach(_ => _(pack_create))
                                    }
                                )

                                const out_file_name = id + '.' + format.to
                                ffmpeg(streamifier.createReadStream(file_buffer))
                                    .fromFormat(format.from)
                                    .toFormat(format.to)
                                    .output(out_file_name)
                                    .on('end', (x) =>
                                        console.dir(x) || fs.readFile(out_file_name, (e, converted_file_buffer) =>
                                            db.hset(redis.FILES, id, converted_file_buffer, e => {
                                                if (e) process.exit(console.log(e))
                                                fs.unlink(out_file_name, e => e && process.exit(console.log(e)))
                                                const pack_update = msgpack.encode({
                                                    type: CONVERTED,
                                                    payload: {
                                                        id,
                                                        audio_link: '/public/' + out_file_name,
                                                        converted_time: Date.now()
                                                    }
                                                })
                                                log.push(pack_update)
                                                consumers.get_all().forEach(_ => _(pack_update))
                                            })
                                        )
                                    )
                                    .run()

                                fetch(
                                    'https://gateway-lon.watsonplatform.net/speech-to-text/api/v1/recognize?model=en-US_NarrowbandModel',
                                    {
                                        method: 'post',
                                        body: file_buffer,
                                        headers: new Headers({
                                            'Content-Type': 'audio/basic',
                                            'Authorization': 'Basic ' + Buffer.from('apikey:SbF_X4RNAbPAD2If9es0u1TliJDjdKOS8Gd4l-sJEXfk').toString('base64')
                                        })
                                    }
                                )
                                    .then(res => res.json())
                                    .then(text => {
                                        const pack_update = msgpack.encode({
                                            type: RECOGNIZED,
                                            payload: {
                                                id,
                                                text,
                                                recognized_time: Date.now()
                                            }
                                        })
                                        db.rpush(
                                            redis.LOG,
                                            pack_update,
                                            e => {
                                                if (e) process.exit(console.log(e))
                                                log.push(pack_update)
                                                consumers.get_all().forEach(_ => _(pack_update))
                                            }
                                        )
                                    })
                                    .catch(e => process.exit(console.log(e)))
                            }
                        }

                        consumers.add(consumer)
                        while (offset < log.length) !log[offset].deleted && consumer(log[offset++])
                    })
            })
        )

        server.listen(port)
    }))
