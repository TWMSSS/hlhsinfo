function makeAuthCode(sessionID, verifyToken) {
    var auth = JSON.stringify({
        cookie: Buffer.from(sessionID).toString('hex'),
        verifyToken: Buffer.from(verifyToken).toString('base64')
    });
    return { authToken: Buffer.from(auth).toString('base64') }
}

function decodeAuthCode(authCode) {
    try {
        var auth = JSON.parse(Buffer.from(authCode, 'base64').toString('utf8'));
    } catch (e) {
        return false;
    }
    return {
        sessionID: Buffer.from(auth.cookie, "hex").toString('utf8'),
        verifyToken: Buffer.from(auth.verifyToken, "base64").toString("utf8")
    }
}

function decodeAuthorization(authCode) {
    var auth = authCode.replace("Bearer ", "");
    return decodeAuthCode(auth);
}

function isNotLogin(document) {
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM(document);
    var d = dom.window.document.querySelector("body>div");
    if (!d || d.innerHTML.indexOf("未登入") === -1) return false;
    return true;
}

function urlEncode(txt, destEncoding) {
    const iconv = require('iconv-lite');
    var b = iconv.encode(txt, destEncoding);
    var req = "";
    for (var v of b) {
        if (v !== 0) req += '%' + (v).toString(16).toUpperCase();
    }
    return req;
}

function getN1(year, grade, term) {
    year = (year - 99) * 2 + term - 1;
    if (year === 0 || year % 11 === 0) return "10";
    return "0" + String((year % 11) - 1);
}

function getScoreType(scoreName) {
    var org = scoreName;
    scoreName = scoreName.replace(/\[(\d{3})(\W{1})\] (\W*)/gm, "$1 $2 $3");
    scoreName = scoreName.split(" ");
    var testID = null;
    switch (scoreName[2]) {
        case "期初複習考":
            testID = 0;
            break;
        
        case "第一次期中考":
            testID = 1;
            break;
        
        case "第二次期中考":
            testID = 2;
            break;
        
        case "期末考":
            testID = 3;
            break;
        
        default:
            testID = null;
    }

    return {
        year: scoreName[0],
        term: scoreName[1] === "上" ? 1 : 2, 
        test: testID,
        name: org
    }
}

module.exports = {
    makeAuthCode,
    decodeAuthCode,
    decodeAuthorization,
    isNotLogin,
    urlEncode,
    getN1,
    getScoreType
}