console.log('google search page')

chrome.runtime.onMessage.addListener((obj, sender, request) => {
    if (obj.message === 'print') {
        // console.log(obj)
        window.print()
    }
})