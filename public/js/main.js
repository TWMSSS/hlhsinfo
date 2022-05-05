const page = [
    {
        path: "/",
        name: "首頁",
        id: "home",
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
    }
]

function changePathName(name) {
    if (history.length > 1 && window.history.state !== null) name = "<a href='#' onclick='history.back();'><返回</a> " + name;
    document.querySelector("#pathName").innerHTML = name;
}

function createTaskBox() {
    // Create a progressing task box
    var taskBox = document.createElement("div");
    taskBox.classList.add("taskBox");
    taskBox.innerHTML = `
        <div class="tskbx">
            <div class="taskBoxTitle">
                <h1>資料處理中...</h1>
            </div>
            <div class="taskBoxTasks">
                <div class="task">
                    <div class="taskStatus">
                        <span class="icon"><i class="fa-solid fa-circle-check"></i></span>
                    </div>
                    <span class="taskName">sfosng okndskjsfosng okndskjsfosng okndskjsfosng okndskjsfosng okndskjsfosng okndskjsfosng okndskj</span>
                </div>
                <div class="task">
                    <div class="taskStatus">
                        <span class="icon"><i class="fa-solid fa-circle-check"></i></span>
                    </div>
                    <span class="taskName">Test</span>
                </div>
                <div class="task">
                    <div class="taskStatus">
                        <span class="icon"><i class="fa-solid fa-circle-xmark"></i></span>
                    </div>
                    <span class="taskName">15215916516516515616515616511561651</span>
                </div>
                <div class="task">
                    <div class="taskStatus">
                        <span class="icon"><i class="fa-solid fa-circle-check"></i></span>
                    </div>
                    <span class="taskName">5461246216421624612626</span>
                </div>
                <div class="task">
                    <div class="taskStatus">
                        <span class="icon"><i class="fa-solid fa-circle-check"></i></span>
                    </div>
                    <span class="taskName">sfosng okndskjsfosng okndskjsfosng okndskjsfosng okndskjsfosng okndskjsfosng okndskjsfosng okndskj</span>
                </div>
                <div class="task">
                    <div class="taskStatus">
                        <span class="icon"><i class="fa-solid fa-circle-xmark"></i></span>
                    </div>
                    <span class="taskName">Test</span>
                </div>
                <div class="task">
                    <div class="taskStatus">
                        <span class="icon"><i class="fa-solid fa-circle-xmark"></i></span>
                    </div>
                    <span class="taskName">15215916516516515616515616511561651</span>
                </div>
                <div class="task">
                    <div class="taskStatus">
                        <span class="icon"><i class="fa-solid fa-spinner"></i></span>
                    </div>
                    <span class="taskName">5461246216421624612626</span>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(taskBox);
    return taskBox;
}

function addRunningList(data) {
    
};

function loadPageScript(id) {
    if (page.find(e => e.id === id) === undefined) return;
    fetch(`/js/page/${id}.js`).then(res => res.text()).then(res => {
        eval(res);
        execute();
    })
};

function loadPage(path, orgPath) {
    if (path === orgPath) return;

    changePathName(page.find(e => e.path === path).name);
    loadPageScript(page.find(e => e.path === path).id);
}

function goPage(path) {
    var orgPath = location.pathname;
    window.history.pushState({}, "", path);
    loadPage(path, orgPath);
}

document.addEventListener("click", event => {
    try {
        var ele = event.path.find(e => e.tagName.toLowerCase() === "a");
    } catch (err) {
        return;
    }
    if (ele) {
        event.preventDefault();
        var url = ele.href;
        if (url === undefined || url === "" || url === null) return;
        var urlObject = new URL(url);
        if (urlObject.host === window.location.host) {
            goPage(urlObject.pathname);
            return;
        }
        location.href = url;
    }
});

document.addEventListener("DOMContentLoaded", () => {
    loadPage(location.pathname);
})

window.onpopstate = event => {
    loadPage();
}