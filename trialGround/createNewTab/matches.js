// const text = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, td, tr, caption, table, span, a, div')
// console.log(text)

// for (let i=0; i<text.length; i++) {
//     if (text[i].innerHTML.includes('Naira')) {
//         text[i].innerHTML = text[i].innerHTML.replace(/Naira/gi, 'Dollar')
//     }
//     if (text[i].innerHTML.includes('#')) {
//         text[i].innerHTML = text[i].innerHTML.replace(/#/g, '$')
//     }
// }
const button = document.createElement('input')
button.type = 'button'
button.value = "save nairaland page"

const child = document.body.firstChild
document.body.insertBefore(button, child);


button.addEventListener('click', () => {
    console.log("button clicked")
    chrome.runtime.sendMessage({greeting: "hello"}, (response) => {
        console.log(response.farewell)
    })
})