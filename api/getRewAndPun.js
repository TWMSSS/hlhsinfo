function getRewAndPun(req, res) {
    const request = require('request');
    const { JSDOM } = require('jsdom');
    const iconv = require('iconv-lite');
    const { decodeAuthorization, isNotLogin } = require('./util.js');

    if (!req.headers.authorization) return res.status(403).json({ message: 'You need to get your authorization token first!' });
    var authDt = decodeAuthorization(req.headers.authorization);
    if (!authDt) return res.status(403).json({ message: 'Invalid authorization token!' });

    request.get({
        url: global.urls.rewandpun,
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

        var data = iconv.decode(body, 'big5');
        if (isNotLogin(data)) return res.status(403).json({ message: 'You might need to login again!' });

        var dom = new JSDOM(data);
        var status = [];

        var t = Array.from(dom.window.document.querySelector("#Table2").querySelectorAll("td"));
        t.shift();
        var y = 0;
        for (var i = 0; i < t.length; i++) {
            if (y === 0) {
                y++;
                continue;
            }
            if (y >= 8) {
                y = 0;
                continue;
            }
            if (y % 2 === 0) {
                status.push({ type: t[i - 1].textContent, times: t[i].textContent });
            }
            y++;
        }

        var detail = [];
        var d = Array.from(dom.window.document.querySelectorAll("tr.dataRow"))
        d.forEach(e => {
            var ele = Array.from(e.querySelectorAll("td"));
            detail.push({
                type: ele[0].textContent,
                start: ele[1].textContent,
                signed: ele[2].textContent,
                reason: ele[3].textContent,
                execute: ele[4].textContent,
                sold: ele[5].textContent == "\xa0" ? null : ele[5].textContent,
                year: ele[6].textContent
            })
        })

        res.status(200).json({
            message: "Success!",
            data: {
                status: status,
                detail: detail
            }
        });
    });
}

module.exports.getRewAndPun = getRewAndPun;