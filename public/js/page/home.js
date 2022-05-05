function execute() {
    var pageElement = document.querySelector("#mainContent");

    if (sessionStorage.getItem("auth") === null) {
        var reslogin = "";
        if (localStorage.getItem("resLogin") === null) {
            reslogin = `
                <div style="text-align: center;">
                    您還尚未登入過，請先登入。
                </div>
            `;
        } else {
            var dt = JSON.parse(localStorage.getItem("resLogin"));
            dt.forEach(e => {
                
            });
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
                        <button type="submit" class="btn btn-primary">登入</button>
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
                    fetch("/api/getLoginCaptcha", {
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
                        resolve(captcha.value);
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
        });
        return;
    } else {
        goPage("/");
    }
}