async function status(req, res) {
    const request = require('request');
    const package = require('../package.json');
    const { recordAPIUsage } = require("./util");

    recordAPIUsage("status", "pendding");

    var isShinerOnline = true;
    var shinerPing = {};
    var isHomePageOnline = true;
    var homePagePing = {};
    
    function g1() {
        return new Promise((resolve, reject) => {
            request.head({
                url: global.urls.main,
                encoding: null,
                timeout: 3000,
                time: true
            }, (err, resp) => {
                if (err) isShinerOnline = false;
                if (!err) shinerPing = resp.timings;
                resolve();
            });
        });
    }

    function g2() {
        return new Promise((resolve, reject) => {
            request.head({
                url: global.homePage,
                encoding: null,
                time: true
            }, (err, resp) => {
                if (err) isHomePageOnline = false;
                if (!err) homePagePing = resp.timings;
                resolve();
            });
        });
    }

    await Promise.all([g1(), g2()]);

    recordAPIUsage("status", "success");

    res.status(200).json({
        message: "Success!",
        data: {
            version: package.version,
            serverTimestamp: Date.now(),
            serverUptime: process.uptime(),
            remote: {
                shiner: {
                    online: isShinerOnline,
                    ping: shinerPing
                },
                homePage: {
                    online: isHomePageOnline,
                    ping: homePagePing
                }
            }
        }
    });
}

module.exports.status = status;