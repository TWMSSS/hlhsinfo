window.execute = async () => {
    var pageElement = document.querySelector("#mainContent");

    var sharedScore = new URL(location.href).searchParams.get("shared");

    if (sessionStorage.getItem("auth") === null && sharedScore === null) {
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

    if (!sharedScore) {
        var sharedScore;

        window.pageData.function.shareScore = async () => {
            if (!sharedScore) {
                var task = addTaskList("建立分享連結");
                await fetch("/api/shareScore", {
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
                        task = addTaskList("建立分享連結失敗");
                        setTaskStatus(task, "fail");
                        setTimeout(() => {
                            finishTask();
                        }, 3000);
                        return;
                    }

                    sharedScore = res.data;
                })
            };

            setTaskStatus(task, "success");
            finishTask();

            function getDuringTime(milisec) {
                var day = Math.floor(milisec / (1000 * 60 * 60 * 24));
                var hour = Math.floor(milisec / (1000 * 60 * 60)) % 24;
                var min = Math.floor(milisec / (1000 * 60)) % 60;
                var sec = Math.floor(milisec / 1000) % 60;

                return `${day ? `${day}天` : ""}${hour ? `${hour}小時` : ""}${min ? `${min}分鐘` : ""}${sec ? `${sec}秒` : ""}`;
            }

            function timestampFormat(timestamp) {
                var date = new Date(timestamp);
                return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
            }

            var sharedID = sharedScore.id;
            var link = `${location.origin}/s/${sharedID}`;
            var imageLink = `${location.origin}/api/getScoreImg?shared=${sharedID}`;
            
            var doc = document.createElement("div");
            doc.classList.add("taskBox");
            doc.innerHTML = `
                <div class="tskbx">
                    <div class="taskBoxTitle">
                        <h1>分享成績</h1>
                        <h5 style="color: orange;" id="expText">注意: 成績將在<span id="expTime" data-extra="${timestampFormat(sharedScore.expiredTimestamp)}">${getDuringTime(sharedScore.expiredTimestamp - Date.now())}</span>後過期</h5>
                    </div>
                    <div class="taskBoxContent" style="overflow: auto;overflow-x: hidden;">
                        <div class="group">
                            <h3>分享連結</h3>
                            <div class="input">
                                <input type="text" value="${link}" readonly>
                                <button onclick="window.pageData.function.shareURL('${link}')">分享</button>
                            </div>
                        </div>
                        <div class="group">
                            <h3>分享圖片連結</h3>
                            <div class="input">
                                <input type="text" value="${imageLink}" readonly>
                                <button onclick="window.pageData.function.shareURL('${imageLink}')">分享</button>
                            </div>
                        </div>
                        <div class="group">
                            <h3>QR Code</h3>
                            <div class="qr" style="text-align: center;">
                                <img src="https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=${link}" alt="QR Code">
                            </div>
                        </div>
                        <div class="group">
                            <h3>下載成圖片</h3>
                            <div class="img" style="text-align: center;">
                                <img id="scoreImg" src="" alt="Score Image" style="width: 100%;">
                                <button onclick="window.pageData.function.downloadImg()">下載</button>
                            </div>
                        </div>
                    </div>
                    <button type="button" id="close" style="background-color: red;padding: 5px;">關閉</button>
                </div>
            `;

            document.body.appendChild(doc);

            var t = setInterval(() => {
                var time = sharedScore.expiredTimestamp - Date.now();
                if (time <= 0) {
                    doc.querySelector("#expText").innerText = "注意: 本次分享階段已過期";
                    clearInterval(t);
                    return;
                }
                doc.querySelector("#expTime").innerText = getDuringTime(time);
            }, 1000);


            document.querySelector("#close").addEventListener("click", () => {
                clearInterval(t);
                doc.remove();
            });

            var imgUrl;
            await fetch("/api/getScoreImg", {
                method: "POST",
                headers: {
                    "authorization": auth,
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: new URLSearchParams({
                    year: scoreYear,
                    term: scoreTerm,
                    times: scoreTimes
                })
            }).then(res => res.blob()).then(res => {
                imgUrl = URL.createObjectURL(res);
                doc.querySelector("#scoreImg").src = imgUrl;
            });
        }

        window.pageData.function.shareURL = (URL) => {
            if (typeof navigator.share === "undefined") {
                var input = document.createElement("input");
                input.value = URL;
                input.select();
                navigator.clipboard.writeText(URL);
                alert("已複製到剪貼簿");
            } else {
                navigator.share({
                    title: "分享成績",
                    text: "此成績使用「花中查詢」分享",
                    url: URL
                });
            }
        }

        window.pageData.function.downloadImg = () => {
            var img = document.querySelector("#scoreImg");
            var link = document.createElement("a");
            link.href = img.src;
            link.download = "score.png";
            link.click();
        }

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
    } else {
        var task = addTaskList("取得分享的成績");

        await fetch("/api/getShared", {
            method: "POST",
            headers: {
                "authorization": auth,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                sharedID: sharedScore
            })
        }).then(res => res.json()).then(res => {
            if (res.message !== "Success!") {
                setTaskStatus(task, "fail");
                finishTask();
                goPage("/");
                return;
            }
            scoreData = res.data;
        });
        scoreYear = scoreData.scoreInfo.year;
        scoreTerm = scoreData.scoreInfo.term;
        scoreTimes = scoreData.scoreInfo.times;

        scoreOwner = scoreData.userInfo;
        setTaskStatus(task, "success");
    }
    var scoreOwner = scoreOwner || undefined;

    task = addTaskList("分析資料");
    var list = "";

    scoreData.data.forEach(dt => {
        var unpassScore = scoreData.unpass.find(d => d.name === dt.name && d.type === "score");
        var unpassGPA = scoreData.unpass.find(d => d.name === dt.name && d.type === "gpa");
        list += `<div class="dataBox"><span class="dataTitle">${dt.name}</span><span class="dataValue score" ${unpassScore ? 'style="color: red;"' : ""}>${dt.score}</span><span class="dataExtra">平均 <font ${unpassGPA ? 'style="color: red;"' : ""}>${dt.gpa}</font></span></div>`;
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
    var listExtra = "";
   
    scoreData.extra.forEach(dt => {
        listExtra += `<div class="dataBox"><span class="dataTitle">${dt.type}</span><span class="dataValue">${dt.value}</span></div>`;
    });

    pageElement.innerHTML = `
        <div class="profile">
            <h1 class="pageTitle">成績資料</h1>
            <div class="profileInfo">
                <h1>${scoreYear}學年度 ${scoreTerm === "1" ? "上" : "下"}學期 第${scoreTimes}次考試</h1>
                ${scoreOwner ? `<h4>此為 ${scoreOwner.className} 班 ${scoreOwner.userName}(${scoreOwner.schoolNumber}) 的成績資料</h4>` : ""}
                ${scoreOwner ? "" : '<h1><i class="fa-solid fa-share-from-square" onclick="window.pageData.function.shareScore()"></i></h1>'}
                <div class="dataContent">
                    ${list}
                </div>
            </div>
        </div>
        <div class="extra">
            <h1 class="pageTitle">其他資料</h1>
            <div class="profileInfo">
                <div class="dataContent">
                    ${listExtra}
                </div>
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

    var bgColor = [
        'rgba(255, 99, 132, 0.5)',
        'rgba(255, 159, 64, 0.5)',
        'rgba(255, 205, 86, 0.5)',
        'rgba(75, 192, 192, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(153, 102, 255, 0.5)',
        'rgba(201, 203, 207, 0.5)'
    ];
    var borderColor = [
        'rgb(255, 99, 132)',
        'rgb(255, 159, 64)',
        'rgb(255, 205, 86)',
        'rgb(75, 192, 192)',
        'rgb(54, 162, 235)',
        'rgb(153, 102, 255)',
        'rgb(201, 203, 207)'
    ];

    var anaD1 = [{
        label: "本次成績",
        data: scores,
        backgroundColor: bgColor,
        borderColor: borderColor,
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
        backgroundColor: bgColor,
        borderColor: borderColor,
        borderWidth: 1
        }]

    if (lastScore) {
        anaD1.push({
            label: "上次成績",
            data: lastScore.data.map(d => d.score),
            backgroundColor: bgColor,
            borderColor: borderColor,
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
            backgroundColor: bgColor,
            borderColor: borderColor,
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