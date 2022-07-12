window.execute = async () => {
    var pageElement = document.querySelector("#mainContent");

    pageElement.innerHTML = `
        <style>
            .stm p {
                margin: 15px 0;
            }
        </style>
        <div class="stm">
            <h1 class="pageTitle">開發者自述</h1>
            <div class="stm">
                <h1 style="font-size: 30px;">Hi 我是開發者 <span data-extra="Twitter">@kamiyurisaka</span></h1>
                <p>這個頁面我將會敘述我為甚麼要做這個程式，還有解釋一些可能會被誤會是入侵伺服器的動作</p>
                <p>在一開始，我要先感謝我所有協助者，謝謝幫忙測試「花中查詢」(以下簡稱 查詢器)並提供了許多的意見，促使我把查詢器做得更好!</p>
                <br/>
                <p>為甚麼我要做這個程式哩? 其實原因很簡單: 學校的查詢系統，說真的太難用了；怎麼個難用法，用過都知道:</p>
                <ol>
                    <li>整體設計就是單純只適用於電腦，並未對手機使用者進行優化。</li>
                    <li>功能有太多是學生根本用不到的功能。</li>
                    <li>沒有深色介面，我這種只用深色模式的人感到眼睛刺痛。</li>
                </ol>
                <p>要說的話，其實上述的幾點都還算可以接受，不過最我想要做一個這個類Proxy伺服器(其實就是爬蟲)是因為它有一個嚴重的缺點:</p>
                <ul>
                    <li>在特定的網路下，無法開啟</li>
                </ul>
                <p>這個問題對我而言非常的大，當成績出來時沒辦法立刻查詢到成績，有時候這個問題很嚴重，甚至會直接影響我的真實成績；有時在輸入資料時會有錯誤，不及時發現的話，問題會很嚴重。</p>
                <p>在出於這個原因之下，我們就開始做了查詢器。</p>
            </div>
            <h1 class="pageTitle">怎麼做的</h1>
            <div>
                <p>你可以在查詢器查到你的個人資料、缺曠、課表、獎懲甚至是成績，這些如果你覺得是一般學生查詢不到的，那就代表你其實並沒有認真看過學校「成績查詢」網站的內容，這些東西都可以在上面找到。</p>
                <p>那我們是怎麼將資料放上查詢器的呢? 其實很簡單，有一種程式它是叫做「爬蟲」，這種東西看似只會在搜尋引擎上出現，但其實爬蟲比你想像的還要常見。</p>
                <p>為甚麼這麼說呢? 查詢器就是一種學校成績查詢網站的爬蟲，只是這隻爬蟲它是專門爬成績查詢網站資料的爬蟲，它有著幾項功能</p>
                <ol>
                    <li>登入學校成績查詢系統</li>
                    <li>分析成績查詢系統的網頁資料</li>
                    <li>將分析結果放至你的眼前</li>
                </ol>
                <p>跟其他的爬蟲並沒有不同，頂多就是爬的網站不同，所需的功能不同。詳細資料你可以至 <a href="https://github.com/DevSomeone/hlhsinfo/blob/master/HowToAnalysis.md">https://github.com/DevSomeone/hlhsinfo/blob/master/HowToAnalysis.md</a> 查看。</p>
            </div>
            <h1 class="pageTitle">開源是真的嗎?</h1>
            <div>
                <p>母庸置疑，查詢器確實是開源的。</p>
                <p>你可以在<a href="https://github.com/DevSomeone/hlhsinfo">https://github.com/DevSomeone/hlhsinfo</a>看到開源的程式碼，你也可以協助開發，或建立你自己的查詢器。</p>
            </div>
            <h1 class="pageTitle">我的資料會被蒐集嗎?</h1>
            <div>
                <p>我向你保證，絕對不會在未經通知下蒐集私人成績!</p>
                <p>當然，如果你分享了成績，我們會在伺服器暫存你的成績約 30 分鐘(開放原始碼預設，實際情況依照各個伺服器的分享過期時間而定)，分享時效過期之後，你的成績將會被立即刪除。</p>
            </div>
            <h1 class="pageTitle">程式需要收費嗎?</h1>
            <div>
                <p>所有功能均免費! 查詢器並不會使用任何理由向你收費，如果有此情形為詐騙，請勿上當!</p>
                <p>「支持開發者」之功能為單純支持開發者，並不會解鎖任何功能，也無「必須」之行為。</p>
            </div>
        </div>
    `;
}