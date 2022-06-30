window.execute = async () => {
    var pageElement = document.querySelector("#mainContent");

    window.pageData.function.makePurchase = async (id) => {
        const paymentMethodData = [{
            supportedMethods: 'https://play.google.com/billing',
            data: {
                sku: id,
            },
        }];
        const request = new PaymentRequest(paymentMethodData);

        console.log(request);
        const paymentResponse = await request.show();

        const {
            purchaseToken
        } = paymentResponse.details;

        var verify = verifyPurchase(id, purchaseToken);
        verify.then(async res => {
            if (res.isSuccessful) {
                window.goodsService.consume(purchaseToken);
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

    var inAppPurchase = "";

    if ("products" in window || localStorage.getItem("billingTesting")) {
        inAppPurchase = `<div class="resLogin"><h1 class="pageTitle">贊助開發者!</h1><div class="dataContent">`;
        for (var data of window.products) {
            var localePrice = new Intl.NumberFormat(navigator.language, {
                style: 'currency',
                currency: data.price.currency,
            }).format(data.price.value);
            inAppPurchase += `<a class="dataBox" onclick="window.pageData.function.makePurchase('${data.itemId}')"><span class="dataTitle">${data.title}</span><span class="dataValue">${localePrice}</span></a>`;
        }
        inAppPurchase += `</div></div>`;
    } else {
        inAppPurchase = `
        <div class="404">
            <h1 class="pageTitle">抱歉</h1>
            <div>
                <div>
                    <h2>抱歉，目前支持系統僅支持 Google Play 付款</h2>
                    <p>如果可行，您可以切換至Android裝置來提供對於開發者的支持!</p>
                    <p><a href="/">回到首頁</a></p>
                </div>
            </div>
        </div>
        `;
    }

    pageElement.innerHTML = inAppPurchase;
}