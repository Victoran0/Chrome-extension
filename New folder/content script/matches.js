const button = document.createElement("input");
button.type = "button";
button.value = "Change background to red";

const child = document.body.firstChild;
document.body.insertBefore(button, child);

button.addEventListener("click", () => {
  console.log("button_click");
  document.body.style.backgroundColor = "red";
});

console.log(button);
console.dir(button);