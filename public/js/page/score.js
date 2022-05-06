window.execute = async () => {
    var pageElement = document.querySelector("#mainContent");

    if (sessionStorage.getItem("auth") === null) {
        goPage("/");
        return;
    }

    var auth = sessionStorage.getItem("auth");
    var scoreData;

    var scoreID = location.search.split("=")[1];
    var scoreArr = scoreID.split("-");
    var scoreYear = scoreArr[0];
    var scoreTerm = scoreArr[1];
    var scoreTimes = scoreArr[2];

    var task = addTaskList("取得成績");
    await fetch("/api/getScoreInfo", {
        method: "POST",
        headers: {
            "authorization": auth,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            year: scoreYear,
            term: scoreTerm,
            times: scoreTimes,
            examName: "t"
        })
    }).then(res => res.json()).then(res => {
        if (res.message !== "Success!") {
            setTaskStatus(task, "fail");
            goPage("/");
            finishTask();
            return;
        }
        if (res.data.data.length === 0) {
            setTaskStatus(task, "fail");
            var t = addTaskList("查無資料");
            setTaskStatus(t, "fail");
            setTimeout(() => {
                finishTask();
                goPage("/");
            }, 1000);
            return;
        }
        scoreData = res.data;
    });
    setTaskStatus(task, "success");

    var task = addTaskList("取得已公布成績");
    var allScores;
    await fetch("/api/getAvailableScore", {
        method: "GET",
        headers: {
            "authorization": auth
        },
    }).then(res => res.json()).then(res => {
        if (res.message !== "Success!") {
            setTaskStatus(task, "fail");
            goPage("/");
            finishTask();
            return;
        }
        allScores = res.data;
    });
    setTaskStatus(task, "success");
    var allScores = allScores.filter(dt => dt.type == "1");

    var notScore = allScores.findIndex(dt => dt.year === scoreYear && dt.term === scoreTerm && dt.times === scoreTimes && dt.type === 2);
    var d = allScores.findIndex(dt => dt.year === scoreYear && dt.term === scoreTerm && dt.times === scoreTimes);

    if (d >= 1 && notScore === -1) {
        var preScore = allScores[d - 1];

        var task = addTaskList("取得上次成績");
        var lastScore;
        await fetch("/api/getScoreInfo", {
            method: "POST",
            headers: {
                "authorization": auth,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                year: preScore.year,
                term: preScore.term,
                times: preScore.times,
                examName: "t"
            })
        }).then(res => res.json()).then(res => {
            if (res.message !== "Success!") {
                setTaskStatus(task, "fail");
                goPage("/");
                return;
            }
            lastScore = res.data;
        });
        setTaskStatus(task, "success");
    }

    task = addTaskList("分析資料");
    var list = `
        <tr>
            <td>科目</td>
            <td>您的成績</td>
            <td>班級平均</td>
        </tr>
    `;

    scoreData.data.forEach(dt => {
        var unpassScore = scoreData.unpass.find(d => d.name === dt.name && d.type === "score");
        var unpassGPA = scoreData.unpass.find(d => d.name === dt.name && d.type === "gpa");
        list += `
            <tr>
                <td>${dt.name}</td>
                <td ${unpassScore ? 'style="color: red;"' : ""}>${dt.score}</td>
                <td ${unpassGPA ? 'style="color: red;"' : ""}>${dt.gpa}</td>
            </tr>
        `;
    });
    setTaskStatus(task, "success");

    try {
        scoreData.data.forEach((dt, index) => {
            lastScore.data[index].name !== dt.name ? scoreData.data[index].name = dt.name + `(${lastScore.data[index].name})` : "";
        })
    } catch (e) { }

    var extraInfoTitle = scoreData.extra.map(d => {
        if (d.type === "總分") return "總分(已除10)";
        return d.type
    });
    var extraInfoValue = scoreData.extra.map(d => d.value);
    var listExtra = `
        <tr>
            <td>資料</td>
            <td>數值</td>
        </tr>
    `;
   
    scoreData.extra.forEach(dt => {
        listExtra += `
            <tr>
                <td>${dt.type}</td>
                <td>${dt.value}</td>
            </tr>
        `;
    });

    pageElement.innerHTML = `
        <div class="profile">
            <h1 class="pageTitle">成績資料</h1>
            <div class="profileInfo">
                <table>
                    ${list}
                </table>
            </div>
        </div>
        <div class="extra">
            <h1 class="pageTitle">其他資料</h1>
            <div class="profileInfo">
                <table>
                    ${listExtra}
                </table>
            </div>
        </div>
        <div class="analyse">
            <h1 class="pageTitle">成績分析</h1>
            <div class="analyseInfo">
                <div class="analyse1">
                    <h1>本次成績分析</h1>
                    <canvas id="scoreAnalyse" width="400" height="400"></canvas>
                </div>
                <div class="analyse2">
                    <h1>本次其他資料分析</h1>
                    <canvas id="extraAnalyse" width="400" height="400"></canvas>
                </div>
            </div>
        </div>
    `;
    finishTask();

    var subjects = scoreData.data.map(d => d.name);
    var scores = scoreData.data.map(d => d.score);

    var scoreAnalyse = document.getElementById("scoreAnalyse");

    var anaD1 = [{
        label: "本次成績",
        data: scores,
        backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(255, 159, 64, 0.5)',
            'rgba(255, 205, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(153, 102, 255, 0.5)',
            'rgba(201, 203, 207, 0.5)'
        ],
        borderColor: [
            'rgb(255, 99, 132)',
            'rgb(255, 159, 64)',
            'rgb(255, 205, 86)',
            'rgb(75, 192, 192)',
            'rgb(54, 162, 235)',
            'rgb(153, 102, 255)',
            'rgb(201, 203, 207)'
        ],
        borderWidth: 1
    }];

    var anaD2 = [{
        label: "本次資料",
        data: extraInfoValue.map(d => {
            if (d > 800) {
                return d * 0.1;
            } else {
                return d;
            }
        }),
        backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(255, 159, 64, 0.5)',
            'rgba(255, 205, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(153, 102, 255, 0.5)',
            'rgba(201, 203, 207, 0.5)'
        ],
        borderColor: [
            'rgb(255, 99, 132)',
            'rgb(255, 159, 64)',
            'rgb(255, 205, 86)',
            'rgb(75, 192, 192)',
            'rgb(54, 162, 235)',
            'rgb(153, 102, 255)',
            'rgb(201, 203, 207)'
        ],
        borderWidth: 1
        }]

    if (lastScore) {
        anaD1.push({
            label: "上次成績",
            data: lastScore.data.map(d => d.score),
            backgroundColor: [
                'rgba(255, 99, 132, 0.5)',
                'rgba(255, 159, 64, 0.5)',
                'rgba(255, 205, 86, 0.5)',
                'rgba(75, 192, 192, 0.5)',
                'rgba(54, 162, 235, 0.5)',
                'rgba(153, 102, 255, 0.5)',
                'rgba(201, 203, 207, 0.5)'
            ],
            borderColor: [
                'rgb(255, 99, 132)',
                'rgb(255, 159, 64)',
                'rgb(255, 205, 86)',
                'rgb(75, 192, 192)',
                'rgb(54, 162, 235)',
                'rgb(153, 102, 255)',
                'rgb(201, 203, 207)'
            ],
            borderWidth: 1
        });

        anaD2.push({
            label: "上次資料",
            data: lastScore.extra.map(d => {
                if (d.type === "總分") {
                    return d.value * 0.1;
                } else {
                    return d.value;
                }
            }),
            backgroundColor: [
                'rgba(255, 99, 132, 0.5)',
                'rgba(255, 159, 64, 0.5)',
                'rgba(255, 205, 86, 0.5)',
                'rgba(75, 192, 192, 0.5)',
                'rgba(54, 162, 235, 0.5)',
                'rgba(153, 102, 255, 0.5)',
                'rgba(201, 203, 207, 0.5)'
            ],
            borderColor: [
                'rgb(255, 99, 132)',
                'rgb(255, 159, 64)',
                'rgb(255, 205, 86)',
                'rgb(75, 192, 192)',
                'rgb(54, 162, 235)',
                'rgb(153, 102, 255)',
                'rgb(201, 203, 207)'
            ],
            borderWidth: 1
        });
    }

    var thisBar = new Chart(scoreAnalyse, {
        type: "bar",
        data: {
            labels: subjects,
            datasets: anaD1
        }
    });

    var extraAnalyse = document.getElementById("extraAnalyse");
    var thisBar2 = new Chart(extraAnalyse, {
        type: "bar",
        data: {
            labels: extraInfoTitle,
            datasets: anaD2
        }
    });
}