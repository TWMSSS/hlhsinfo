async function shareScore(req, res) {
    const request = require('request');
    const crypto = require('crypto');
    const { decodeAuthorization, makeRandomString, getExpiredTime, recordAPIUsage } = require('./util.js');

    recordAPIUsage("shareScore", "pendding");

    if (!req.headers.authorization) return res.status(403).json({ message: 'You need to get your authorization token first!' });
    var authDt = decodeAuthorization(req.headers.authorization);
    if (!authDt) return res.status(403).json({ message: 'Invalid authorization token!' });

    if (!req.body.year) return res.status(403).json({ message: 'You need to provide the year!' });
    if (!req.body.term) return res.status(403).json({ message: 'You need to provide the term!' });
    if (!req.body.times) return res.status(403).json({ message: 'You need to provide the times!' });
    if (!req.body.testID) return res.status(403).json({ message: 'You need to provide the testID!' });

    var userInfo = authDt.userInfo;
    userInfo.userName = Buffer.from(userInfo.userName, "hex").toString('utf8');
    userInfo.gender = Buffer.from(userInfo.gender, "hex").toString('utf8');

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
                var dt = JSON.parse(body);
                userScore = dt.data;
                resolve();
            });
        });
    }

    var verifyText = `${userInfo.schoolNumber}-${req.body.year}-${req.body.term}-${req.body.times}-${req.body.testID}`;
    var hashedTkn = crypto.createHash('sha256').update(Buffer.from(verifyText)).digest('hex');
    var dataTemp = global.sharedScores.scores.find(x => x.hashedTkn === hashedTkn);
    if (dataTemp && dataTemp.expiredTimestamp <= Date.now()) {
        global.sharedScores.scores.splice(global.sharedScores.scores.indexOf(dataTemp), 1);
        dataTemp = null;
    }
    var sharedID;

    if (!dataTemp) {
        await g1();

        var expired = Date.now() + getExpiredTime();
        var created = Date.now();
        sharedID = makeRandomString(6);

        global.sharedScores.scores.push({
            id: sharedID,
            data: {
                year: req.body.year,
                term: req.body.term,
                times: req.body.times,
                testID: req.body.testID,
                userInfo,
                userScore
            },
            expiredTimestamp: expired,
            createdTimestamp: created,
            hashedTkn
        });
    } else {
        var expired = dataTemp.expiredTimestamp;
        var created = dataTemp.createdTimestamp;
        sharedID = dataTemp.id;

        userInfo = dataTemp.data.userInfo;
        userScore = dataTemp.data.userScore;
    }

    recordAPIUsage("shareScore", "success");

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