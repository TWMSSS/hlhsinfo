function makeAuthCode(sessionID, verifyToken, url = null) {
    var auth = JSON.stringify({
        cookie: Buffer.from(sessionID).toString('hex'),
        verifyToken: Buffer.from(verifyToken).toString('base64'),
        url: url !== null && Buffer.from(url).toString('base64')
    });
    return { authToken: Buffer.from(auth).toString('base64') }
}

function decodeAuthCode(authCode, isnJWT) {
    if (isnJWT) {
        try {
            var auth = JSON.parse(Buffer.from(authCode, 'base64').toString('utf8'));
        } catch (e) {
            return false;
        }
        return {
            sessionID: Buffer.from(auth.cookie, "hex").toString('utf8'),
            verifyToken: Buffer.from(auth.verifyToken, "base64").toString("utf8"),
            url: auth.url && Buffer.from(auth.url, "base64").toString("utf8")
        }
    }
    
    var decode = jwtDecode(authCode);
    if (!decode) return false;
    var authtkn = decodeAuthCode(decode.authtoken, true);
    if (!authtkn) return false;
    return {
        sessionID: authtkn.sessionID,
        verifyToken: authtkn.verifyToken,
        url: authtkn.url,
        userInfo: decode.userInfo
    }
}

function makeDirs(path) {
    const fs = require("fs");

    var d = path.split("/");
    var t = "";

    for (var h of d) {
        t += `${h}/`;
        if (fs.existsSync(t)) continue;
        fs.mkdirSync(t);
    }
}

function recordAPIUsage(api, type) {
    if (!getRecordAPI()) return;

    const fs = require("fs");

    const todayTime = new Date();
    const pathString = `${todayTime.getFullYear()}/${todayTime.getMonth() + 1}`;
    const dateString = pathString + `/${todayTime.getDate()}`;

    makeDirs(`storaged/record/${pathString}`);

    if (!fs.existsSync(`storaged/record/${dateString}.json`))
        fs.writeFileSync(`storaged/record/${dateString}.json`, JSON.stringify({
            date: dateString,
            record: [
                {
                    timestamp: Date.now(),
                    type,
                    api
                }
            ]
        }));

    const data = JSON.parse(fs.readFileSync(`storaged/record/${dateString}.json`));
    data.record.push({
        timestamp: Date.now(),
        type,
        api
    });

    fs.writeFileSync(`storaged/record/${dateString}.json`, JSON.stringify(data));
}

function decodeAuthorization(authCode, isnJWT) {
    var auth = authCode.replace("Bearer ", "");
    return decodeAuthCode(auth, isnJWT);
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

function makeRandomString(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}

function jwtEncode(payload) {
    const jwt = require('jsonwebtoken');
    const fs = require('fs');
    var privateKey = fs.readFileSync('storaged/authPrivate.key');
    return jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn: '3h' });
}

function jwtDecode(token) {
    const jwt = require('jsonwebtoken');
    const fs = require('fs');
    var publicKey = fs.readFileSync('storaged/authPublic.pem');
    try {
        return jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    } catch (e) {
        return false;
    }
}

function createHash(data, type = "sha1") {
    const { createHash } = require("crypto");

    const hash = createHash(type).update(data).digest("hex");
    console.log(`[Crypto Manager] Created hash ${hash} with ${type}`);
    return hash;
}

function generateCacheKey(schoolNumber, username, className) {
    const orgHash = createHash(Buffer.from(schoolNumber).toString("hex") + "@" + Buffer.from(username).toString("hex") + className, "sha512");

    return {
        id: orgHash.substring(0, 32),
        key: orgHash.substring(34, 98),
        iv: orgHash.substring(81, 113)
    }
}

function encryptoCacheData(buffer, key, iv) {
    const crpyto = require("crypto");
    const cipher = crpyto.createCipheriv("aes-256-cbc", Buffer.from(key, "hex"), Buffer.from(iv, "hex"));
    var encryptoed = cipher.update(buffer);
    encryptoed = Buffer.concat([encryptoed, cipher.final()]);

    return encryptoed;
}

function decryptoCacheData(buffer, key, iv) {
    const crpyto = require("crypto");
    const cipher = crpyto.createDecipheriv("aes-256-cbc", Buffer.from(key, "hex"), Buffer.from(iv, "hex"));
    var decryptoed = cipher.update(buffer);
    decryptoed = Buffer.concat([decryptoed, cipher.final()]);

    return decryptoed;
}

