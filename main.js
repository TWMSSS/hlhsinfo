const express = require('express');
const app = express();
const api = require('./api/api.js');
const bodyParser = require('body-parser')

const PORT = process.env.PORT || 1156;
const defaultURL = "http://shinher.hlhs.hlc.edu.tw/online/";
const urls = global.urls = {
    main: defaultURL,
    grade: defaultURL + "selection_student/student_subjects_number.asp?action=%action%&thisyear=%year%&thisterm=1&number=%grade_ID%&exam_name=%exam_name%",
    login: defaultURL + "login.asp",
    availableScore: defaultURL + "selection_student/student_subjects_number.asp?action=open_window_frame",
    profile: defaultURL + "selection_student/fundamental.asp",
    classInfo: defaultURL + "student/selection_look_over_data.asp?look_over=right_top&school_class=&division=",
    userShortInfo: defaultURL + "student/selection_look_over_data.asp?look_over=right_below&school_class="
}

app.listen(PORT, () => {
    console.log("".padStart(60, '='));
    console.log("\x1b[32m\x1b[5m" + "[Server Started".padStart(37, " ") + "]\x1b[0m");
    console.log();
    console.log(`      * Listening on port:`.padEnd(30, " ") + `${PORT}`);
    console.log("      * Server is running on:".padEnd(30, " ") + `http://localhost:${PORT}`);
    console.log();
    console.log("".padStart(60, '='));
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => { res.send("Hello World!"); });

app.get("/api/getLoginInfo", (req, res) => api.getLoginInfo(res, req));
app.get("/api/getLoginCaptcha", (req, res) => api.getLoginCaptcha(req, res));
app.post("/api/login", (req, res) => api.login(req, res));
app.get("/api/getUserInfo", (req, res) => { res.send("Hello World!"); });
app.post("/api/getScoreInfo", (req, res) => { res.send("Hello World!"); });
app.get("/api/getAvailableScore", (req, res) => api.getAvailableScore(req, res));