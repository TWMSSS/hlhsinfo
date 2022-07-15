function getLoginInfo(res, req) {
    const request = require('request');
    const { JSDOM } = require('jsdom');
    const iconv = require('iconv-lite');
    const { makeAuthCode, getFailedTimesLock } = require('./util.js');

    var aspSession, verifyToken;

    var failed = global.loginFailed.find(e => e.ip == req.ip && e.device == req.headers['user-agent']);
    if (failed && failed.expire > Date.now() && failed.count > getFailedTimesLock()) return res.status(403).json({
        message: 'Auth failed!',
        serverMessage: "你的登入失敗次數過多，請稍後再試。"
    });

    request.get({
        url: global.urls.main,
        encoding: null
    }, (err, response, body) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Something went wrong!' });
        }

        aspSession = response.headers["set-cookie"][0].split(";")[0];

        var rawData = iconv.decode(body, 'big5');

        var dom = new JSDOM(rawData);
        verifyToken = dom.window.document.querySelector("input[name=__RequestVerificationToken]").value;
        
        res.status(200).json(makeAuthCode(aspSession, verifyToken));
    });
}

module.exports.getLoginInfo = getLoginInfo;