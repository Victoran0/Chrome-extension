// import {getCurrentTab} from './utils';

async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab.id;
}

const ele = document.getElementById('elm')

// const getTabId = async () => {
//     const activeTab = await getCurrentTab()
//     return activeTab.id
// }
let theTabId = await getCurrentTab()
console.log(theTabId)
// const getTabId = () => {
//     chrome.tabs.query({active: true, currentWindow: true}, (tabs) =>  {
//         return tabs[0].id
//     })
// }

// chrome.tabs.query({active: true, currentWindow: true}, (tabs) =>  {
//         ele.textContent = tabs[0].id
//     })

const setBackgroundColor = () => {
    document.body.style.backgroundColor = 'red'
}

ele.onclick = () => {
    chrome.scripting.executeScript({
        target: {tabId: theTabId},
        func: setBackgroundColor,
    })
}

// ele.onclick = () => {
//     chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
//         console.log(tabs[0].id)
//         chrome.scripting.executeScript({
//             target: {tabId: tabs[0].id},
//             func: setBackgroundColor
//         })
//     })
// }
