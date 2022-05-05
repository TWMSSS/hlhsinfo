function getScoreInfo(req, res) {
    const request = require('request');
    const { JSDOM } = require('jsdom');
    const iconv = require('iconv-lite');
    const { decodeAuthorization, isNotLogin, urlEncode, getN1 } = require('./util.js');

    if (!req.headers.authorization) return res.status(403).json({ message: 'You need to get your authorization token first!' });
    var authDt = decodeAuthorization(req.headers.authorization);
    if (!authDt) return res.status(403).json({ message: 'Invalid authorization token!' });

    if (!req.body.year) return res.status(403).json({ message: 'You need to provide the year!' });
    if (!req.body.term) return res.status(403).json({ message: 'You need to provide the term!' });
    if (!req.body.times) return res.status(403).json({ message: 'You need to provide the times!' });
    if (!req.body.examName) return res.status(403).json({ message: 'You need to provide the exam name!' });

    var scoreID = `${getN1(req.body.year, 0, req.body.term)}${req.body.term}${req.body.times}`;

    var url = global.urls.grade.replace("%action%", "%A6U%A6%A1%A6%A8%C1Z").replace("%year%", req.body.year).replace("%term%", req.body.term).replace("%grade_ID%", scoreID).replace("%exam_name%", urlEncode(req.body.examName, 'big5'));

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

        var scores = {data: [], unpass: [], extra: []};

        dom.window.document.querySelectorAll("table[id=Table1] tr").forEach((tr) => {
            var tds = tr.querySelectorAll("td");
            try {
                var g = tds[1].textContent.replace(/ /gm, "").replace(/\r\n/gm, "").replace(/\n/gm, "");
            } catch (e) {
                var g = "qqq";
            };
            if (tds.length > 0 && !Number.isNaN(Number(g))) {
                var name = tds[0].textContent.replace(/ /gm, "");
                var score = tds[1].textContent.replace(/ /gm, "").replace(/\r\n/gm, "").replace(/\n/gm, "");
                var gpa = tds[2].textContent.replace(/ /gm, "").replace(/\r\n/gm, "").replace(/\n/gm, "");
                if (tds[1].querySelector("span").style.color === "red") scores.unpass.push({ name, type: "score"});
                if (tds[2].querySelector("span").classList.contains("unpass")) scores.unpass.push({ name, type: "gpa"});
                scores.data.push({ name, score, gpa });
            }
        });

        var extraInfo = dom.window.document.querySelectorAll("table.scoreTable-inline.padding0.spacing2.center tr td");
        for (var i = 0; i < extraInfo.length; i++) {
            if (extraInfo[i].classList.contains("score")) {
                scores.extra.push({
                    type: extraInfo[i - 1].textContent.replace(/：/gm, ""),
                    value: extraInfo[i].textContent.replace(/ /gm, "").replace(/\r\n/gm, "").replace(/\n/gm, "")
                });
            }
        }

        res.status(200).json({ message: "Success!", data: scores, url});
    });
}

module.exports.getScoreInfo = getScoreInfo;