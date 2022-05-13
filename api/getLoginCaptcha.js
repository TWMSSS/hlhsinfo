function getLoginCaptcha(req, res) {
    const request = require('request');
    const { decodeAuthorization } = require('./util.js');

    if (!req.headers.authorization) return res.status(403).json({ message: 'You need to get your authorization token first!' });
    var authDt = decodeAuthorization(req.headers.authorization, true);
    if (!authDt) return res.status(403).json({ message: 'Invalid authorization token!' });

    request.get({
        url: global.urls.main + "image/vcode.asp",
        encoding: null,
        headers: {
            "cookie": authDt.sessionID,
        }
    }, (err, response, body) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Something went wrong!' });
        };
        if (response.statusCode !== 200) return res.status(response.statusCode).json({ message: 'You might need to renew your authorization token!' });

        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': body.length
        }).end(body);
    });
}

module.exports.getLoginCaptcha = getLoginCaptcha;