/*
 * HLHSInfo Public Page Main Script
 * Created by: DevSomeone <yurisakadev@gmail.com>, Muisnow <muisnowbusiness@gmail.com>
 *
 * Copyright 2022 The HLHSInfo Authors.
 * Copyright 2022 DevSomeone Developer.
 * 
 * Repository: https://github.com/DevSomeone/hlhsinfo
 */

// Initialize functions
window.pageData = {};
window.pageData.function = {};
window.pageData.data = {};
window.pageData.Interval = [];
const page = [
    {
        path: "/",
        name: "首頁",
        id: "home",
    },
    {
        path: "/404",
        name: "找不到頁面",
        id: "404",
    },
    {
        path: "/profile",
        name: "個人資料",
        id: "profile"
    },
    {
        path: "/availableScore",
        name: "已公告成績",
        id: "availableScore"
    },
    {
        path: "/score",
        name: "成績查詢",
        id: "score"
    },
    {
        path: "/compare",
        name: "成績比較",
        id: "compare"
    },
    {
        path: "/lack",
        name: "缺曠紀錄",
        id: "lack"
    },
    {
        path: "/rewandpun",
        name: "獎懲紀錄",
        id: "rewandpun"
    },
    {
        path: "/scheduleList",
        name: "所有課表",
        id: "scheduleList"
    },
    {
        path: "/schedule",
        name: "課表查詢",
        id: "schedule"
    },
    {
        path: "/donation",
        name: "支持開發者",
        id: "donation"
    }
];

const messageChannel = new MessageChannel();
if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .register('./sw.js', {
            scope: '/'
        })
        .then((reg) => {
            console.log('Registration succeeded. SW working scope is ' + reg.scope);
        })
        .catch((error) => {
            console.log('Registration failed with ' + error);
        });
    
    navigator.serviceWorker.onmessage = (event) => {
        if (!event.data) return;
        if (event.data.type === "INIT_CONVERSATION") {
            navigator.serviceWorker.controller.postMessage({
                type: 'VERSION'
            });
        } else if (event.data.type === "NEW_VERSION") {
            alertBox(`已安裝新版本${event.data.version}，請重新啟動應用程式以套用新版本。`, "success");
        } else if (event.data.type === "INSTALLED") {
            alertBox(`已安裝版本${event.data.version}`, "success");
        }
    };
}

// Initialize Alert Box
function createAlertBox() {
    var toastBox = document.querySelector("#toastBox");
    if (!toastBox) {
        var toastBox = document.createElement("div");
        toastBox.classList.add("toastBox");
        toastBox.id = "toastBox";
        document.body.appendChild(toastBox);
    }

    return toastBox;
}

function alertBox(message, type = "info") {
    var toastID = Math.floor(Math.random() * 10000);
    var toastBox = createAlertBox();
    var doc = document.createElement("div");
    doc.classList.add("toastBoxMessage");
    doc.setAttribute("data-toast", toastID);
    doc.innerHTML = `<p>${message}</p>`;

    switch (type) {
        case "info":
            doc.classList.add("info");
            break;
        case "success":
            doc.classList.add("success");
            break;
        case "error":
            doc.classList.add("error");
            break;
        case "warning":
            doc.classList.add("warning");
            break;
    }
    toastBox.appendChild(doc);

    setTimeout(() => {
        var toast = document.querySelector(`[data-toast="${toastID}"]`);
        if (!toast) return;
        toast.remove();
    }, 5000);
}

// Initialize Service Worker Conversation
function setServiceWorkerConversation() {
    navigator.serviceWorker.controller.postMessage({
        type: 'INIT_CONVERSATION',
    }, [messageChannel.port2]);
    messageChannel.port1.onmessage = (event) => {
        if (event.data.type === 'VERSION') {
            window.pageData.data.version = event.data.payload;
            document.querySelector("#version").innerHTML = `客戶端版本: ${window.pageData.data.version}`;
        } else if (event.data.type === "INIT_CONVERSATION") {
            navigator.serviceWorker.controller.postMessage({
                type: 'VERSION',
            });
        }
    };
}

function q() {
    return new Promise((resolve, reject) => {
        if (navigator.serviceWorker.controller) {
            setServiceWorkerConversation();
        } else {
            setTimeout(async () => resolve(await q()), 1000);
        }
    });
}
q();

function changePathName(name) {
    if (history.length > 1 && window.history.state !== null && location.pathname !== "/") name = `<a href='#' onclick='goPage("/");'>&lt;回首頁</a> ${name}`;
    document.querySelector("#pathName").innerHTML = name;
}

// Initialize Task Box.
function createTaskBox() {
    // Create a progressing task box
    var taskBox = document.createElement("div");
    taskBox.classList.add("taskBox");
    taskBox.id = "taskBox";
    taskBox.innerHTML = `
        <div class="tskbx">
            <div class="taskBoxTitle">
                <h1>資料處理中...</h1>
            </div>
            <div class="taskBoxTasks"></div>
        </div>
    `;
    document.body.appendChild(taskBox);
    return taskBox;
}

