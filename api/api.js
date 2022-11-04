/*
 * HLHSInfo Server API Definition
 * Created by: DevSomeone <yurisakadev@gmail.com>
 *
 * Copyright 2022 The HLHSInfo Authors.
 * Copyright 2022 DevSomeone Developer.
 * 
 * Repository: https://github.com/TWMSSS/hlhsinfo
 */

// Import APIs
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
const { shareScore } = require('./shareScore.js');
const { getShared } = require('./getShared.js');
const { getScoreImg } = require('./getScoreImg.js');
const { getScheduleList } = require('./getScheduleList.js');
const { getSchedule } = require('./getSchedule.js');
const { status } = require('./status.js');
const { clearCache } = require("./clearCache");

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
    getAllScores,
    shareScore,
    getShared,
    getScoreImg,
    getScheduleList,
    getSchedule,
    status,
    clearCache
}