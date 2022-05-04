function getLoginCaptcha(req, res) {
    if (!req.headers.authorization) {
        return res.status(403).json({ message: 'You need to get your authorization token first!' });
    }

    const http = require('http');
    const { decodeAuthCode } = require('./util.js');

    http.get({
        host: new URL(global.urls.main).host,
        path: new URL(global.urls.main).pathname + "image/vcode.asp?vcode=" + Math.floor(Math.random() * 1000000),
        method: 'GET',
        headers: {
            "cookie": decodeAuthCode(req.headers.authorization).sessionID
        }
    }, (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
            rawData += chunk;
        }   );
        res.on('end', async () => {
            var dt = new Buffer.from(rawData, 'binary');
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Length': dt.length
            }).end(dt);
        });
    });
}