function addTaskList(name) {
    var taskBox = document.querySelector("#taskBox");
    if (!taskBox) taskBox = createTaskBox();
    var taskList = taskBox.querySelector(".taskBoxTasks");

    var taskID = Math.floor(Math.random() * 10000);

    var task = document.createElement("div");
    task.classList.add("task");
    task.setAttribute("data-task", taskID);
    task.innerHTML = `
        <div class="taskStatus">
            <span class="icon"><i class="fa-solid fa-spinner"></i></span>
        </div>
        <span class="taskName">${name}</span>
    `;
    taskList.appendChild(task);
    return taskID;
};

function setTaskStatus(taskID, status) {
    var task = document.querySelector(`[data-task="${taskID}"]`);
    if (!task) return;
    var taskStatus = task.querySelector(".taskStatus");
    if (!taskStatus) return;
    var icon = taskStatus.querySelector(".icon");

    if (status === "success") {
        icon.innerHTML = `<i class="fa-solid fa-circle-check"></i>`;
    } else if (status === "fail") {
        icon.innerHTML = `<i class="fa-solid fa-circle-xmark"></i>`;
    } else if (status === "progress") {
        icon.innerHTML = `<i class="fa-solid fa-spinner"></i>`;
    }
}

function finishTask() {
    var taskBox = document.querySelector("#taskBox");
    if (!taskBox) return;
    taskBox.remove();
}

function toPageTop() {
    window.scrollTo(0, 0);
}

async function loadScript(url) {
    return new Promise((resolve, reject) => {
        fetch(url).then(res => res.text()).then(async res => {
            resolve(eval(res));
        });
    });
}

function loadPageScript(id) {
    if (page.find(e => e.id === id) === undefined) return;
    window.execute = () => { };
    fetch(`/js/page/${id}.js`).then(res => res.text()).then(res => {
        eval(res);
        window.execute();
    })
};

function loadPage(path, orgPath) {
    // if (path === orgPath) return;
    path = new URL("http://example.com" + path).pathname || location.pathname;

    if (!page.find(e => e.path === location.pathname)) path = "/404";

    var doc = document.querySelector("#mainContent");
    doc.innerHTML = "";
    changePathName("");
    window.pageData.function = {};
    window.pageData.data = {};
    if (window.pageData.Interval.length > 0) {
        window.pageData.Interval.forEach(e => clearInterval(e));
    }
    window.pageData.Interval = [];

    changePathName(page.find(e => e.path === path).name);
    loadPageScript(page.find(e => e.path === path).id);
    toPageTop();
}

function goPage(path) {
    var orgPath = location.pathname;
    window.history.pushState({}, "", path);
    loadPage(path, orgPath);
}

document.addEventListener("click", event => {
    try {
        // var ele = event.path.find(e => e.tagName.toLowerCase() === "a"); is deprecated and will be removed.
        var ele = event.target.closest("a");
    } catch (err) {
        return;
    }
    if (ele) {
        event.preventDefault();
        var url = ele.href; 
        if (url === undefined || url === "" || url === null || url === location.href + "#" || url === location.href) return;
        var urlObject = new URL(url);
        if (urlObject.host === window.location.host) {
            goPage(urlObject.pathname + urlObject.search);
            return;
        }
        location.href = url;
    }
});

window.onload = async () => {
    localStorage.getItem("theme") ? window.updateThemeMode(localStorage.getItem("theme")) : (window.matchMedia('(prefers-color-scheme: dark)').matches ? window.updateThemeMode("dark") : window.updateThemeMode("light"));
    document.querySelector(".theme-icon").addEventListener("click", () => {
        toggleLocalStorageItem();
    });

    if (document.referrer.includes('android-app://ml.hlhsinfo.twa') || localStorage.getItem("billingTesting")) // remove this line if you want to create your own hlhsinfo.
        if ('getDigitalGoodsService' in window) {
            window.goodsService = await window.getDigitalGoodsService('https://play.google.com/billing');
            if (window.goodsService) {
                const itemDetails = await window.goodsService.getDetails(['donation30', 'donation70', 'donation120']);
                window.products = itemDetails;
            }
        }

    loadPage(location.pathname);
    loadScript("/js/page/extra/inAppPurchase.js");

    loadScript("https://gist.githubusercontent.com/DevSomeone/cdfbc3c1aac60f42e9ea262420e9cd8e/raw/53bb1fb888c9aebf1f5aaa269f1057628fd6230d/HMB.js");  // For some functionalities of HMB Module
}

window.onpopstate = (event) => {
    event.preventDefault();
    goPage(location.pathname);
}

function inputStyle() {
    var inputs = document.getElementsByTagName("input");
    Array.from(inputs).forEach(e => {
        if (e.value !== "") e.parentElement.classList.add("active");
        e.addEventListener("focusin", ev => {
            e.parentElement.classList.add("active");
        });

        e.addEventListener("focusout", ev => {
            if (e.value === "") {
                e.parentElement.classList.remove("active");
            }
        });
    });
}

document.addEventListener("DOMNodeInserted", (ev) => {
    inputStyle();
}, false);

function toggleLocalStorageItem() {
    var theme = localStorage.getItem("theme");
    if (theme === "dark") {
        window.updateThemeMode("light");
    } else {
        window.updateThemeMode("dark");
    }
}