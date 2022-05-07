const { getLoginInfo } = require('./getLoginInfo.js');
const { getLoginCaptcha } = require('./getLoginCaptcha.js');
const { login } = require('./login.js');
const { getAvailableScore } = require('./getAvailableScore.js');
const { getScoreInfo } = require('./getScoreInfo.js');
const { getUserInfo } = require('./getUserInfo.js');
const { getUserInfoShort } = require('./getUserInfoShort.js');
const { getRewAndPun } = require('./getRewAndPun.js');
const { getLack } = require('./getLack.js');
const { getAllScores } = require('./getAllScores.js');

module.exports = {
    getLoginInfo,
    getLoginCaptcha,
    login,
    getAvailableScore,
    getScoreInfo,
    getUserInfo,
    getUserInfoShort,
    getRewAndPun,
    getLack,
    getAllScores
}