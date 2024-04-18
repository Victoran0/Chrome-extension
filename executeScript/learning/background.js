// // chrome.action.onClicked.addListener((tab) => {
// //     console.log(tab.url)
    
// // })

// // Called when the user clicks on the action.
// chrome.action.onClicked.addListener(function(tab) {
//   // No tabs or host permissions needed!
//   console.log('Turning ' + tab.url + ' red!');
//   chrome.scripting.executeScript({
//     code: 'document.body.style.backgroundColor="red"'
//   });
// });

function reddenPage() {
  document.body.style.backgroundColor = 'red';
}

// chrome.tabs.onUpdated.addListener((tabId, info) => {
// if (info.status === 'complete') {

    // // chrome.action.onClicked.addListener((tab) => {
    //     chrome.scripting.executeScript({
    //         target: { tabId: getCurrentTab() },
    //         function: reddenPage
    //     });
        // });
//     }
// })