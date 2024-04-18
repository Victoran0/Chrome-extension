document.addEventListener("DOMContentLoaded", function() {

    document.getElementById("button1").addEventListener("click", function() {
        alert("The button has been clicked on")
        let body = document.getElementsByTagName("body")[0].style.backgroundColor = "aqua";
    });
});