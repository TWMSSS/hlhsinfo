function getUserInfo(req, res) {
    const request = require('request');
    const { JSDOM } = require('jsdom');
    const iconv = require('iconv-lite');
    const { decodeAuthorization, isNotLogin, urlEncode, getN1 } = require('./util.js');

    if (!req.headers.authorization) return res.status(403).json({ message: 'You need to get your authorization token first!' });
    var authDt = decodeAuthorization(req.headers.authorization);
    if (!authDt) return res.status(403).json({ message: 'Invalid authorization token!' });

    request.get({
        url: global.urls.profile,
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

        var imgID = new URL("http://example.com/" + dom.window.document.querySelector("img").src.replace("../", "")).searchParams.get("id");

        function a() {
            return new Promise((resolve, reject) => {
                request.get({
                    url: global.urls.profileImg.replace("%imgID%", imgID),
                    encoding: null,
                    headers: {
                        "cookie": authDt.sessionID,
                    }
                }, (err, response, body) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ message: 'Something went wrong!' });
                    }
                    if (response.statusCode !== 200) return res.status(response.statusCode).json({ message: 'Something went wrong!' });

                    resolve(Buffer.from(body).toString('base64'));
                });
            })
        }

        var dt = {data: [], profileImg: `data:image/png;base64,${await a()}`};

        dom.window.document.querySelectorAll("table[class='le_04 padding2 spacing2'] tr").forEach((tr) => {
            var t = 1;
            var tds = Array.from(tr.querySelectorAll("td"));
            if (tds.length > 4) tds.shift();
            tds.forEach(e => {
                if (t % 2 === 0 && t !== 0) {
                    dt.data.push({
                        name: tds[t - 2].textContent.replace(/ /gm, "").replace(/　/, "").replace(/\r\n/gm, "").replace(/\n/gm, ""),
                        value: tds[t - 1].textContent.replace(/ /gm, "").replace(/\r\n/gm, "").replace(/\n/gm, "")
                    })
                }
                t++;
            })
        });

        res.status(200).json({ message: "Success!", data: dt, url: global.urls.profile});
    });
}

module.exports.getUserInfo = getUserInfo;