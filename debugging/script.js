console.log('start');

const elmExec = document.getElementById('exec');

console.log(elmExec)
console.dir(elmExec)

elmExec.onclick = () => {
    console.log('Exec-Onclick')
    let a = 1
    let b = 2
    let c = a+b
    console.log("C", c)
}

console.log('end')