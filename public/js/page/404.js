window.execute = async () => {
    var pageElement = document.querySelector("#mainContent");

    pageElement.innerHTML = `
        <div class="404">
            <h1 class="pageTitle">404找不到</h1>
            <div class="404Page">
                <div class="404PageContent">
                    <h2>抱歉，我們找不到您要前往的頁面</h2>
                    <p>請檢查您的網址是否正確，或者聯絡管理員</p>
                    <p><a href="/">回到首頁</a></p>
                </div>
            </div>
        </div>
    `;
}