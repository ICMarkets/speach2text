const
    CONSUMER = '/ws/consumer',
    url = require('url'),
    is_consumer = _ => Number(_) >= 0

module.exports = (req, cbs) => {
    const
        key_value_headers = req.rawHeaders.reduce(
            (headers, key, i) => {
                if (!(i & 1)) {
                    headers[String(key).toLowerCase()] = req.rawHeaders[i + 1]
                }

                return headers
            },
            {}
        ),
        password = key_value_headers['sec-websocket-protocol']

    return cbs.consumer(Number(password))
}
