window.execute = async () => {
    var pageElement = document.querySelector("#mainContent");

    if (sessionStorage.getItem("auth") === null) {
        goPage("/");
        return;
    }

    var auth = sessionStorage.getItem("auth");
    var scoreData;

    var task = addTaskList("取得已公告成績");
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
        scoreData = res.data;
    });
    setTaskStatus(task, "success");

    task = addTaskList("分析資料");
    var list = `
        <tr>
            <td>成績名稱</td>
            <td>成績年分</td>
            <td>成績學期</td>
        </tr>
    `;

    scoreData.forEach(dt => {
        list += `
            <tr onclick="goPage('/score?score=${dt.year}-${dt.term}-${dt.times}-${dt.testID}')" style="cursor: pointer">
                <td>${dt.name}</td>
                <td>${dt.year}</td>
                <td>${dt.term === "1" ? "上" : "下"}</td>
            </tr>
        `;
    });
    setTaskStatus(task, "success");

    pageElement.innerHTML = `
        <div class="profile">
            <h1 class="pageTitle">個人資料</h1>
            <div class="profileInfo">
                <div class="searchBox">
                    <div>
                        <label for="year">年分</label>
                        <input type="number" id="year" name="year">
                    </div>
                    <select id="term" name="term">
                        <option value="0">全部</option>
                        <option value="1">上學期</option>
                        <option value="2">下學期</option>
                    </select>
                    <select id="type" name="type">
                        <option value="0">全部</option>
                        <option value="1">考試</option>
                        <option value="2">平時</option>
                    </select>
                    <select id="times" name="times">
                        <option value="0">全部</option>
                        <option value="1">第一次段考</option>
                        <option value="2">第二次段考</option>
                        <option value="3">期末考</option>
                    </select>
                </div>
                <table id="searchTable">
                    ${list}
                </table>
            </div>
        </div>
    `;

    var searchTable = document.querySelector("#searchTable");
    var year = document.querySelector("#year");
    var term = document.querySelector("#term");
    var type = document.querySelector("#type");
    var times = document.querySelector("#times");

    function chdata() {
        list = `
            <tr>
                <td>成績名稱</td>
                <td>成績年分</td>
                <td>成績學期</td>
            </tr>
        `;

        var sc = [...scoreData];
        var sc = sc.filter(item => {
            if (year.value !== "" && year.value !== String(item.year)) {
                return false;
            }
            if (term.value !== "0" && term.value !== String(item.term)) {
                return false;
            }
            if (type.value !== "0" && type.value !== String(item.type)) {
                return false;
            }
            if (times.value !== "0" && times.value !== String(item.times)) {
                return false;
            }
            return true;
        });

        if (sc.length === 0 && year.value !== "" && term.value !== "0" && times.value !== "0") {
            list = `
                <tr onclick="goPage('/score?score=${year.value}-${term.value}-${times.value}');" style="cursor: pointer">
                    <td colspan="3">查無資料，直接查?</td>
                </tr>
            `;
        } else if (sc.length === 0) {
            list = `
                <tr>
                    <td colspan="3">查無資料，輸入年分、學期、考試即可直接查詢成績。</td>
                </tr>
            `;
        }

        sc.forEach(dt => {
            list += `
                <tr onclick="goPage('/score?score=${dt.year}-${dt.term}-${dt.times}')" style="cursor: pointer">
                    <td>${dt.name}</td>
                    <td>${dt.year}</td>
                    <td>${dt.term === "1" ? "上" : "下"}</td>
                </tr>
            `;
        });
        searchTable.innerHTML = list;
    }

    year.addEventListener("keyup", () => {
        chdata();
    });
    term.addEventListener("change", () => {
        chdata();
    });
    type.addEventListener("change", () => {
        chdata();
    });
    times.addEventListener("change", () => {
        chdata();
    });

    finishTask();
}