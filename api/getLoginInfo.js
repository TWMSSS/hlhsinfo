function getLoginInfo(res, req) {
    const http = require('http');
    const { JSDOM } = require('jsdom');
    const iconv = require('iconv-lite');
    const { makeAuthCode } = require('./util.js');

    var aspSession, verifyToken;

    http.get(global.urls.main, (respond) => {
        respond.setEncoding('binary');
        aspSession = respond.headers["set-cookie"][0].split(";")[0];

        let rawData = [];
        respond.on('data', (chunk) => {
            rawData.push(Buffer.from(chunk, 'binary'));
        });
        respond.on('end', () => {
            var dt = Buffer.concat(rawData);
            var dom = new JSDOM(iconv.decode(dt, 'big5'));
            verifyToken = dom.window.document.querySelector("input[name=__RequestVerificationToken]").value;
            
            res.status(200).json(makeAuthCode(aspSession, verifyToken));
        });
    });
}

module.exports.getLoginInfo = getLoginInfo;