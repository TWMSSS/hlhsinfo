const express = require('express');
const app = express();
const api = require('./api/api.js');

const PORT = process.env.PORT || 1156;
const urls = global.urls = {
    main: "http://shinher.hlhs.hlc.edu.tw/online/",
    grade: "http://shinher.hlhs.hlc.edu.tw/online/selection_student/student_subjects_number.asp?action=%action%&thisyear=%year%&thisterm=1&number=%grade_ID%&exam_name=%exam_name%",
    login: "http://shinher.hlhs.hlc.edu.tw/online/login.asp",
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

app.get("/", (req, res) => { res.send("Hello World!"); });

app.get("/api/getLoginInfo", (req, res) => api.getLoginInfo(res, req));
app.get("/api/getLoginCaptcha", (req, res) => api.getLoginCaptcha(req, res));
app.post("/api/login", (req, res) => { res.send("Hello World!"); });
app.get("/api/getUserInfo", (req, res) => { res.send("Hello World!"); });
app.post("/api/getScoreInfo", (req, res) => { res.send("Hello World!"); });
app.get("/api/getAvailableScore", (req, res) => { res.send("Hello World!"); });