function clearCache(req, res) {
    const { decodeAuthorization, generateCacheKey, removeCache } = require('./util.js');

    if (!req.headers.authorization) return res.status(403).json({ message: 'You need to get your authorization token first!' });
    var authDt = decodeAuthorization(req.headers.authorization);
    if (!authDt) return res.status(403).json({ message: 'Invalid authorization token!' });

    removeCache(generateCacheKey(authDt.userInfo.schoolNumber, Buffer.from(authDt.userInfo.userName, "hex").toString("utf-8"), authDt.userInfo.classNumber).id);

    return res.status(204).end();
}

module.exports.clearCache = clearCache;