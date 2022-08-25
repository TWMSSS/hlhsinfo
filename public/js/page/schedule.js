window.execute = async () => {
    var pageElement = document.querySelector("#mainContent");

    // IndexedDB setting up
    var schedule = new URL(location.href).searchParams.get("schedule");
    var [className, teacher] = schedule.split("-");
    var dbKey = className + [...teacher].map(e => e.charCodeAt().toString(16)).join("");
    var isExpired = false;

    var idb = window.indexedDB ||
        window.mozIndexedDB ||
        window.webkitIndexedDB;

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
                    if (!event.target.result.time || event.target.result.time.end < Date.now()) {
                        // remove expired data
                        var transaction = db.transaction(["class"], "readwrite");
                        var objectStore = transaction.objectStore("class");
                        objectStore.delete(dbKey);
                        return resolve(false);
                    }
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
        if (sessionStorage.getItem("auth") === null) {
            goPage("/");
            return;
        }

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
            scheData = res.data.schedule;

            var transaction = db.transaction(["class"], "readwrite");
            objectStore = transaction.objectStore("class");
            objectStore.add({
                classid: dbKey,
                class: className,
                teacher: teacher,
                schedule: scheData,
                time: {
                    start: new Date(res.data.time.start).getTime(),
                    end: new Date(res.data.time.end).getTime()
                }
            });
            var expried = new Date(res.data.time.end).getTime();
            if (expried <= Date.now()) {
                isExpired = true;
            }
        });
        
    }

    setTaskStatus(task, "success");
    task = addTaskList("分析資料");

    localStorage.setItem("nowSchedule", dbKey);

    scheData = scheData.map(e => {
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

    scheData = scheData.filter(e => e !== null);
    var choose = new Date().getDay() > 5 ? 0 : new Date().getDay();

    function c() {
        var classNowIndex = scheData.findIndex(b => b !== null && Date.now() > b.time.start && Date.now() < b.time.end);
        var weekDay = new Date().getDay() - 1;
        if (classNowIndex === -1) {
            classNowIndex = scheData.findIndex(b => b !== null && Date.now() < b.time.end) - 1;
            if (classNowIndex === -2) {
                var classNow = `<div class="dataBox"><span class="dataTitle">課程</span><span class="dataValue">沒有課程</span></div>`;
            } else {
                if (!scheData[classNowIndex]) {
                    var classNow = `<div class="dataBox"><span class="dataTitle">課程</span><span class="dataValue">沒有課程</span></div>`;
                } else {
                    var classNow = `<div class="dataBox"><span class="dataTitle">${scheData[classNowIndex].section} 與 ${scheData[classNowIndex + 1].section} 間</span><span class="dataValue">下課</span></div>`;
                }
            }
        } else {
            var thisClass = scheData[classNowIndex].class[weekDay];
            var classNow = `<div class="dataBox"><span class="dataTitle">${scheData[classNowIndex].section}</span><span class="dataValue">${thisClass !== null ? thisClass.className : "沒有課程"}</span>${thisClass !== null ? thisClass.teacher.length > 0 ? `<span class="dataExtra">由 ${thisClass.teacher.join("老師, ")}老師 授課<span class="dataExtra">` : "" : ""}</span></div>`;
        }
        if (scheData[classNowIndex + 1] && classNowIndex !== -1 || scheData.findIndex(b => b !== null && b.time.end > Date.now()) !== -1) {
            if (classNowIndex === -1) classNowIndex = 0;
            var nextClass = scheData[classNowIndex + 1].class[weekDay];
            if (nextClass !== null) {
                var classNext = `<div class="dataBox"><span class="dataTitle">${scheData[classNowIndex + 1].section}</span><span class="dataValue">${nextClass.className}</span>${nextClass.teacher.length > 0 ? `<span class="dataExtra">由 ${nextClass.teacher.join("老師, ")}老師 授課<span class="dataExtra">` : ""}`;
            } else {
                var classNext = `<div class="dataBox"><span class="dataTitle">${scheData[classNowIndex + 1].section}</span><span class="dataValue">沒有課程</span>`;
            }
            if (classNowIndex + 1 === scheData.length - 1) {
                var classLeft = `<div class="dataContent"><div class="dataBox"><span class="dataTitle">課程</span><span class="dataValue">放學</span></div></div>`;
            } else {
                var classLeft = "";
                for (var i = classNowIndex + 2; i < scheData.length; i++) {
                    if (scheData[i] === null) continue;
                    var leftClass = scheData[i].class[weekDay];
                    if (!leftClass) continue;
                    classLeft += `<div class="dataContent"><div class="dataBox"><span class="dataTitle">${scheData[i].section}</span><span class="dataValue">${leftClass.className}</span>${leftClass.teacher.length > 0 ? `<span class="dataExtra">由 ${leftClass.teacher.join("老師, ")}老師 授課<span class="dataExtra">` : ""}</div></div>`;
                }
                classLeft += `<div class="dataContent"><div class="dataBox"><span class="dataTitle">課程</span><span class="dataValue">放學</span></div></div>`;
            }
        } else {
            var classNext = `<div class="dataBox"><span class="dataTitle">課程</span><span class="dataValue">沒有課程</span></div>`;
            var classLeft = `<div class="dataContent"><div class="dataBox"><span class="dataTitle">課程</span><span class="dataValue">放學</span></div></div>`;
        }

        var week = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

        week.forEach((e, index) => {
            if (choose === index) {
                week[index] = `<option value="${index}" selected>${e}</option>`;
            } else {
                week[index] = `<option value="${index}">${e}</option>`;
            }
        });

        function rdNDSch() {
            var classNextDay = "";
            for (var i = 0; i < scheData.length; i++) {
                if (scheData[i] === null) continue;
                var nextDayClass = scheData[i].class[choose];
                if (!nextDayClass) continue;
                classNextDay += `<div class="dataContent"><div class="dataBox"><span class="dataTitle">${scheData[i].section}</span><span class="dataValue">${nextDayClass.className}</span>${nextDayClass.teacher.length > 0 ? `<span class="dataExtra">由 ${nextDayClass.teacher.join("老師, ")}老師 授課<span class="dataExtra">` : ""}</div></div>`;
            }
            classNextDay += `<div class="dataContent"><div class="dataBox"><span class="dataTitle">課程</span><span class="dataValue">放學</span></div></div>`;

            return classNextDay;
        }
        classNextDay = rdNDSch();

        pageElement.innerHTML = `
            <div class="schedule">
                <h1 class="pageTitle">當前課程</h1>
                ${isExpired ? "<p style='color: orange;font-weight: 600;font-size: 1.5rem;'>注意: 這個課程表已過期了!</p>" : ""}
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
            <div class="otherSchedule">
                <h1 class="pageTitle">其他課程</h1>
                <div class="ct">
                    <select id="wkd" name="weekDay">
                        ${week.join("")}
                    </select>
                    <div id="wkdSchedule">
                        ${classNextDay}
                    </div>
                </div>
            </div>
        `;

        var weekDay = document.getElementById("wkd");
        weekDay.addEventListener("change", () => {
            choose = Number(weekDay.value);
            classNextDay = rdNDSch();
            document.querySelector("#wkdSchedule").innerHTML = classNextDay;
        });
    }
    c();

    setTaskStatus(task, "success");
    finishTask();

    window.pageData.Interval.push(setInterval(c, 60000));
}