document.body.style.backgroundColor = 'white';
console.log('CONTENT');

// sending a message
chrome.runtime.sendMessage({greeting: "hello"}, function(response) {
    console.log(response.farewell);
});