const { getLoginInfo } = require('./getLoginInfo.js');
const { getLoginCaptcha } = require('./getLoginCaptcha.js');
const { login } = require('./login.js');
const { getAvailableScore } = require('./getAvailableScore.js');

module.exports = {
    getLoginInfo,
    getLoginCaptcha,
    login,
    getAvailableScore
}