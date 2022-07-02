window.execute = async () => {
    var pageElement = document.querySelector("#mainContent");

    window.pageData.function.makePurchase = async (id, isSub = false) => {
        const paymentMethodData = [{
            supportedMethods: 'https://play.google.com/billing',
            data: {
                sku: id,
            },
        }];
        const request = new PaymentRequest(paymentMethodData);

        const paymentResponse = await request.show();

        const {
            purchaseToken
        } = paymentResponse.details;

        function vf() {
            var verify = window.verifyPurchase(id, purchaseToken, isSub);
            verify.then(async res => {
                if (res === undefined) return vf();
                if (res.isSuccessful) {
                    if (!isSub) await window.goodsService.consume(purchaseToken);
                    await paymentResponse.complete('success');
                    alertBox("感謝您的贊助! 我已經收到您的InAppPurchase購買了! (讓我多活幾天八!)", "success");
                    return;
                }
                await paymentResponse.complete('fail');
                alertBox("購買失敗! 請稍後再試!", "warning");
            }).catch(async err => {
                await paymentResponse.complete('fail');
                alertBox("購買失敗! 請稍後再試!", "warning");
                console.log(err);
            });
        }
        vf();
    }

    var inAppPurchase = "";

    if ("products" in window || localStorage.getItem("billingTesting")) {
        inAppPurchase = `<div class="resLogin"><h1 class="pageTitle">贊助開發者!</h1><div class="dataContent">`;
        for (var data of window.products) {
            var localePrice = new Intl.NumberFormat("en-US", {
                style: 'currency',
                currency: data.price.currency,
                compactDisplay: 'long'
            }).format(data.price.value);
            var extra = "";
            if (data.subscriptionPeriod === "P1M") extra = `<span class="dataExtra">每月付款</span>`;
            if (data.subscriptionPeriod === "P1Y") extra = `<span class="dataExtra">每年付款</span>`;
            inAppPurchase += `<a class="dataBox" onclick="window.pageData.function.makePurchase('${data.itemId}'${data.subscriptionPeriod ? ", true" : ""})"><span class="dataTitle">${data.title}</span><span class="dataValue">${localePrice}</span>${extra}</a>`;
        }
        inAppPurchase += `</div></div>`;
    } else {
        inAppPurchase = `
        <div class="404">
            <h1 class="pageTitle">抱歉</h1>
            <div>
                <div>
                    <h2>抱歉，目前支持系統僅支持 Google Play 付款</h2>
                    <p>如果可行，您可以切換至Android裝置，並於 Google Play 安裝「<a href="https://play.google.com/store/apps/details?id=ml.hlhsinfo.twa">花中查詢</a>」，來提供對於開發者的支持!</p>
                    <p><a href="/">回到首頁</a></p>
                </div>
            </div>
        </div>
        `;
    }

    pageElement.innerHTML = inAppPurchase;
}