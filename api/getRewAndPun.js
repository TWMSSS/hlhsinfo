function getRewAndPun(req, res) {
    const request = require('request');
    const { JSDOM } = require('jsdom');
    const iconv = require('iconv-lite');
    const { decodeAuthorization, isNotLogin, saveAsCache, readCache, generateCacheKey, recordAPIUsage } = require('./util.js');

    recordAPIUsage("getRewAndPun", "pendding");

    if (!req.headers.authorization) return res.status(403).json({ message: 'You need to get your authorization token first!' });
    var authDt = decodeAuthorization(req.headers.authorization);
    if (!authDt) return res.status(403).json({ message: 'Invalid authorization token!' });

    const { id, key, iv } = generateCacheKey(authDt.userInfo.schoolNumber, Buffer.from(authDt.userInfo.userName, "hex").toString("utf-8"), authDt.userInfo.classNumber);
    var cacheData = readCache(id, "rewandpun", key, iv);

    if (cacheData) return res.status(200).json({
        message: "Success!",
        cached: true,
        data: JSON.parse(cacheData.toString())
    });

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

        let list = Array.from(dom.window.document.querySelectorAll("table>tbody")).slice(-2);
        let r = Array.from(list[0].querySelectorAll("td"));
        var y = 0;
        for (var i = 0; i < r.length; i++) {
            if (y === 0) {
                y++;
                continue;
            }
            if (y >= 8) {
                y = 0;
                continue;
            }
            if (y % 2 === 0) {
                status.push({ type: r[i - 1].textContent, times: r[i].textContent });
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
        });
        
        const output = {
            status: status,
            detail: detail
        };

        saveAsCache(id, "rewandpun", Buffer.from(JSON.stringify(output)), key, iv);
        recordAPIUsage("getRewAndPun", "success");

        res.status(200).json({
            message: "Success!",
            data: output
        });
    });
}

module.exports.getRewAndPun = getRewAndPun;