# hlhsinfo
這是一個可以取得學校公開資料的一個類Proxy伺服器，並包含了許多官方沒有的新功能。

立刻於Google Play下載(詳細圖片 可以至Google Play查看)  
[<img src="https://play.google.com/intl/en_us/badges/static/images/badges/zh-tw_badge_print_generic.png" width="25%">](https://play.google.com/store/apps/details?id=ml.hlhsinfo.twa)

___IOS等其他系統 可以至[hlhsinfo.ml](https://hlhsinfo.ml)安裝PWA應用___

## 特色

 * 可以取得學校公開資料(理論上可以在所有「欣河資訊」所製作的成績查詢網站上使用)
 * 比較歷史成績
 * 深色模式
 * 登入紀錄，讓你可以快速登入
 * 伺服器格式化JSON資料
 * 簡單明瞭的介面

## 安裝
這個程式是基於NodeJS所寫出來的

 1. 使用NPM安裝依賴 `npm install`
 2. 執行 `npm start` 啟動伺服器
 3. 依照介面操作

## 環境
您可以在`.env`中設定

參數                | 說明              | 預設
------------------- | ---------------- | -------
`PORT`              | 伺服器端口        | `1156`
`SHARE_EXPIRED`     | 分享有效期(毫秒)   | `1800000`
`FAILED_EXPIRED`    | 登入失敗封鎖(毫秒) | `3600000`
`FAILED_TIMES_LOCK` | 登入失敗封鎖(次數) | `5`

## 聲明
此程式為類瀏覽器的操作，使用HTTP Request和DOM分析來取得學生的公開資料，且此程式並不會在使用者使用的時候，不經使用者認可，而去儲存使用者的資料，也不會儲存資料。
如果你對此有疑問，此程式為公開原始碼的程式，您可以去確認程式是否有不當使用的地方。

我如何分析的: [HowToAnalysis.md](/HowToAnalysis.md)

## 其他
您可以到[https://hlhsinfo.ml](https://hlhsinfo.ml)來使用此程式的相關資訊。