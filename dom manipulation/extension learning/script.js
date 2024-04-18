// const styleScope = document.querySelector('.style-scope')
// console.log(styleScope)

// const allElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, th, td, span');

// for (let i=0; i<allElements.length; i++) {
//     allElements[i].innerHTML = 'You have been HACKED!'
// }



// chat.openai.com 
const ev = new KeyboardEvent('keydown', {altKey:false,
    bubbles: true,
    cancelBubble: false, 
    cancelable: true,
    charCode: 0,
    code: "Enter",
    composed: true,
    ctrlKey: false,
    currentTarget: null,
    defaultPrevented: true,
    detail: 0,
    eventPhase: 0,
    isComposing: false,
    isTrusted: true,
    key: "Enter",
    keyCode: 13,
    location: 0,
    metaKey: false,
    repeat: false,
    returnValue: false,
    shiftKey: false,
    type: "keydown",
    which: 13});

const autoPrompt = () => {
    const container = document.getElementsByClassName("flex flex-col w-full py-2 flex-grow md:py-3 md:pl-4 relative border border-black/10 bg-white dark:border-gray-900/50 dark:text-white dark:bg-gray-700 rounded-md shadow-[0_0_10px_rgba(0,0,0,0.10)] dark:shadow-[0_0_15px_rgba(0,0,0,0.10)]")[0]

    const textarea = container.getElementsByTagName('textarea')[0]

    const btn = container.getElementsByTagName('button')[0]

    textarea.textContent = 'what is human anger and how can it be understood'
    textarea.dispatchEvent(ev)
}

setTimeout(() => {autoPrompt()}, 100)
// console.log('content scirpt loaded')