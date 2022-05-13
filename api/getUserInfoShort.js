async function getUserInfoShort(req, res) {
    const request = require('request');
    const { JSDOM } = require('jsdom');
    const iconv = require('iconv-lite');
    const { decodeAuthorization, isNotLogin } = require('./util.js');

    if (!req.headers.authorization) return res.status(403).json({ message: 'You need to get your authorization token first!' });
    if (req.query.jwt === "false") {
        var authDt = decodeAuthorization(req.headers.authorization, true);
    } else {
        var authDt = decodeAuthorization(req.headers.authorization);
    }
    if (!authDt) return res.status(403).json({ message: 'Invalid authorization token!' });

    var info = {};

    function g1() {
        return new Promise((resolve, reject) => {
            request.get({
                url: global.urls.classInfo,
                encoding: null,
                headers: {
                    "cookie": authDt.sessionID,
                }
            }, async (err, response, body) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Something went wrong!' });
                };
                if (response.statusCode !== 200) return res.status(response.statusCode).json({ message: 'You might need to renew your authorization token!' });

                var data = iconv.decode(body, 'big5');
                if (isNotLogin(data)) return res.status(403).json({ message: 'You might need to login again!' });

                var dom = new JSDOM(data);

                info.className = dom.window.document.querySelector("table").textContent.replace(/ /gm, "").replace(/\n\n\n/gm, "").split("\n")[1].split("：")[1];

                resolve(true);
            });
        });
    }

    function g2() {
        return new Promise((resolve, reject) => {
            request.get({
                url: global.urls.userShortInfo,
                encoding: null,
                headers: {
                    "cookie": authDt.sessionID,
                }
            }, async (err, response, body) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Something went wrong!' });
                };
                if (response.statusCode !== 200) return res.status(response.statusCode).json({ message: 'You might need to renew your authorization token!' });

                var data = iconv.decode(body, 'big5');
                if (isNotLogin(data)) return res.status(403).json({ message: 'You might need to login again!' });

                var dom = new JSDOM(data);

                var d = Array.from(dom.window.document.querySelector("#authirty1").querySelectorAll("td")).map(e => e.textContent.replace(/ /gm, "").replace(/\n/gm, ""));

                info.classNumber = d[0];
                info.schoolNumber = d[1];
                info.userName = d[2];
                info.gender = d[3];

                resolve(true);
            });
        });
    }

    await Promise.all([g1(), g2()]);

    res.status(200).json({ message: "Success!", data: info });
}

module.exports.getUserInfoShort = getUserInfoShort;