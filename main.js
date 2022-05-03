const express = require('express');
const app = express();

const PORT = process.env.PORT || 1156;

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