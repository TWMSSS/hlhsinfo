window.execute = async () => {
    var pageElement = document.querySelector("#mainContent");

    if (sessionStorage.getItem("auth") === null) {
        goPage("/");
        return;
    }

    var auth = sessionStorage.getItem("auth");
    var rewData;

    var task = addTaskList("取得獎懲資料");
    await fetch("/api/getRewAndPun", {
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
        rewData = res.data;
    });
    setTaskStatus(task, "success");

    task = addTaskList("分析資料");

    var rewList = `
        <tr>
            <td>類別</td>
            <td>次數</td>
        </tr>
    `;
    rewData.status.forEach(e => {
        rewList += `
            <tr>
                <td>${e.type}</td>
                <td>${e.times}</td>
            </tr>
        `;
    });

    var detailList = `
        <tr>
            <td>類別</td>
            <td>次數</td>
            <td>開始:簽署</td>
            <td>原因</td>
            <td>處置</td>
            <td>銷過日期</td>
        </tr>
    `;
    rewData.detail.forEach(e => {
        detailList += `
            <tr>
                <td>${e.type}</td>
                <td>${e.start}:${e.signed}</td>
                <td>${e.reason}</td>
                <td>${e.execute}</td>
                <td>${e.sold === null ? "N/A" : e.sold}</td>
            </tr>
        `;
    });

    pageElement.innerHTML = `
        <div class="total">
            <h1 class="pageTitle">獎懲統計</h1>
            <div class="totalInfo">
                <table>
                    ${rewList}
                </table>
            </div>
        </div>
        <div class="total">
            <h1 class="pageTitle">獎懲資料</h1>
            <div class="totalInfo">
                <table>
                    ${detailList}
                </table>
            </div>
        </div>
    `;
    setTaskStatus(task, "success");
    finishTask();
}