window.execute = async () => {
    var pageElement = document.querySelector("#mainContent");

    if (sessionStorage.getItem("auth") === null) {
        goPage("/");
        return;
    }

    // IndexedDB setting up
    var schedule = new URL(location.href).searchParams.get("schedule");
    var [className, teacher] = schedule.split("-");
    var dbKey = className + [...teacher].map(e => e.charCodeAt().toString(16)).join("");

    var idb = window.indexedDB ||
        window.mozIndexedDB ||
        window.webkitIndexedDB;

    var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;
    var IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;

    var db;

    function a() {
        return new Promise((resolve, reject) => {
            var request = idb.open("schedule", 1);
            var t = false;
            request.onupgradeneeded = (upgradeDb) => {
                t = true;
                db = request.result;
                if (!db.objectStoreNames.contains('class')) {
                    var objectStore = upgradeDb.currentTarget.result.createObjectStore('class', {
                        keyPath: "classid",
                        autoIncrement: true
                    });
                    objectStore.createIndex("teacher", "teacher", { unique: false });
                    objectStore.createIndex("class", "class", { unique: true });
                }
                setTimeout(() => {
                    return resolve(true);
                }, 500);
            };
            request.onsuccess = (event) => {
                db = request.result;
                setTimeout(() => {
                    return resolve(true);
                }, 500);
            };
            request.onerror = (event) => {
                console.log(event)
            };
        });
    }
    await a();

    var auth = sessionStorage.getItem("auth");
    var scheData;
    
    var task = addTaskList("取得課表資料");
    var objectStore;

    function b() {
        return new Promise((resolve, reject) => {
            var transaction = db.transaction(["class"], "readwrite");

            transaction.onerror = (event) => {
                console.error(event)
            };

            objectStore = transaction.objectStore("class");
            var data = objectStore.get(dbKey);
            data.onsuccess = (event) => {
                if (event.target.result) {
                    scheData = event.target.result.schedule;
                    return resolve(true);
                };
                resolve(false);
            }
            data.onerror = (event) => {
                console.error(event)
            }
        });
    }

    var dbStatus = await b();

    if (!dbStatus) {
        await fetch(`/api/getSchedule?class=${className}&teacher=${teacher}`, {
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

            var transaction = db.transaction(["class"], "readwrite");
            objectStore = transaction.objectStore("class");
            objectStore.add({
                classid: dbKey,
                class: className,
                teacher: teacher,
                schedule: scheData
            });
        });
        
    }

    setTaskStatus(task, "success");
    task = addTaskList("分析資料");

    window.scheData = scheData.map(e => {
        if (!e) return null;
        const todayTime = new Date();
        todayTime.setHours(0);
        todayTime.setMinutes(0);
        todayTime.setSeconds(0);

        var startTime = e.time.start;
        var endTime = e.time.end;

        var startTime = startTime.split(":");
        todayTime.setHours(Number(startTime[0]));
        todayTime.setMinutes(Number(startTime[1]));
        e.time.start = todayTime.getTime();

        var endTime = endTime.split(":");
        todayTime.setHours(Number(endTime[0]));
        todayTime.setMinutes(Number(endTime[1]));
        e.time.end = todayTime.getTime();

        return e;
    });

    var classNowIndex = scheData.findIndex(b => b !== null && Date.now() > b.time.start && Date.now() < b.time.end);
    var weekDay = new Date().getDay() - 1;
    if (classNowIndex === -1) {
        classNowIndex = scheData.findIndex(b => b !== null && Date.now() - 600000 > b.time.start && Date.now() - 600000 < b.time.end);
        if (classNowIndex === -1) {
            var classNow = `<div class="dataBox"><span class="dataTitle">課程</span><span class="dataValue">沒有課程</span></div>`;
        } else {
            var classNow = `<div class="dataBox"><span class="dataTitle">${scheData[classNowIndex].section} 與 ${scheData[classNowIndex].section} 間</span><span class="dataValue">下課</span></div>`;
        }
    } else {
        var thisClass = scheData[classNowIndex].class[weekDay];
        var classNow = `<div class="dataBox"><span class="dataTitle">${scheData[classNowIndex].section}</span><span class="dataValue">${thisClass !== null ? thisClass.className : "沒有課程"}</span>${thisClass !== null ? thisClass.teacher.length > 0 ? `<span class="dataExtra">由 ${thisClass.teacher.join("老師, ")}老師 授課<span class="dataExtra">` : "" : ""}</span></div>`;
    }
    if (scheData[classNowIndex + 1] && classNowIndex !== -1 || scheData.findIndex(b => b !== null && b.time.end > Date.now()) !== -1) {
        if (classNowIndex === -1) classNowIndex = 0;
        var nextClass = scheData[classNowIndex + 1].class[weekDay];
        var classNext = `<div class="dataBox"><span class="dataTitle">${scheData[classNowIndex + 1].section}</span><span class="dataValue">${nextClass.className}</span>${nextClass.teacher.length > 0 ? `<span class="dataExtra">由 ${nextClass.teacher.join("老師, ")}老師 授課<span class="dataExtra">` : ""}`;
        if (classNowIndex + 1 === scheData.length - 1) {
            var classLeft = `<div class="dataBox"><span class="dataTitle">課程</span><span class="dataValue">放學</span></div>`;
        } else {
            var classLeft = "";
            for (var i = classNowIndex + 2; i < scheData.length; i++) {
                if (scheData[i] === null) continue;
                var leftClass = scheData[i].class[weekDay];
                classLeft += `<div class="dataContent"><div class="dataBox"><span class="dataTitle">${scheData[i].section}</span><span class="dataValue">${leftClass ? leftClass.className : "沒有課程"}</span>${leftClass ? leftClass.teacher.length > 0 ? `<span class="dataExtra">由 ${leftClass.teacher.join("老師, ")}老師 授課<span class="dataExtra">` : "" : ""}</div></div>`;
            }
        }
    } else {
        var classNext = `<div class="dataBox"><span class="dataTitle">課程</span><span class="dataValue">沒有課程</span></div>`;
        var classLeft = `<div class="dataContent"><div class="dataBox"><span class="dataTitle">課程</span><span class="dataValue">放學</span></div></div>`;
    }

    pageElement.innerHTML = `
        <div class="profile">
            <h1 class="pageTitle">當前課程</h1>
            <div class="profileInfo">
                <div class="dataContent">
                    ${classNow}
                </div>
            </div>

            <h1 class="pageTitle">下節課程</h1>
            <div class="profileInfo">
                <div class="dataContent">
                    ${classNext}
                </div>
            </div>

            <h1 class="pageTitle">剩下的課程</h1>
            <div class="profileInfo">
                ${classLeft}
            </div>
        </div>
    `;

    setTaskStatus(task, "success");
    finishTask();
}