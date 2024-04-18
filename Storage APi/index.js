chrome.storage.local.set({word: 'ordinance'}).then(() => {
    console.log("value is set to " + 'ordinance');
});

chrome.storage.local.get(["word"]).then((result) => {
    console.log("value currently is " + result.word);
});

chrome.storage.local.set({word: 'ordinarka'}).then(() => {
    console.log('value is changed to ' + 'ordinarka')
})

const content = document.getElementById("content");
chrome.storage.local.get(["word"]).then((result) => {
    console.log("value currently is " + result.word);
    content.innerHTML = result.word
});

