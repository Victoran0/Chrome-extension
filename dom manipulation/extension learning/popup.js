const messgae = document.createElement('div');
const header = document.querySelector('.header');
const inputBox = document.getElementById('tbox')
messgae.classList.add('myClass')
messgae.innerHTML = 'we use cookies for improved functionality <button class="btn">Got it!</button>'


header.after(messgae)
// header.prepend(messgae.cloneNode(true))

const button = document.querySelector('.btn');

button.addEventListener('click', () => {
    // messgae.remove()
    messgae.parentElement.removeChild(messgae)
})

messgae.style.backgroundColor = 'pink'
messgae.style.width = '60%'

inputBox.focus()