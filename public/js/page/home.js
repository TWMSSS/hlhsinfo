window.execute = async () => {
    var pageElement = document.querySelector("#mainContent");

    window.pageData.function.editAccount = (id) => {
        var reslogin = localStorage.getItem("reslogin");
        if (!reslogin) return;
        var reslogin = JSON.parse(reslogin);

        return new Promise(async resolve => {
            var doc = document.createElement("div");
            doc.classList.add("taskBox");
            doc.innerHTML = `
                <div class="tskbx">
                    <div class="taskBoxTitle">
                        <h1>更新帳號</h1>
                    </div>
                    <div class="taskBoxContent">
                        <div class="form-group">
                            <div>
                                <label for="displayName">顯示名稱</label>
                                <input type="text" id="displayName" name="displayName" value="${reslogin[id].displayName}">
                            </div>
                            <div>
                                <label for="schoolNumber">學號</label>
                                <input type="text" id="schoolNumber" name="schoolNumber" value="${reslogin[id].username}">
                            </div>
                            <div>
                                <label for="schoolPass">密碼</label>
                                <input type="text" id="schoolPass" name="schoolPass"  value="${reslogin[id].password}">
                            </div>
                            <button type="button" id="submitEdit">確定</button>
                            <button type="button" id="cancelEdit" style="background-color: red;">取消</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(doc);
            var submitEdit = doc.querySelector("#submitEdit");
            var cancelEdit = doc.querySelector("#cancelEdit");

            submitEdit.addEventListener("click", async () => {
                var displayName = doc.querySelector("#displayName").value;
                var schoolNumber = doc.querySelector("#schoolNumber").value;
                var schoolPass = doc.querySelector("#schoolPass").value;
                reslogin[id].displayName = displayName;
                reslogin[id].username = schoolNumber;
                reslogin[id].password = schoolPass;
                localStorage.setItem("reslogin", JSON.stringify(reslogin));
                goPage("/");
                doc.remove();
            });
            cancelEdit.addEventListener("click", () => {
                doc.remove();
            });
        });
    }

    window.pageData.function.useAccount = (id) => {
        var reslogin = localStorage.getItem("reslogin");
        if (!reslogin) return;
        var reslogin = JSON.parse(reslogin);

        var usernameEle = document.querySelector("#username");
        var passwordEle = document.querySelector("#password");
        usernameEle.value = reslogin[id].username;
        passwordEle.value = reslogin[id].password;

        document.querySelector("#loginBtn").click();
    }

    window.pageData.function.removeAccount = (id) => {
        var reslogin = localStorage.getItem("reslogin");
        if (!reslogin) return;
        var reslogin = JSON.parse(reslogin);

        reslogin.splice(id, 1);
        localStorage.setItem("reslogin", JSON.stringify(reslogin));
        goPage("/");
    }

    if (sessionStorage.getItem("auth") === null) {
        var reslogin = "";
        if (localStorage.getItem("reslogin") === null || localStorage.getItem("reslogin") === "[]") {
            reslogin = `
                <div style="text-align: center;">
                    您還尚未登入過，請先登入。
                </div>
            `;
        } else {
            var dt = JSON.parse(localStorage.getItem("reslogin"));
            var loginlist = "<table>";
            var i = 0;
            dt.forEach(e => {
                loginlist += `
                    <tr style="text-align: center;display: block;">
                        <td>
                            <a onclick="window.pageData.function.useAccount(${i});"><span>${e.displayName}(${e.username})</span></a>
                        </td>
                        <td>
                            <div>
                                <a onclick="window.pageData.function.editAccount(${i});"><span><i class="fa-solid fa-pencil"></i></span></a>
                                <a onclick="window.pageData.function.removeAccount(${i})"><span><i class="fa-solid fa-trash"></i></span></a>
                            </div>
                        </td>
                    </tr>
                `;
                i++;
            });
            reslogin = loginlist + "</table>";
        }

        pageElement.innerHTML = `
            <div class="login">
                <h1 class="pageTitle">帳號登入</h1>
                <div class="loginForm">
                    <form action="/login" id="lognForm">
                        <div class="form-group">
                            <label for="username">學號</label>
                            <input type="text" class="form-control" id="username" name="username">
                        </div>
                        <div class="form-group">
                            <label for="password">密碼</label>
                            <input type="password" class="form-control" id="password" name="password">
                        </div>
                        <button type="submit" id="loginBtn">登入</button>
                    </form>
                </div>
            </div>
            <div class="resLogin">
                <h1 class="pageTitle">曾經登入的帳號</h1>
                <div class="loginForm">
                    ${reslogin}
            </div>
        `;

        var loginForm = document.getElementById("lognForm");
        loginForm.addEventListener("submit", async ev => {
            ev.preventDefault();
            var username = document.getElementById("username").value;
            var password = document.getElementById("password").value;

            var task = addTaskList("檢查登入資訊");
            if (username === "" || password === "") {
                setTaskStatus(task, "fail");
                alert("請輸入學號及密碼");
                setTimeout(() => {
                    finishTask();
                }, 3000);
                return;
            }
            setTaskStatus(task, "success");

            task = addTaskList("取得登入資訊");
            await fetch("/api/getLoginInfo").then(res => res.json()).then(res => {
                sessionStorage.setItem("auth", res.authToken);
            });
            setTaskStatus(task, "success");

            task = addTaskList("取得驗證碼");
            function getCaptchaDataURL() {
                return new Promise(resolve => {
                    fetch("/api/getLoginCaptcha?" + Math.random(), {
                        method: "GET",
                        headers: {
                            "Authorization": `Bearer ${sessionStorage.getItem("auth")}`
                        }
                    }).then(res => res.blob()).then(res => {
                        res = URL.createObjectURL(res);
                        resolve(res);
                    });
                });
            }

            function getCaptcha() {
                return new Promise(async resolve => {
                    var doc = document.createElement("div");
                    doc.classList.add("taskBox");
                    doc.innerHTML = `
                    <div class="tskbx">
                        <div class="taskBoxTitle">
                            <h1>請輸入驗證碼</h1>
                        </div>
                        <div class="taskBoxContent">
                            <div class="form-group">
                                <img src="${await getCaptchaDataURL()}" id="captchaImg" alt="驗證碼">
                                <div>
                                    <label for="captcha">驗證碼</label>
                                    <input type="text" id="captcha" name="captcha">
                                </div>
                                <button type="button" id="refreshCaptcha">重新取得</button>
                                <button type="button" id="submitCaptcha">確定</button>
                                <button type="button" id="cancelCaptcha" style="background-color: red;">取消</button>
                            </div>
                        </div>
                    </div>
                    `;
                    document.body.appendChild(doc);
                    var captcha = document.getElementById("captchaImg");
                    var refreshCaptcha = document.getElementById("refreshCaptcha");
                    refreshCaptcha.addEventListener("click", async ev => {
                        captcha.src = await getCaptchaDataURL();
                    }, false);
                    var submitCaptcha = document.getElementById("submitCaptcha");
                    submitCaptcha.addEventListener("click", ev => {
                        resolve(document.getElementById("captcha").value);
                        doc.remove();
                    });
                    var cancelCaptcha = document.getElementById("cancelCaptcha");
                    cancelCaptcha.addEventListener("click", ev => {
                        resolve(null);
                        doc.remove();
                    });
                });
            }
            var captcha = await getCaptcha();
            if (captcha === null || captcha === "") {
                setTaskStatus(task, "fail");
                setTimeout(() => {
                    finishTask();
                }, 3000);
                return;
            }

            setTaskStatus(task, "success");

            task = addTaskList("登入至伺服器");

            await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${sessionStorage.getItem("auth")}`,
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: new URLSearchParams({
                    username: username,
                    password: password,
                    captcha: captcha
                })
            }).then(async res => {
                var dt = await res.json();
                if (res.status === 200) {
                    setTaskStatus(task, "success");
                    window.pageData.loginInfo = {
                        username: username,
                        password: password
                    }
                    goPage("/");
                    finishTask();
                } else {
                    setTaskStatus(task, "fail");
                    var t = addTaskList(`伺服器回傳: ${dt.serverMessage}`);
                    setTaskStatus(t, "fail");
                    setTimeout(() => {
                        finishTask();
                    }, 3000);
                }
            }).catch((err) => {
                console.log(err);
            });
        });
        return;
    } else {
        window.pageData.userData = {};
        var task = addTaskList("取得使用者資訊");
        var d = await fetch("/api/getUserInfoShort", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${sessionStorage.getItem("auth")}`
            }
        }).then(res => res.json());

        if (d.message !== "Success!") {
            setTaskStatus(task, "fail");
            sessionStorage.removeItem("auth");
            goPage("/");
            return;
        }

        window.pageData.userData = d.data;
        setTaskStatus(task, "success");

        finishTask();
        changePathName(`您好，${window.pageData.userData.userName}同學`);

        var reslogin = localStorage.getItem("reslogin");
        if (reslogin === null) {
            reslogin = [];
            reslogin.push({
                displayName: window.pageData.userData.userName,
                username: window.pageData.loginInfo.username,
                password: window.pageData.loginInfo.password
            });
        } else {
            reslogin = JSON.parse(reslogin);
            if (window.pageData.loginInfo === undefined) {
                window.pageData.loginInfo = {};
                window.pageData.loginInfo.username = window.pageData.userData.schoolNumber;
            };
            if (!reslogin.find(x => x.username === window.pageData.loginInfo.username)) {
                reslogin.push({
                    displayName: window.pageData.userData.userName,
                    username: window.pageData.loginInfo.username,
                    password: window.pageData.loginInfo.password
                });
            }
        }
        localStorage.setItem("reslogin", JSON.stringify(reslogin));

        pageElement.innerHTML = `
            <div class="choseBox">
                <h1 class="pageTitle">功能選擇</h1>
                <div class="function">
                    <button type="button" onclick="goPage('/profile');">查詢個人資料</button>
                    <button type="button" onclick="goPage('/availableScore');">查詢成績資料</button>
                    <button type="button" onclick="goPage('rewandpun');">查詢獎懲紀錄</button>
                    <button type="button" onclick="goPage('/lack');">查詢缺曠紀錄</button>
                    <button type="button" onclick="goPage('/compare');">比較歷史成績</button>
                    <button type="button" style="background-color: red;" onclick="sessionStorage.removeItem('auth');goPage('/');">登出</button>
                </div>
            </div>
        `;
    }
}