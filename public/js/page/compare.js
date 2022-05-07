window.execute = async () => {
    var pageElement = document.querySelector("#mainContent");

    if (sessionStorage.getItem("auth") === null) {
        goPage("/");
        return;
    }

    var auth = sessionStorage.getItem("auth");
    var scoreData;

    var task = addTaskList("取得所有成績");
    await fetch("/api/getAllScores", {
        method: "GET",
        headers: {
            "authorization": auth
        }
    }).then(res => res.json()).then(res => {
        if (res.message !== "Success!") {
            setTaskStatus(task, "fail");
            goPage("/");
            finishTask();
            return;
        }
        scoreData = res.data;
    });

    setTaskStatus(task, "success");

    task = addTaskList("分析資料");

    var list = "";
    scoreData.dataTest.forEach(dt => {
        list += `
            <div class="analyse">
                <h1>${dt.name}歷史成績比較</h1>
                <canvas class="chart" width="400" height="400" data-scordID="${dt.name}#Test"></canvas>
            </div>
        `;
    });

    var listNormal = "";
    scoreData.dataNormal.forEach(dt => {
        listNormal += `
            <div class="analyse">
                <h1>${dt.name}歷史成績比較</h1>
                <canvas class="chart" width="400" height="400" data-scordID="${dt.name}#Normal"></canvas>
            </div>
        `;
    });

    pageElement.innerHTML = `
        <div class="profile">
            <h1 class="pageTitle">考試成績比較</h1>
            <div class="profileInfo">
                <table>
                    ${list}
                </table>
            </div>
        </div>
        <div class="extra">
            <h1 class="pageTitle">平時成績比較</h1>
            <div class="profileInfo">
                <table>
                    ${listNormal}
                </table>
            </div>
        </div>
    `;

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

    scoreData.dataTest.forEach(dt => {
        var scoreAnalyse = document.querySelector(`canvas[data-scordID="${dt.name}#Test"]`);

        var anaD1 = [{
            label: "成績",
            data: dt.values.map(e => e.value),
            backgroundColor: bgColor,
            borderColor: borderColor,
            borderWidth: 1,
            fill: true
        }];

        new Chart(scoreAnalyse, {
            type: "line",
            data: {
                labels: dt.values.map(e => e.name.name),
                datasets: anaD1
            }
        });
    });

    scoreData.dataNormal.forEach(dt => {
        var scoreAnalyse = document.querySelector(`canvas[data-scordID="${dt.name}#Normal"]`);

        var anaD1 = [{
            label: "成績",
            data: dt.values.map(e => e.value),
            backgroundColor: bgColor,
            borderColor: borderColor,
            borderWidth: 1,
            fill: true
        }];

        new Chart(scoreAnalyse, {
            type: "line",
            data: {
                labels: dt.values.map(e => e.name),
                datasets: anaD1
            }
        });
    });

    setTaskStatus(task, "success");
    finishTask();
}