function getSchedule(req, res) {
    const request = require('request');
    const { JSDOM } = require('jsdom');
    const iconv = require('iconv-lite');
    const { decodeAuthorization, isNotLogin, saveAsCache, readCache, generateCacheKey, recordAPIUsage } = require('./util.js');

    recordAPIUsage("getSchedule", "pendding");

    if (!req.headers.authorization) return res.status(403).json({ message: 'You need to get your authorization token first!' });
    var authDt = decodeAuthorization(req.headers.authorization);
    if (!authDt) return res.status(403).json({ message: 'Invalid authorization token!' });

    if (!req.query.class) return res.status(403).json({ message: 'You need to provide the class!' });
    if (!req.query.teacher) return res.status(403).json({ message: 'You need to provide the teacher!' });

    const { id, key, iv } = generateCacheKey(authDt.userInfo.schoolNumber, Buffer.from(authDt.userInfo.userName, "hex").toString("utf-8"), authDt.userInfo.classNumber);
    var cacheData = readCache(id, `schedule-${req.query.class}-${Buffer.from(req.query.teacher).toString("hex")}`, key, iv);

    if (cacheData) return res.status(200).json({
        message: "Success!",
        cached: true,
        data: JSON.parse(cacheData.toString())
    });

    var url = global.urls.schedule.replace("%class%", req.query.class).replace("%teacher%", encodeURIComponent(req.query.teacher));

    request.get({
        url: url,
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
        
        var l = Array.from(dom.window.document.querySelector("table.TimeTable.top.left.spacing2.padding2").querySelectorAll("tr"));
        l.shift();
        l = l.map(e => {
            var arr = Array.from(e.querySelectorAll("td"));
            if (arr.length > 8) {
                arr.shift();
            }
            if (arr.length <= 1) {
                arr = null;
            }
            if (!arr) return null;
            var section = arr.shift().innerHTML;
            var timeArr = arr.shift().innerHTML.split("<br>").map(e => e.replace(/ /gm, ""));
            var d = {
                section,
                time: {
                    start: timeArr[0],
                    end: timeArr[2]
                }
            }

            arr = arr.map(e => {
                if (!e.classList.contains("sectionItem")) return null;

                var t = e.innerHTML.split("<br>");
                var location = null;
                t.pop();
                t.forEach((p, index) => {
                    var b = p.includes("<span class=\"RoomName\">");
                    if (b) {
                        location = p.replace(/<span class=\"RoomName\">(\W*\w*)<\/span>/gm, "$1");
                        t.splice(index, 1);
                    }
                });
                if (t.length === 0) t = [null, null];
                t = t.map(e => e.replace(/<span class=\"eudcFont\">(.*)<\/span>/gm, "$1"));

                return {
                    className: t.shift().replace(/ /gm, ""),
                    location,
                    teacher: t
                };
            });

            d.class = arr;

            return d;
        });

        var dO = dom.window.document.querySelector("div.center[style]").innerHTML.replace(/ /gm, "").replace(/[^\S]+/gm, "").split("：")[2].split("～");
        var start = dO[0];
        var end = dO[1];

        var data = {
            schedule: l,
            time: {
                start,
                end
            }
        };

        saveAsCache(id, `schedule-${req.query.class}-${Buffer.from(req.query.teacher).toString("hex")}`, Buffer.from(JSON.stringify(data)), key, iv);
        recordAPIUsage("getSchedule", "success");

        res.status(200).json({
            message: "Success!",
            data
        });
    });
}

module.exports.getSchedule = getSchedule;