window.execute = async () => {
    var pageElement = document.querySelector("#mainContent");

    if (sessionStorage.getItem("auth") === null) {
        goPage("/");
        return;
    }

    var auth = sessionStorage.getItem("auth");
    var lackData;

    var task = addTaskList("取得缺曠資料");
    await fetch("/api/getLack", {
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
        lackData = res.data;
    });
    setTaskStatus(task, "success");

    task = addTaskList("分析資料");

    var totalRecordUP = `
        <tr>
            <td>類別</td>
            <td>節數</td>
        </tr>
    `;
    lackData.total.termUp.forEach(dt => {
        totalRecordUP += `
            <tr>
                <td>${dt.name}</td>
                <td>${dt.value}</td>
            </tr>
        `;
    });

    var totalRecordDOWN = `
        <tr>
            <td>類別</td>
            <td>節數</td>
        </tr>
    `;
    lackData.total.termDown.forEach(dt => {
        totalRecordDOWN += `
            <tr>
                <td>${dt.name}</td>
                <td>${dt.value}</td>
            </tr>
        `;
    });

    var lackRecord = `
        <tr>
            <td>日期</td>
            <td>周別</td>
            <td>曠缺節數</td>
        </tr>
    `;
    var k = ["早修", "升旗", "第一節", "第二節", "第三節", "第四節", "午修", "第五節", "第六節", "第七節", "第八節", "降旗", "第九節", "第十節", "第十一節", "第十二節"];
    lackData.record.forEach(dt => {
        var d = "";
        var t = 0;
        dt.data.forEach(dt => {
            if (dt !== null) {
                d += `
                    <div class="lackClass">
                        <span>${dt}</span>
                        <span>${k[t]}</span>
                    </div>
                `;
            }
            t++;
        })
        lackRecord += `
            <tr>
                <td>${dt.date}</td>
                <td>${dt.week}</td>
                <td>${d}</td>
            </tr>
        `;
    });
    setTaskStatus(task, "success");
    finishTask();

    pageElement.innerHTML = `
        <div class="total">
            <h1 class="pageTitle">曠缺統計</h1>
            <div class="totalInfo">
                <h1>上學期</h1>
                <table>
                    ${totalRecordUP}
                </table>
                <h1>下學期</h1>
                <table>
                    ${totalRecordDOWN}
                </table>
            </div>
        </div>
        <div class="total">
            <h1 class="pageTitle">缺曠資料</h1>
            <div class="totalInfo">
                <table>
                    ${lackRecord}
                </table>
            </div>
        </div>
    `;
}