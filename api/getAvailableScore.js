function getAvailableScore(req, res) {
    const request = require('request');
    const { JSDOM } = require('jsdom');
    const iconv = require('iconv-lite');
    const { decodeAuthorization, isNotLogin, saveAsCache, readCache, generateCacheKey } = require('./util.js');

    if (!req.headers.authorization) return res.status(403).json({ message: 'You need to get your authorization token first!' });
    var authDt = decodeAuthorization(req.headers.authorization);
    if (!authDt) return res.status(403).json({ message: 'Invalid authorization token!' });

    const { id, key, iv } = generateCacheKey(authDt.userInfo.schoolNumber, Buffer.from(authDt.userInfo.userName, "hex").toString("utf-8"), authDt.userInfo.classNumber);
    var cacheData = readCache(id, "availableScore", key, iv);

    if (cacheData) return res.status(200).json({
        message: "Success!",
        cached: true,
        data: JSON.parse(cacheData.toString())
    });

    request.get({
        url: global.urls.availableScore,
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

        var optt = [];
        var table = Array.from(dom.window.document.getElementById("ddlExamList").options);
        table.splice(0, 2);
        table.map(e => {
            var url = new URL("http://example.com/" + e.value);
            var term = url.searchParams.get('thisterm');
            var year = url.searchParams.get('thisyear');
            var testID = url.searchParams.get('number');
            var times = testID.substring(3, 4);
            var name = e.innerHTML;
            var type = 1;
            if (name.includes("平時成績")) type = 2;
            optt.push({ term, year, testID, name, times, type });
        });
        optt.sort((a, b) => {
            return a.term - b.term || a.year - b.year || a.testID - b.testID;
        });

        saveAsCache(id, "availableScore", Buffer.from(JSON.stringify(optt)), key, iv);

        res.status(200).json({ message: 'Success!', data: optt });
    });
}

module.exports.getAvailableScore = getAvailableScore;