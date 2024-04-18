// let html = `
// <blockquote class="twitter-tweet"> <p lang="en" dir="ltr">NOW: <a href="https://twitter.com/ABC?ref_src=twsrc%5Etfw">@ABC</a> News Special Report - Pres. Biden addresses the nation after the mass shooting at a Texas elementary school. <a href="https://twitter.com/DavidMuir?ref_src=twsrc%5Etfw">@DavidMuir</a><br>anchors<br><br>Texas Dept of Public Safety tells <a href="https://twitter.com/ABCMireya?ref_src=twsrc%5Etfw">@ABCMireya</a> that the death toll from the Uvalde school shooting now stands at 18 children &amp; 2 adults killed</p>&mdash; Joshua Hoyos (@JoshuaHoyos) <a href="https://twitter.com/JoshuaHoyos/status/1529261372961394689?ref_src=twsrc%5Etfw">May 25, 2022</a></blockquote>
// <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>`
// html = html.match(/<p.*?>(.*?)<\/p>/)[1]
// html = html.replace(/<br>/g, ".")
// console.log(html.includes('<br>'))

// first we check if it contains line break and replace it with space

// const obj = {'a': 'wise', 1: 2563, 'jake': 'millie'}
// console.log(!'jake' in obj)
// const j = null

// const noDate = 'Thanks for sharing your mashup of Red with us, Ana! <a href="https://twitter.com/taylorswift13?ref_src=twsrc%5Etfw">@taylorswift13</a> &amp; <a href="https://twitter.com/TaylorNation?ref_src=twsrc%5Etfw">@TaylorNation</a> – if you’re seeing this, watch the rest on TikTok and give her a follow! <a href="https://twitter.com/hashtag/REDTaylorsVersion?src=hash&amp;ref_src=twsrc%5Etfw">#REDTaylorsVersion</a><a href="https://t.co/PE6IdusAip">https://t.co/PE6IdusAip</a> <a href="https://t.co/tGV4eg0fiw">pic.twitter.com/tGV4eg0fiw</a>'
// const text = '(<a href="https://twitter.com/AP?ref_src=twsrc%5Etfw">@AP</a>) -- White House: Trump is `evaluating the situation&#39; regarding national security adviser Michael Flynn.'
// let arr = text.split('<a href')
// console.log(arr[1].match(/="https:.*?>(.*?)<\/a>/))
// let arrResult = []
// for (let i = 0; i < arr.length; i++) {
//     if (arr[i].includes('="https')) {
//         arrResult.push(arr[i].match(/="https:.*?>(.*?)<\/a>/)[1])
//     } else {
//         arrResult.push(arr[i])
//     }
// }

// let text2 = html.replace(/<a.*?>/g, "")
// text2 = text2.replace(/<\/a>/g, "")
// console.log(text2)
// USE GLOBAL REPLACING
// console.log(arrResult.join(' '))

// if it contains any link tag, then we 

// console.log(noDate.match(/<a.*?>(.*?)<\/a>/g))


// let jack = null
// if (jack) console.log('a,m null')

// let xhttp = new XMLHttpRequest();
// xhttp.onreadystatechange = function() {
//   if (this.readyState == 4 && this.status == 200) {
//     console.log(this.response);
//     console.log(this.response.body);  }
// };
// xhttp.open("GET", "https://people.com/pat-sajak-reacts-ryan-seacrest-named-new-wheel-of-fortune-host-7554568", true);
// xhttp.send();
// let xhttp = new XMLHttpRequest();
// xhttp.onreadystatechange = function() {
//   if (this.readyState == 4 && this.status == 200) {
//     console.log(this.responseText);
//   }
// };
// xhttp.open("GET", "https://www.google.com", true);
// xhttp.send();
// let loadTimerOut;
// loadTimerOut = setTimeout(() => console.log('hiiii'), 500)
// clearTimeout(loadTimerOut)



// const callToolTip = (bool, func) => {
//     return new Promise((resolve) => {
        // const loadToolTip = setTimeout(() => resolve(func()), 1500)
//         let loadToolTip;
//         if (bool) {
//             console.log('tool tip called')
//             loadToolTip = setTimeout(() => resolve(func()), 1500)
//         } else {
//             clearTimeout(loadToolTip)
//         }
//     })
// }

// callToolTip(true, () => console.log('my boy'))
// callToolTip(false, () => console.log('my boy'))

if (2 === 3 || 3 !== 5) {
        console.log('wrong arithmetic')
}