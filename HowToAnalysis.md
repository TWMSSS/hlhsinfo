# 這是什麼
這是一個用來說明我如何進行學校資料的分析。

# 如何分析
## 事前準備
首先，我要先聲明幾件事情:

 1. 所有使用者皆可瀏覽網頁的背後原始碼
 2. DevTools 是個合法工具，任何人都可以使用，只要按下`F12`或`Ctrl+Shift+I`即可開啟
 3. DOM 分析並無違法
 4. HTTP Request 是所有瀏覽器都會發送的請求

再來，因為是DOM的分析，因此會需要有DOM跟HTML本體(也就是網站本體)，因此我對於學校的成績查詢網站進行了分析，分析結果如下:

網站首頁: `http://shinher.hlhs.hlc.edu.tw/online/`，下面的列表皆以首頁為基準

頁面        | 路徑
----------- | --------
登入         | `login.asp`
成績查詢     | `selection_student/student_subjects_number.asp?action=(動作)&thisyear=(學年)&thisterm=(學期)&number=(成績ID)&exam_name=(考試名稱)`
可用成績     | `selection_student/student_subjects_number.asp?action=open_window_frame`
個人資料     | `selection_student/fundamental.asp`
個人頭像     | `utility/file1.asp?q=x&id=(圖片ID)`
上方資料     | `student/selection_look_over_data.asp?look_over=right_top&school_class=&division=`
學生選擇     | `student/selection_look_over_data.asp?look_over=right_below&school_class=`
獎懲紀錄     | `selection_student/moralculture_%20bonuspenalty.asp`
缺況紀錄     | `selection_student/absentation_skip_school.asp`
所有成績     | `selection_student/grade_chart_all.asp`
所有課表     | `student/select_preceptor.asp?action=open_sel`
課表資料     | `student/school_class_tabletime.asp?teacher_classnumber=(班級)&teacher_name=(導師)`

以上的資料皆可從網頁中取得，也是學生能自主查詢的資料/頁面。

## 開始DOM分析
要取得網頁中的資料，首先要先知道一個東西，那就是DOM(Document Object Module)，這是一個能讓網頁的指令碼操縱HTML的一個最主要的東西。

### 分析登入頁面
如果要進行資料的查詢，最首先要做的事是「登入」，在不登入的情況下，是無法取得資料的。
因此要先解決登入的問題

 1. 首先進入到查詢首頁，這時網頁上只會出現登入頁面。  開啟DevTools然後轉到`網路`頁面(開紀錄保留)，先做一次登入，這時你會在DevTools看到一個Request是POST到`login.asp`的，這時我們就找到了登入的路徑。  
 ![](https://cdn.discordapp.com/attachments/981701525707554847/981703577259102248/unknown.png)

 2. 再來，看裡面的內容  
 ![](https://cdn.discordapp.com/attachments/981701525707554847/981703747086483466/unknown.png)  
 第一個: 他是進行HTTP Request裡的POST動作  
 ![](https://cdn.discordapp.com/attachments/981701525707554847/981704011017224212/unknown.png)  
 第二個: 他的傳送資料為上，分析結果:

 資料                          | 值
------------------------------ | --------
`__RequestVerificationToken`   | `aUyBwKzfQmgUMR21`
`division`                     | `senior`
`Loginid`                      | `123`
`LoginPwd`                     | `123`
`Uid`                          | 空值
`vcode`                        | `2724`

由這裡可以看出，他有一個`__RequestVerificationToken`，這個值是用來驗證登入的，因此需要找尋這個值，並且把它填入到登入的表單中。

再來，分析登入頁面的原始資料(`Ctrl+U`)，可議看到以下畫面:  
![](https://cdn.discordapp.com/attachments/981701525707554847/981705423776280586/unknown.png)  
在84行就有一個input的name參數為`__RequestVerificationToken`而他的value就為當次的驗證碼。

並且他也有另一個驗證碼，用於驗證非機器登入的。在110~111行間就有img為驗證碼，因此只需要取得他的圖片，即可進行人類驗證。

 3. 那 他是如何驗證我已經登入的呢? 其實很簡單，他是用`cookies`來進行驗證的，由DevTools可以看到  
 ![](https://cdn.discordapp.com/attachments/981701525707554847/981706703588425738/unknown.png) 
 他的Cookies的資料是這樣的: `ASPSESSION(亂碼)=(亂碼)`，因此在日後的HTTP Request時，都需要將其加入到Header中。

 4. 再來，我們要進行登入的動作，已經知道了他的登入路徑，那就是`login.asp`，我們就可以進行登入的動作了。在登入完成後，系統會發送302重新導向至`student/frames.asp`(Header裡的`Location`)，因此只需要注意HTTP Status Code就可以知道登入是否成功。  
 ![](https://cdn.discordapp.com/attachments/981701525707554847/981707689979678750/unknown.png)

### 分析眾多的資料
就以課表為例，我將敘述我如何分析他的資料的

#### 資料分析
![](https://cdn.discordapp.com/attachments/981701525707554847/981709111093764156/unknown.png)

上圖為課表的範例，我們可以看到，課表的每一個欄位都有自己的資料，我們可以透過每一個欄位的資料來分析課表的內容。

由DevsTools可以看到，他是由一橫列為單位的  
![](https://cdn.discordapp.com/attachments/981701525707554847/981710489602101278/unknown.png)

然後每一格都是一個獨立的單位  
![](https://cdn.discordapp.com/attachments/981701525707554847/981710627254980628/unknown.png)

由這些獨立的單位我們可以分析出每一個欄位的資料，這些資料我們可以分析出，每一個欄位的資料是什麼。因此我們可為此製作一個讀取器，將每一個欄位的資料讀取出來。

具體為下:
```js
var l = Array.from(document.querySelector("table.TimeTable.top.left.spacing2.padding2").querySelectorAll("tr"));
l.shift();
l = l.map(e => {
    var arr = Array.from(e.querySelectorAll("td"));
    if (arr.length > 8) {     // 如果有超過8個欄位，代表第一欄為上/下午欄
        arr.shift();
    }
    if (arr.length <= 1) {    // 如果只有一個欄位，代表為空白
        arr = null;
    }
    if (!arr) return null;
    var section = arr.shift().innerText;  // 第一欄為節數
    var timeArr = arr.shift().innerHTML.split("<br>").map(e => e.replace(/ /gm, ""));  // 第二欄為時間
    
    arr = arr.map(e => {  // 第三欄開始為課程資料
        if (!e.classList.contains("sectionItem")) return null; // 如果沒有sectionItem class，代表為空白
        
        console.log(e.innerHTML)  // 課程資料
    });
});
```

![](https://cdn.discordapp.com/attachments/981701525707554847/981712181613719622/unknown.png)

以上為執行結果(我預設是全部課程資料都為Example)，到此為課表的分析。

如果退於其他資料的分析有疑問的，你可以自行查詢原始代碼。