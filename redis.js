const redis = require('redis')
const config = require('./config')
const default_error = 'Can not connect to ' + config.redis_host + ':' + config.redis_port
var   client

function init (cb) {
    client = redis.createClient(config.redis_port, config.redis_host, {'return_buffers': true})
    client.on('error', error => cb(error || default_error))
    client.on('ready', () => cb(null, client))
}

module.exports = cb =>
    client
        ? client.closing
            ? init(cb)
            : client.connected
                ? client.ready
                    ? cb(null, client)
                    : client.quit() || init(cb)
                : client.quit
                    ? client.quit() || init(cb)
                    : init(cb)
        : init(cb)

module.exports.RECORDS = 'RECORDS'
