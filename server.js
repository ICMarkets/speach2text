let
    on_add_first_worker = null,
    once = true
const
    RECORDS = '8x8-records',
    http = require('http'),
    WebSocket = require('ws'),
    consumers = require('./consumers'),
    {port} = require('./config'),
    handshake = require('./handshake'),
    router = require('./router'),
    redis = require('./redis'),
    create_socket_send = ws => issue => (ws.readyState === 1) && ws.send(issue)


module.exports.start_ws_server = () =>
    redis((e, db) => db.lrange(redis.RECORDS, 0, -1, (err, _) => {
        const
            server = http.createServer(router),
            wss = new WebSocket.Server({noServer: true}),
            chains = _ || []

        server.on('upgrade', (req, socket, head) =>
            handshake(req, {
                consumer: offset =>
                    wss.handleUpgrade(req, socket, head, ws => {
                        const consumer = create_socket_send(ws)
                        ws.onclose = () => consumers.del(consumer)
                        ws.onerror = () => ws.close()
                        ws.onmessage = ({data}) => {
                            const {file, note} = JSON.parse(data)
                            console.log(file, note)
                        }
                        consumers.add(consumer)
                        while (offset < chains.length) consumer(chains[offset++])
                    })
            })
        )

        server.listen(port)
    }))

module.exports.on_add_first_worker = _ => on_add_first_worker = _
