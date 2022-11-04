async function getScoreImg(req, res) {
    const request = require('request');
    const Handlebars = require("handlebars");
    const nodeHtmlToImage = require('node-html-to-image');
    const fs = require('fs');
    const { decodeAuthorization, saveAsCache, readCache, generateCacheKey } = require('./util.js');

    if (!req.query.shared) {
        if (!req.headers.authorization) return res.status(403).json({ message: 'You need to get your authorization token first!' });
        var authDt = decodeAuthorization(req.headers.authorization);
        if (!authDt) return res.status(403).json({ message: 'Invalid authorization token!' });

        if (!req.body.year) return res.status(403).json({ message: 'You need to provide the year!' });
        if (!req.body.term) return res.status(403).json({ message: 'You need to provide the term!' });
        if (!req.body.times) return res.status(403).json({ message: 'You need to provide the times!' });
        if (!req.body.testID) return res.status(403).json({ message: 'You need to provide the testID!' });

        var { id, key, iv } = generateCacheKey(authDt.userInfo.schoolNumber, Buffer.from(authDt.userInfo.userName, "hex").toString("utf-8"), authDt.userInfo.classNumber);
        var cacheData = readCache(id, `scoreImg-${req.query.year}-${req.body.term}-${req.body.times}-${req.body.testID}`, key, iv);

        if (cacheData) {
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Cache-Control': `immutable, no-transform, s-max-age=2592000, max-age=2592000` // 30 days cache
            });
            res.end(cacheData);
            return;
        }

        var userInfo = authDt.userInfo;
        userInfo.userName = Buffer.from(userInfo.userName, "hex").toString('utf8');
        userInfo.gender = Buffer.from(userInfo.gender, "hex").toString('utf8');
    }

    var userScore;

    function g1() {
        return new Promise((resolve, reject) => {
            request.post({
                url: `http://localhost:${global.PORT}/api/getScoreInfo`,
                encoding: "utf8",
                headers: {
                    "authorization": req.headers.authorization,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                form: {
                    year: req.body.year,
                    term: req.body.term,
                    times: req.body.times,
                    testID: req.body.testID,
                    examName: "t"
                },
            }, (err, response, body) => {
                if (err) {
                    console.error(err);
                    return reject(err);
                }
                if (response.statusCode !== 200) {
                    return res.status(response.statusCode).json({ message: 'You might need to renew your authorization token!' });
                }
                var dt = JSON.parse(body);
                userScore = dt.data;
                resolve();
            });
        });
    }

    function g2() {
        return new Promise((resolve, reject) => {
            request.post({
                url: `http://localhost:${global.PORT}/api/getShared`,
                encoding: "utf8",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                form: {
                    sharedID: req.query.shared
                },
            }, (err, response, body) => {
                if (err) {
                    console.error(err);
                    return reject(err);
                }
                var dt = JSON.parse(body);
                userScore = dt.data;
                resolve();
            });
        });
    }

    if (!req.query.shared) {
        await g1();

        var year = req.body.year;
        var term = req.body.term;
        var times = req.body.times;
        var testID = req.body.testID;
    } else {
        await g2();
        if (!userScore) return res.status(403).json({ message: 'Invalid shared token!' });

        userInfo = userScore.userInfo;

        var year = userScore.scoreInfo.year;
        var term = userScore.scoreInfo.term;
        var times = userScore.scoreInfo.times;
        var testID = userScore.scoreInfo.testID;

        var { id, key, iv } = generateCacheKey(userInfo.schoolNumber, userInfo.userName, userInfo.classNumber);
        var cacheData = readCache(id, `scoreImg-${year}-${term}-${times}-${testID}`, key, iv);

        if (cacheData) {
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Cache-Control': `immutable, no-transform, s-max-age=2592000, max-age=2592000` // 30 days cache
            });
            res.end(cacheData);
            return;
        }
    }

    var list = "";

    userScore.data.forEach(dt => {
        var unpassScore = userScore.unpass.find(d => d.name === dt.name && d.type === "score");
        var unpassGPA = userScore.unpass.find(d => d.name === dt.name && d.type === "gpa");
        list += `<div class="dataBox"><span class="dataTitle">${dt.name}</span><span class="dataValue score" ${unpassScore ? 'style="color: red;"' : ''}>${dt.score}</span><span class="dataExtra">平均 <font ${unpassGPA ? 'style="color: red;"' : ''}>${dt.gpa}</font></span></div>`;
    });

    var listExtra = "";

    userScore.extra.forEach(dt => {
        listExtra += `<div class="dataBox"><span class="dataTitle">${dt.type}</span><span class="dataValue">${dt.value}</span></div>`;
    });

    const templateHTML = fs.readFileSync('api/extra/scoreImage.html', 'utf8');

    const compiledHTML = Handlebars.compile(templateHTML)({
        scoreName: `${year}學年度 ${term === "1" ? "上" : "下"}學期 第${times}次考試`,
        scoreUser: `此為 ${userInfo.className} 班 ${userInfo.userName}(${userInfo.schoolNumber}) 的成績資料`,
        scoreInfo: list,
        scoreExtra: listExtra
    });

    var image = await nodeHtmlToImage({
        html: compiledHTML,
        width: 800,
        height: 600,
        quality: 1,
        type: "png"
    });

    saveAsCache(id, `scoreImg-${year}-${term}-${times}-${testID}`, image, key, iv);

    res.writeHead(200, {
        'Content-Type': 'image/png',
        'Cache-Control': `immutable, no-transform, s-max-age=2592000, max-age=2592000` // 30 days cache
    });
    res.end(image);
}

module.exports.getScoreImg = getScoreImg;