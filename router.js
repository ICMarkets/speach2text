const
    fs = require('fs'),
    redis = require('./redis'),
    html = () => fs.readFileSync(require('path').join(__dirname, 'index.html'), 'utf8'),
    client_js = () => fs.readFileSync(require('path').join(__dirname, 'client.js'), 'utf8'),
    worker_js = () => fs.readFileSync(require('path').join(__dirname, 'worker.js'), 'utf8'),
    search_js = () => fs.readFileSync(require('path').join(__dirname, 'search.js'), 'utf8'),
    protocol_js = () => fs.readFileSync(require('path').join(__dirname, 'protocol.js'), 'utf8'),
    localforage_min_js = () => fs.readFileSync(require('path').join(__dirname, 'localforage.min.js'), 'utf8'),
    msgpack_min_js = () => fs.readFileSync(require('path').join(__dirname, 'msgpack.min.js'), 'utf8'),
    style_css = () => fs.readFileSync(require('path').join(__dirname, 'style.css'), 'utf8'),
    url = require('url'),
    util = require('util'),
    router = {
        '/': (req, res) => {
            res.writeHead(200, {'Content-Type': 'text/html'})
            res.end(html())
        },
        '/client.js': (req, res) => {
            res.writeHead(200, {'Content-Type': 'text/javascript'})
            res.end(client_js())
        },
        '/worker.js': (req, res) => {
            res.writeHead(200, {'Content-Type': 'text/javascript'})
            res.end(worker_js())
        },
        '/search.js': (req, res) => {
            res.writeHead(200, {'Content-Type': 'text/javascript'})
            res.end(search_js())
        },
        '/protocol.js': (req, res) => {
            res.writeHead(200, {'Content-Type': 'text/javascript'})
            res.end(protocol_js())
        },
        '/style.css': (req, res) => {
            res.writeHead(200, {'Content-Type': 'text/css'})
            res.end(style_css())
        },
        '/localforage.min.js': (req, res) => {
            res.writeHead(200, {'Content-Type': 'text/javascript'})
            res.end(localforage_min_js())
        },
        '/msgpack.min.js': (req, res) => {
            res.writeHead(200, {'Content-Type': 'text/javascript'})
            res.end(msgpack_min_js())
        },
        '/health': (req, res) => {
            res.writeHead(200, {'Content-Type': 'text/plain'})
            res.end()
        },
        '/favicon.ico': (req, res) => {
            res.writeHead(200, {'Content-Type': 'text/plain'})
            res.end()
        }
    }

function mp3 (db, pathname, res) {
    const id = pathname.replace('/public/', '').replace('.mp3', '')
    pathname = '.' + pathname
    db.hget(redis.FILES, id, (e, mp3) => {
        if (e) {
            console.log('error', e)
            return  res.end()
        }
        fs.writeFile(pathname, mp3, e => {
            if (e) console.log('can not write file', pathname, e)
            const stat = fs.statSync(pathname)
            res.writeHead(200, {
                'Content-Type': 'audio/mpeg',
                'Content-Length': stat.size
            })
            fs.createReadStream(pathname).pipe(res)
        })

    })
}

module.exports = db => (req, res) => {
    const
        pathname = url.parse(req.url).pathname


    router[pathname]
        ? router[pathname](req, res)
        : pathname.indexOf('/public') === 0
            ? mp3(db, pathname, res)
            : res.end()
}
