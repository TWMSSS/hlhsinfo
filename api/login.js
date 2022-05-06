function login(req, res) {
    const request = require('request');
    const iconv = require('iconv-lite');
    const { JSDOM } = require('jsdom');
    const { decodeAuthorization } = require('./util.js');

    if (!req.headers.authorization) return res.status(403).json({ message: 'You need to get your authorization token first!' });
    var authDt = decodeAuthorization(req.headers.authorization);
    if (!authDt) return res.status(403).json({ message: 'Invalid authorization token!' });
    
    var { sessionID, verifyToken } = authDt;

    if (!req.body.captcha) return res.status(403).json({ message: 'You need to get your captcha first!' });
    if (!req.body.username) return res.status(403).json({ message: 'You need to input your username!' });
    if (!req.body.password) return res.status(403).json({ message: 'You need to input your password!' });

    request({
        url: global.urls.login,
        method: 'POST',
        headers: {
            "cookie": sessionID,
            "content-type": "application/x-www-form-urlencoded",
        },
        form: {
            __RequestVerificationToken: verifyToken,
            division: "senior",
            Loginid: req.body.username,
            LoginPwd: req.body.password,
            Uid: "",
            vcode: req.body.captcha,
        },
        encoding: null,
    }, (err, response, body) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Something went wrong!' });
        }

        var dom = new JSDOM(iconv.decode(body, 'big5'));

        if (response.headers.location == "student/frames.asp") {
            return res.status(200).json({ message: 'Login success!' });
        } else {
            return res.status(403).json({ message: 'Auth failed!', serverMessage: dom.window.document.querySelector("#msg").value });
        }
    });
}

module.exports = {
    login
};