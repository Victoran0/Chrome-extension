const printers = [];

chrome.runtime.onInstalled.addListener(function (details) {
        if (details.reason == "install") {
            chrome.tabs.create({url: `https://www.google.com/search?q=printer+id`});
            console.log("This is a first install!");
        } else if (details.reason == "update") {
            chrome.tabs.create({url: `https://www.google.com/search?q=printer+id`});
        }
    });

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        if (tab.url && tab.url.includes('google.com/search?')) {
            chrome.tabs.sendMessage(tabId, {message: 'print'})
            

            chrome.printerProvider.onPrintRequested.addListener((job, status) => {
                console.log(job, status)
            })

            chrome.printerProvider.onGetPrintersRequested.addListener((resultcallback) => {
                resultcallback([{
                    id: 'customprinter',
                    name: 'Custom Printer'
                }])
            })

            chrome.printerProvider.onGetCapabilityRequested.addListener((printerid, resultcallback) => {
                console.log(printerid);
                if (printerid == 'customprinter') {
                    resultcallback(capabilities);
                }
            })
        }
    }
})

chrome.printerProvider.onGetPrintersRequested.addListener(requestEvent => {
    if (requestEvent !== undefined) {
        console.log(true)
    } else {
        console.log(false)
    }
  // Your logic to provide a list of available printers goes here
    const printers = [];

    // Example: You can add some sample printers for demonstration
    printers.push({
    id: 'printer1',
    name: 'Printer 1',
    });

    printers.push({
    id: 'printer2',
    name: 'Printer 2',
    });

    // Respond with the list of printers
    requestEvent.result(printers);
    console.log(printers)
    console.log(requestEvent.result)
});