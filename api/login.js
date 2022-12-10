function login(req, res) {
    const request = require('request');
    const iconv = require('iconv-lite');
    const { JSDOM } = require('jsdom');
    const { decodeAuthorization, jwtEncode, getFailedExpiredTime, getFailedTimesLock, recordAPIUsage } = require('./util.js');

    recordAPIUsage("login", "pendding");

    if (!req.headers.authorization) return res.status(403).json({ message: 'You need to get your authorization token first!' });
    var authDt = decodeAuthorization(req.headers.authorization, true);
    if (!authDt) return res.status(403).json({ message: 'Invalid authorization token!' });
    
    var { sessionID, verifyToken, url } = authDt;

    // if (!req.body.captcha) return res.status(403).json({ message: 'You need to get your captcha first!' });
    if (!req.body.username) return res.status(403).json({ message: 'You need to input your username!' });
    if (!req.body.password) return res.status(403).json({ message: 'You need to input your password!' });

    var failed = global.loginFailed.find(e => e.ip == req.ip && e.device == req.headers['user-agent']);
    if (failed && failed.expire > Date.now() && failed.count > getFailedTimesLock()) return res.status(403).json({
        message: 'Auth failed!',
        serverMessage: "你的登入失敗次數過多，請稍後再試。"
    });

    request({
        url: url ? url + global.defaultURLs.login : global.urls.login,
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
        
        if (response.headers.location != "student/frames.asp") {
            var ip = req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"]?.split(", ")[0] || req.ip;

            var userAgent = req.headers['user-agent'];
            var device = userAgent.split("(")[1].split(")")[0];

            var failed = global.loginFailed.find(e => e.ip == ip && e.device == device);
            if (failed && failed.expire < Date.now()) {
                global.loginFailed.splice(global.loginFailed.indexOf(failed), 1);
                global.loginFailed.push({ ip: ip, device: device, start: Date.now(), count: 0 });
            } else if (!failed) {
                global.loginFailed.push({ ip: ip, device: device, start: Date.now(), count: 0 });
                failed = global.loginFailed.find(e => e.ip == ip && e.device == device);
            }
            failed.expire = Date.now() + getFailedExpiredTime();
            failed.count++;

            recordAPIUsage("login", "failed");

            return res.status(403).json({
                message: 'Auth failed!',
                serverMessage: dom.window.document.querySelector("#msg").value
            });
        }

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
        recordAPIUsage("login", "success");

        return res.status(200).json({ message: 'Login success!', authtoken: jwtEncode({ userInfo, authtoken: req.headers.authorization.replace("Bearer ", "") }) });
    });
}

module.exports.login = login;