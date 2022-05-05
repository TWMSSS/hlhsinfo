function execute() {
    var pageElement = document.querySelector("#mainContent");

    if (sessionStorage.getItem("auth") === null) {
        pageElement.innerHTML = `
            <div class="container">
                <div class="row">
                    <div class="col-12">
                        <h1>未登入</h1>
                    </div>
                </div>
            </div>
        `;
        return;
    }
}