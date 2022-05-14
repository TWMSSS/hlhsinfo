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

    var rewList = "";
    rewData.status.forEach(e => {
        rewList += `<div class="dataBox"><span class="dataTitle">${e.type}</span><span class="dataValue">${e.times}</span></div>`;
    });

    var detailList = `
        <tr>
            <td>類別</td>
            <td>開始:簽署</td>
            <td>詳細資料</td>
        </tr>
    `;
    rewData.detail.map(e => e.id = Math.floor(Math.random() * 1000000));

    window.pageData.function.openDetail = (id) => {
        var detail = rewData.detail.find(e => e.id === id);
        var doc = document.createElement("div");
        doc.classList.add("taskBox");
        doc.innerHTML = `
            <div class="tskbx">
                <div class="taskBoxTitle">
                    <h1>獎懲詳細</h1>
                </div>
                <div class="taskBoxContent">
                    <div class="group">
                        <span>類別:</span> <span>${detail.type}</span>
                    </div>
                    <div class="group">
                        <span>開始:</span> <span>${detail.start}</span>
                    </div>
                    <div class="group">
                        <span>簽署:</span> <span>${detail.signed}</span>
                    </div>
                    <div class="group">
                        <span>原因:</span> <span>${detail.reason}</span>
                    </div>
                    <div class="group">
                        <span>銷過日期:</span> <span>${detail.sold === null ? "不適用" : detail.sold}</span>
                    </div>
                    <div class="group">
                        <span>懲處方法:</span> <span>${detail.execute}</span>
                    </div>
                    <button type="button" id="close" style="background-color: red;">關閉</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(doc);
        document.querySelector("#close").addEventListener("click", () => {
            doc.remove();
        });
    };

    rewData.detail.forEach(e => {
        detailList += `
            <tr>
                <td>${e.type}</td>
                <td>${e.start}:${e.signed}</td>
                <td><a href="#" onclick="window.pageData.function.openDetail(${e.id})">詳細資料</a></td>
            </tr>
        `;
    });

    pageElement.innerHTML = `
        <div class="total">
            <h1 class="pageTitle">獎懲統計</h1>
            <div class="totalInfo">
                <div class="dataContent">
                    ${rewList}
                </div>
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