function saveAsCache(id, file, buffer, key, iv) {
    if (!getCacheEnv().CACHE_ENABLE) return false;

    const fs = require("fs");
    const { v4 } = require("uuid")

    if (!fs.existsSync(`storaged/cache/${id}`)) fs.mkdirSync(`storaged/cache/${id}`);
    if (!fs.existsSync(`storaged/cache/${id}/metadata.json`)) {
        console.log(`[Cache Manager] Creating cache file set: ${id}`);

        fs.writeFileSync(`storaged/cache/${id}/metadata.json`, JSON.stringify({
            cacheID: id,
            files: [],
            keyHash: createHash(key),
            ivHash: createHash(iv),
            created: Date.now(),
        }));
    }

    const metadata = JSON.parse(fs.readFileSync(`storaged/cache/${id}/metadata.json`));
    
    if (metadata.keyHash !== createHash(key) || metadata.ivHash !== createHash(iv)) return false;

    const expired = Date.now() + getCacheEnv().CACHE_EXPIRE * 3600000;
    console.log(`[Cache Manager] Set cache file set ${id} expire timestamp from ${metadata.expired} to ${expired}`);
    metadata.expired = expired;

    if (metadata.files.findIndex(e => e.filetype === file) !== -1) return false;

    const cacheFileID = v4();
    const cacheFileHash = createHash(buffer);

    console.log(`[Cache Manager] Caching file ${file} as ${cacheFileID} with sha1 verifiction ${cacheFileHash} in cache set ${id}`);

    metadata.files.push({
        id: cacheFileID,
        hash: cacheFileHash,
        filetype: file
    });

    fs.writeFileSync(`storaged/cache/${id}/${cacheFileID}`, encryptoCacheData(buffer, key, iv));
    fs.writeFileSync(`storaged/cache/${id}/metadata.json`, JSON.stringify(metadata));

    return true;
}

function readCache(id, file, key, iv) {
    if (!getCacheEnv().CACHE_ENABLE) return false;

    const fs = require("fs");

    if (!fs.existsSync(`storaged/cache/${id}`) || !fs.existsSync(`storaged/cache/${id}/metadata.json`)) return false;

    const metadata = JSON.parse(fs.readFileSync(`storaged/cache/${id}/metadata.json`));
    if (metadata.expired < Date.now()) {
        fs.unlinkSync(`storaged/cache/${id}`);
        return false;
    }

    if (metadata.keyHash !== createHash(key) || metadata.ivHash !== createHash(iv)) return false;

    const fileData = metadata.files.find(e => e.filetype === file);
    if (!fileData) return false;

    const cacheFile = decryptoCacheData(fs.readFileSync(`storaged/cache/${id}/${fileData.id}`), key, iv);

    if (fileData.hash !== createHash(cacheFile)) return false;

    return cacheFile;
}

function removeCache(id) {
    const fs = require("fs");
    if (!fs.existsSync(`storaged/cache/${id}`)) return false;

    console.log(`[Cache Manager] Deleting cache file set: ${id}`);

    fs.rmSync(`storaged/cache/${id}`, { recursive: true, force: true });

    return true;
}

function checkUndefined(type) {
    return type === undefined;
}

function undefinedValue(value, defaultValue) {
    return checkUndefined(value) ? defaultValue : value;
}

function getExpiredTime() {
    return Number(undefinedValue(process.env.SHARE_EXPIRED, 1800000));
}

function getFailedExpiredTime() {
    return Number(undefinedValue(process.env.FAILED_EXPIRED, 3600000));
}

function getFailedTimesLock() {
    return Number(undefinedValue(process.env.FAILED_TIMES_LOCK, 5));
}

function getCacheEnv() {
    return {
        CACHE_ENABLE: Boolean(undefinedValue(process.env.CACHE_ENABLE, true)),
        CACHE_EXPIRE: Number(undefinedValue(process.env.CACHE_EXPIRE, 48)),
        CACHE_CHECK_CYCLE: Number(undefinedValue(process.env.CACHE_CHECK_CYCLE, 5))
    }
}

function getRecordAPI() {
    return Boolean(undefinedValue(process.env.ENABLE_RECORD, true));
}

function getClassInfo(data) {
    const classes = [
        {
            name: "國語文",
            regex: new RegExp("國語"),
            classTime: 4
        },
        {
            name: "數學",
            regex: new RegExp("數學"),
            classTime: 4
        },
        {
            name: "英語文",
            regex: new RegExp("英語"),
            classTime: 4
        },
        {
            name: "物理",
            regex: new RegExp("物理"),
            classTime: 2
        },
        {
            name: "化學",
            regex: new RegExp("化學"),
            classTime: 2
        },
        {
            name: "生物",
            regex: new RegExp("生物"),
            classTime: 2
        },
        {
            name: "地球科學",
            regex: new RegExp("地球科學"),
            classTime: 2
        },
        {
            name: "公民與社會",
            regex: new RegExp("公民"),
            classTime: 2
        },
        {
            name: "地理",
            regex: new RegExp("地理"),
            classTime: 2
        },
        {
            name: "歷史",
            regex: new RegExp("歷史"),
            classTime: 2
        }
    ];

    return classes.find(e => data.match(e.regex)) ?? {
        name: data,
        regex: new RegExp(data),
        classTime: 0
    };
}

module.exports = {
    makeAuthCode,
    decodeAuthCode,
    recordAPIUsage,
    decodeAuthorization,
    isNotLogin,
    urlEncode,
    getN1,
    getScoreType,
    makeRandomString,
    jwtEncode,
    jwtDecode,
    generateCacheKey,
    encryptoCacheData,
    decryptoCacheData,
    saveAsCache,
    readCache,
    removeCache,
    getExpiredTime,
    getFailedExpiredTime,
    getFailedTimesLock,
    getCacheEnv,
    getClassInfo
}