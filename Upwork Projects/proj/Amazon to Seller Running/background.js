let isOn = false
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    isOn = request.message
    if (isOn) {
        if (request.url === 'preconfirmed') {
            chrome.tabs.create({url: 'https://sellerrunning.threecolts.com/orders?Status=PreConfirmed'})
        }
        if (request.url === 'confirmed') {
            chrome.tabs.create({url: 'https://sellerrunning.threecolts.com/orders?Status=Confirmed'})
        }
    } else {
        chrome.storage.local.clear()
    }
})


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (isOn) {
        if (changeInfo.status === 'complete') {
            if (tab.url && tab.url.includes('Status=PreConfirmed') || tab.url.includes('Status=Confirmed')) {
                chrome.tabs.sendMessage(tabId, {
                    message: 'orders page'
                })
            }
            
            if (tab.url && tab.url.includes('sellerrunning.threecolts.com/orders') && tab.url.includes('-')) {
                chrome.tabs.sendMessage(tabId, {
                    message: 'order page'
                })
            }
            
            if (tab.url && tab.url.includes('www.amazon.com/gp/your-account/order-details')) {
                chrome.tabs.sendMessage(tabId, {
                    message: 'click track package'
                })
            }
            
            if (tab.url && tab.url.includes('progress-tracker/package')) {
                chrome.tabs.sendMessage(tabId, {
                    message: 'tracking page',
                    url: tab.url
                })
            }
        }
    }
})