/*
 * HLHSInfo Server Main Script
 * Created by: DevSomeone <yurisakadev@gmail.com>, Muisnow <muisnowbusiness@gmail.com>
 *
 * Copyright 2022 The HLHSInfo Authors.
 * Copyright 2022 DevSomeone Developer.
 * 
 * Repository: https://github.com/DevSomeone/hlhsinfo
 */

// Modules definition
const express = require('express');
const app = express();
const fs = require('fs');
const api = require('./api/api.js');
const bodyParser = require('body-parser');
const { generateKeyPairSync } = require('crypto');
const cros = require('cors');

// Initilize the server
require('dotenv').config();

const PORT = global.PORT = process.env.PORT || 1156;
const defaultURL = "http://shinher.hlhs.hlc.edu.tw/online/";
const urls = global.urls = {
    main: defaultURL,
    grade: defaultURL + "selection_student/student_subjects_number.asp?action=%action%&thisyear=%year%&thisterm=%term%&number=%grade_ID%&exam_name=%exam_name%",
    login: defaultURL + "login.asp",
    availableScore: defaultURL + "selection_student/student_subjects_number.asp?action=open_window_frame",
    profile: defaultURL + "selection_student/fundamental.asp",
    profileImg: defaultURL + "utility/file1.asp?q=x&id=%imgID%",
    classInfo: defaultURL + "student/selection_look_over_data.asp?look_over=right_top&school_class=&division=",
    userShortInfo: defaultURL + "student/selection_look_over_data.asp?look_over=right_below&school_class=",
    rewandpun: defaultURL + "selection_student/moralculture_%20bonuspenalty.asp",
    lack: defaultURL + "selection_student/absentation_skip_school.asp",
    allScores: defaultURL + "selection_student/grade_chart_all.asp",
    scheduleList: defaultURL + "student/select_preceptor.asp?action=open_sel",
    schedule: defaultURL + "student/school_class_tabletime.asp?teacher_classnumber=%class%&teacher_name=%teacher%",
}

if (!fs.existsSync("storaged")) {  
    fs.mkdirSync("storaged");
}

if (!fs.existsSync("storaged/sharedScore.json")) {
    fs.writeFileSync("storaged/sharedScore.json", JSON.stringify({
        scores: []
    }));
}

if (!fs.existsSync("storaged/authPrivate.key") || !fs.existsSync("storaged/authPublic.key")) {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });
    fs.writeFileSync("storaged/authPrivate.key", privateKey);
    fs.writeFileSync("storaged/authPublic.pem", publicKey);
}

const sharedScores = global.sharedScores = JSON.parse(fs.readFileSync("storaged/sharedScore.json"));
global.sharedScores.scores.push = (e) => {
    Array.prototype.push.call(global.sharedScores.scores, e);
    fs.writeFileSync("storaged/sharedScore.json", JSON.stringify(global.sharedScores));
}
global.sharedScores.scores.splice = (e, i) => {
    Array.prototype.splice.call(global.sharedScores.scores, e, i);
    fs.writeFileSync("storaged/sharedScore.json", JSON.stringify(global.sharedScores));
}

global.sharedScores.scores.forEach((e, index) => {
    if (e.expiredTimestamp < Date.now()) {
        var index = global.sharedScores.scores.findIndex(dt => dt.id === e.id);
        if (index >= 0) {
            global.sharedScores.scores.splice(index, 1);
        }
        return;
    }
    setTimeout(() => {
        var index = global.sharedScores.scores.findIndex(dt => dt.id === e.id);
        if (index >= 0) {
            global.sharedScores.scores.splice(index, 1);
        }
    }, e.expiredTimestamp - Date.now());
});

app.listen(PORT, () => {
    console.log("".padStart(60, '='));
    console.log("\x1b[32m\x1b[5m" + "[Server Started".padStart(37, " ") + "]\x1b[0m");
    console.log();
    console.log(`      * Listening on port:`.padEnd(30, " ") + `${PORT}`);
    console.log("      * Server is running on:".padEnd(30, " ") + `http://localhost:${PORT}`);
    console.log();
    console.log("".padStart(60, '='));
});
// End of Initilize the server

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cros());

app.get("/", (req, res) => res.sendFile(__dirname + "/public/index.html"));

// API Routes
app.get("/api", (req, res) => res.sendFile(__dirname + "/api/document.html"));
app.get("/api/openapi.json", (req, res) => res.sendFile(__dirname + "/api/openapi.json"));

app.get("/api/getLoginInfo", (req, res) => api.getLoginInfo(res, req));
app.get("/api/getLoginCaptcha", (req, res) => api.getLoginCaptcha(req, res));
app.post("/api/login", (req, res) => api.login(req, res));
app.get("/api/getUserInfo", (req, res) => api.getUserInfo(req, res));
app.get("/api/getUserInfoShort", (req, res) => api.getUserInfoShort(req, res));
app.post("/api/getScoreInfo", (req, res) => api.getScoreInfo(req, res));
app.get("/api/getAvailableScore", (req, res) => api.getAvailableScore(req, res));
app.get("/api/getRewAndPun", (req, res) => api.getRewAndPun(req, res));
app.get("/api/getLack", (req, res) => api.getLack(req, res));
app.get("/api/getAllScores", (req, res) => api.getAllScores(req, res));
app.post("/api/shareScore", (req, res) => api.shareScore(req, res));
app.post("/api/getShared", (req, res) => api.getShared(req, res));
app.post("/api/getScoreImg", (req, res) => api.getScoreImg(req, res));
app.get("/api/getScoreImg", (req, res) => api.getScoreImg(req, res));
app.get("/api/getScheduleList", (req, res) => api.getScheduleList(req, res));
app.get("/api/getSchedule", (req, res) => api.getSchedule(req, res));

app.get("/api/notify", (req, res) => res.sendFile(__dirname + "/notify.json"));

// Score Share Redirect
app.get("/s/:sharedID", (req, res) => {
    res.redirect(`/score?shared=${req.params.sharedID}`);
});

app.use(express.static(__dirname + "/public"));

app.get("*", (req, res) => res.sendFile(__dirname + "/public/index.html"));

module.exports.app = app;