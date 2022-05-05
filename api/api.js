const { getLoginInfo } = require('./getLoginInfo.js');
const { getLoginCaptcha } = require('./getLoginCaptcha.js');
const { login } = require('./login.js');

module.exports = {
    getLoginInfo,
    getLoginCaptcha,
    login
}