const
    fs = require('fs'),
    html = fs.readFileSync(require('path').join(__dirname, 'index.html'), 'utf8'),
    bundle_js = fs.readFileSync(require('path').join(__dirname, 'bundle.js'), 'utf8'),
    worker_js = fs.readFileSync(require('path').join(__dirname, 'worker.js'), 'utf8'),
    protocol_js = fs.readFileSync(require('path').join(__dirname, 'protocol.js'), 'utf8'),
    localforage_min_js = fs.readFileSync(require('path').join(__dirname, 'localforage.min.js'), 'utf8'),
    style_css = fs.readFileSync(require('path').join(__dirname, 'style.css'), 'utf8'),
    url = require('url'),
    router = {
        '/': (req, res) => {
            res.writeHead(200, {'Content-Type': 'text/html'})
            res.end(html)
        },
        '/bundle.js': (req, res) => {
            res.writeHead(200, {'Content-Type': 'text/javascript'})
            res.end(bundle_js)
        },
        '/worker.js': (req, res) => {
            res.writeHead(200, {'Content-Type': 'text/javascript'})
            res.end(worker_js)
        },
        '/protocol.js': (req, res) => {
            res.writeHead(200, {'Content-Type': 'text/javascript'})
            res.end(protocol_js)
        },
        '/style.css': (req, res) => {
            res.writeHead(200, {'Content-Type': 'text/css'})
            res.end(style_css)
        },
        '/localforage.min.js': (req, res) => {
            res.writeHead(200, {'Content-Type': 'text/javascript'})
            res.end(localforage_min_js)
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

module.exports = (req, res) => {
    const
        pathname = url.parse(req.url).pathname

    router[pathname]
        ? router[pathname](req, res)
        : res.end()
}
