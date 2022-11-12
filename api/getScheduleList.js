function getScheduleList(req, res) {
    const request = require('request');
    const { JSDOM } = require('jsdom');
    const iconv = require('iconv-lite');
    const { decodeAuthorization, isNotLogin, saveAsCache, readCache, generateCacheKey, recordAPIUsage } = require('./util.js');

    recordAPIUsage("getScheduleList", "pendding");

    if (!req.headers.authorization) return res.status(403).json({ message: 'You need to get your authorization token first!' });
    var authDt = decodeAuthorization(req.headers.authorization);
    if (!authDt) return res.status(403).json({ message: 'Invalid authorization token!' });

    const { id, key, iv } = generateCacheKey(authDt.userInfo.schoolNumber, Buffer.from(authDt.userInfo.userName, "hex").toString("utf-8"), authDt.userInfo.classNumber);
    var cacheData = readCache(id, "scheduleList", key, iv);

    if (cacheData) return res.status(200).json({
        message: "Success!",
        cached: true,
        data: JSON.parse(cacheData.toString())
    });

    request.get({
        url: global.urls.scheduleList,
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
        
        var t = Array.from(dom.window.document.querySelector("#ddlClasses").querySelectorAll("option"));
        t.shift();
        t = t.map(e => {
            var o = new URL("https://example.com/" + e.value);
            return {
                name: e.innerHTML.replace(/ /gm, ""),
                class: o.searchParams.get("teacher_classnumber"),
                teacher: e.innerHTML.replace(/ /gm, "").split("│")[2]
            }
        })

        var data = {
            schedules: t
        };

        saveAsCache(id, "scheduleList", Buffer.from(JSON.stringify(data)), key, iv);
        recordAPIUsage("getSchedule", "success");

        res.status(200).json({
            message: "Success!",
            data
        });
    });
}

module.exports.getScheduleList = getScheduleList;