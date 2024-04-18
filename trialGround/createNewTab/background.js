// let allTabs = document.getElementById("tabs")

// chrome.tabs.onUpdated.addListener((changeInfo, tab) => {
//     if (tab.url && tab.url.includes("google.com")) {
//         allTabs.innerHTML = `<p>${tab.url}</p>`
//         console.log(tab.url)
//     }
// })

// const msg = document.getElementById("msg")

let allTabs = []
msg.innerHTML = allTabs.map((tab, id) => `<h1 ${key=id}>${tab}</h1>`)

chrome.runtime.onMessage.addListener((request, sender, response) => {
    if (request.greeting === "hello") {
        console.log(sender.tab.url)
        allTabs.push(sender.tab.url)
        localStorage.setItem('allTabs', JSON.stringify(sender.tab.url) )
    }
    response({farewell: "saved"})
})
