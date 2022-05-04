function getLoginCaptcha(req, res) {
    if (!req.headers.authorization) return res.status(403).json({ message: 'You need to get your authorization token first!' });

    const http = require('http');
    const { decodeAuthorization } = require('./util.js');

    var authDt = decodeAuthorization(req.headers.authorization);
    if (!authDt) return res.status(403).json({ message: 'Invalid authorization token!' });

    http.get({
        host: new URL(global.urls.main).host,
        path: new URL(global.urls.main).pathname + "image/vcode.asp?vcode=" + Math.floor(Math.random() * 1000000),
        method: 'GET',
        headers: {
            "cookie": decodeAuthorization(req.headers.authorization).sessionID
        }
    }, (respond) => {
        respond.setEncoding('binary');

        let rawData = [];
        respond.on('data', (chunk) => {
            rawData.push(Buffer.from(chunk, 'binary'));
        });
        respond.on('end', async () => {
            var dt = Buffer.concat(rawData);
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Length': dt.length
            }).end(dt);
        });
    });
}

module.exports.getLoginCaptcha = getLoginCaptcha;