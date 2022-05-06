window.execute = async () => {
    var pageElement = document.querySelector("#mainContent");

    if (sessionStorage.getItem("auth") === null) {
        goPage("/");
        return;
    }

    var auth = sessionStorage.getItem("auth");
    var userData;

    var task = addTaskList("取得個人資料");
    await fetch("/api/getUserInfo", {
        method: "GET",
        headers: {
            "authorization": auth
        },
    }).then(res => res.json()).then(res => {
        if (res.message !== "Success!") {
            setTaskStatus(task, "fail");
            goPage("/");
            return;
        }
        userData = res.data;
    });
    setTaskStatus(task, "success");

    task = addTaskList("分析資料");
    var list = "";

    userData.data.forEach(dt => {
        list += `
            <tr>
                <td>${dt.name}</td>
                <td>${dt.value === "" ? "(伺服器沒有資料或此訊息不支援BIG5編碼)" : dt.value}</td>
            </tr>
        `;
    });
    setTaskStatus(task, "success");

    pageElement.innerHTML = `
        <div class="profile">
            <h1 class="pageTitle">個人資料</h1>
            <div class="profileInfo">
                <img src="${userData.profileImg}" width="250">
                <table>
                    ${list}
                </table>
            </div>
        </div>
    `;
    finishTask();
}