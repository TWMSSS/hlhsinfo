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

        var inputs = document.getElementsByTagName("input");
        Array.from(inputs).forEach(e => {
            e.addEventListener("focusin", ev => {
                e.parentElement.classList.add("active");
            });

            e.addEventListener("focusout", ev => {
                if (e.value === "") {
                    e.parentElement.classList.remove("active");
                }
            });
        });

        var loginForm = document.getElementById("lognForm");
        loginForm.addEventListener("submit", ev => {
            ev.preventDefault();
        });
        return;
    } else {
        goPage("/");
    }
}