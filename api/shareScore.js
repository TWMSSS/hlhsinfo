async function shareScore(req, res) {
    const request = require('request');
    const { decodeAuthorization, isNotLogin, makeRandomString } = require('./util.js');

    if (!req.headers.authorization) return res.status(403).json({ message: 'You need to get your authorization token first!' });
    var authDt = decodeAuthorization(req.headers.authorization);
    if (!authDt) return res.status(403).json({ message: 'Invalid authorization token!' });

    if (!req.body.year) return res.status(403).json({ message: 'You need to provide the year!' });
    if (!req.body.term) return res.status(403).json({ message: 'You need to provide the term!' });
    if (!req.body.times) return res.status(403).json({ message: 'You need to provide the times!' });

    var userInfo, userScore;

    function g1() {
        return new Promise((resolve, reject) => {
            request.get({
                url: `http://localhost:${global.PORT}/api/getUserInfoShort`,
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

    function g2() {
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
                    examName: "t"
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

    await Promise.all([g1(), g2()]);

    var expired = Date.now() + 1000 * 60 * 30;
    var created = Date.now();
    var sharedID = makeRandomString(6);

    global.sharedScores.scores.push({
        id: sharedID,
        data: {
            year: req.body.year,
            term: req.body.term,
            times: req.body.times,
            userInfo,
            userScore
        },
        expiredTimestamp: expired,
        createdTimestamp: created
    });

    console.log(global.sharedScores.scores);

    setTimeout(() => {
        var index = global.sharedScores.scores.findIndex(dt => dt.id === req.body.id);
        if (index >= 0) {
            global.sharedScores.scores.splice(index, 1);
        }
    }, expired - created);

    res.status(200).json({
        message: "Success!",
        data: {
            id: sharedID,
            expiredTimestamp: expired,
            createdTimestamp: created
        }
    })
}

module.exports.shareScore = shareScore;