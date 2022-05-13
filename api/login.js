function login(req, res) {
    const request = require('request');
    const iconv = require('iconv-lite');
    const { JSDOM } = require('jsdom');
    const { decodeAuthorization, jwtEncode } = require('./util.js');

    if (!req.headers.authorization) return res.status(403).json({ message: 'You need to get your authorization token first!' });
    var authDt = decodeAuthorization(req.headers.authorization, true);
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
    }, async (err, response, body) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Something went wrong!' });
        }

        var userInfo;

        var dom = new JSDOM(iconv.decode(body, 'big5'));

        function g1() {
            return new Promise((resolve, reject) => {
                request.get({
                    url: `http://localhost:${global.PORT}/api/getUserInfoShort?jwt=false`,
                    encoding: "utf8",
                    headers: {
                        "authorization": req.headers.authorization,
                    }
                }, (err, response, body) => {
                    if (err) {
                        console.error(err);
                        return reject(err);
                    }
                    var dt = JSON.parse(body);
                    userInfo = dt.data;
                    resolve();
                });
            });
        }

        await g1();
        userInfo.userName = Buffer.from(userInfo.userName).toString("hex");
        userInfo.gender = Buffer.from(userInfo.gender).toString("hex");

        if (response.headers.location == "student/frames.asp") {
            return res.status(200).json({ message: 'Login success!', authtoken: jwtEncode({ userInfo, authtoken: req.headers.authorization.replace("Bearer ", "") }) });
        } else {
            return res.status(403).json({ message: 'Auth failed!', serverMessage: dom.window.document.querySelector("#msg").value });
        }
    });
}

module.exports.login = login;