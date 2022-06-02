window.pageData.function.execute = async () => {
    const dbKey = localStorage.getItem("nowSchedule");

    // IndexedDB for schedule
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

    var objectStore;
    var scheData;
    var teacher, className;

    function b() {
        return new Promise((resolve, reject) => {
            var transaction = db.transaction(["class"], "readwrite");

            transaction.onerror = (event) => {
                console.error(event)
            };

            objectStore = transaction.objectStore("class");
            try {
                var data = objectStore.get(dbKey);
            } catch (e) {
                return resolve(false);
            }
            data.onsuccess = (event) => {
                if (event.target.result) {
                    scheData = event.target.result.schedule;
                    teacher = event.target.result.teacher;
                    className = event.target.result.class;
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
                resolve(false);
            }
        });
    }
    var dbStatus = await b();

    if (dbStatus) {
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

        var classNowIndex = scheData.findIndex(b => b !== null && Date.now() > b.time.start && Date.now() < b.time.end);
        var weekDay = new Date().getDay() - 1;
        var classNow, classNext;
        if (classNowIndex === -1) {
            classNowIndex = scheData.findIndex(b => b !== null && Date.now() < b.time.end) - 1;
            if (classNowIndex === -2) {
                classNow = {
                    section: "課程",
                    class: "沒有課程",
                    teacher: ""
                };
            } else {
                classNow = {
                    section: `${scheData[classNowIndex].section} 與 ${scheData[classNowIndex + 1].section} 間`,
                    class: "下課",
                    teacher: ""
                };
            }
        } else {
            var thisClass = scheData[classNowIndex].class[weekDay];
            classNow = {
                section: scheData[classNowIndex].section,
                class: thisClass !== null ? thisClass.className : "沒有課程",
                teacher: `${thisClass !== null ? thisClass.teacher.length > 0 ? `<span class="dataExtra">由 ${thisClass.teacher.join("老師, ")}老師 授課</span>` : "" : ""}`
            };
        }
        if (scheData[classNowIndex + 1] && classNowIndex !== -1 || scheData.findIndex(b => b !== null && b.time.end > Date.now()) !== -1) {
            if (classNowIndex === -1) classNowIndex = 0;
            var nextClass = scheData[classNowIndex + 1].class[weekDay];
            if (nextClass !== null) {
                classNext = {
                    section: scheData[classNowIndex + 1].section,
                    class: nextClass.className,
                    teacher: nextClass.teacher.length > 0 ? `<span class="dataExtra">由 ${nextClass.teacher.join("老師, ")}老師 授課<span class="dataExtra">` : ""
                };
            } else {
                classNext = {
                    section: scheData[classNowIndex + 1].section,
                    class: "沒有課程",
                    teacher: ""
                };
            }
        } else {
            var classNext = {
                section: "課程",
                class: "沒有課程",
                teacher: ""
            }
        }

        return {
            classNow,
            classNext,
            info: {
                teacher,
                className
            }
        }
    } else {
        return {
            classNow: {},
            classNext: {}
        }
    }
};