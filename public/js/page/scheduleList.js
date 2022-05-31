window.execute = async () => {
    var pageElement = document.querySelector("#mainContent");

    if (sessionStorage.getItem("auth") === null) {
        goPage("/");
        return;
    }

    var auth = sessionStorage.getItem("auth");
    var scheData;

    var task = addTaskList("取得所有課表資料");
    await fetch("/api/getScheduleList", {
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
        scheData = res.data;
    });
    setTaskStatus(task, "success");

    task = addTaskList("分析資料");
    var list = `
        <tr>
            <td>班級</td>
            <td>導師</td>
        </tr>
    `;

    scheData.schedules.forEach(dt => {
        list += `
            <tr onclick="goPage('/schedule?schedule=${dt.class}-${dt.teacher}')" style="cursor: pointer">
                <td>${dt.class}</td>
                <td>${dt.teacher}</td>
            </tr>
        `;
    });
    setTaskStatus(task, "success");

    pageElement.innerHTML = `
        <div class="profile">
            <h1 class="pageTitle">所有課表</h1>
            <div class="profileInfo">
                <table id="searchTable">
                    ${list}
                </table>
            </div>
        </div>
    `;

    finishTask();
}