function getLack(req, res) {
    const request = require('request');
    const { JSDOM } = require('jsdom');
    const iconv = require('iconv-lite');
    const { decodeAuthorization, isNotLogin } = require('./util.js');

    if (!req.headers.authorization) return res.status(403).json({ message: 'You need to get your authorization token first!' });
    var authDt = decodeAuthorization(req.headers.authorization);
    if (!authDt) return res.status(403).json({ message: 'Invalid authorization token!' });

    request.get({
        url: global.urls.lack,
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
        
        var dt = [];
        Array.from(dom.window.document.querySelector("table.padding2.spacing0").querySelectorAll("tr:not(.td_03.si_12.le_05.top.center)")).forEach(e => {
            var t = 0;
            var lack = {week: "", date: "", data: []};
            Array.from(e.querySelectorAll("td")).forEach(d => {
                t++;
                if (t === 1) {
                    lack.week = d.textContent;
                } else if (t === 2) {
                    lack.date = d.textContent;
                } else if (t !== 3) {
                    lack.data.push(d.textContent === "" ? null : d.textContent)
                }
            });
            dt.push(lack)
        })

        var g = {termUp: [], termDown: []};
        var arrA = Array.from(dom.window.document.querySelector("table.si_12.collapse.padding2.spacing0").querySelectorAll("tr")).filter(e => {
            if (!e.querySelector("td").getAttribute("colspan")) {
                return true;
            }
            return false;
        })
        var arrA = arrA.map(e => Array.from(e.querySelectorAll("td")).map(d => d.textContent));
        for (var i=0;i<18;i++) {
            g.termUp.push({
                name: arrA[0][i],
                value: Number(arrA[1][i])
            })
            g.termDown.push({
                name: arrA[2][i],
                value: Number(arrA[3][i])
            })
        }

        res.status(200).json({
            message: "Success!",
            data: {
                record: dt,
                total: g
            }
        });
    });
}

module.exports.getLack = getLack;