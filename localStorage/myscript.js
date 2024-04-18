const eleNote = document.getElementById("note")
const eleSave = document.getElementById("save")

let note = localStorage["note"];
if (note == null) {
    note = "";
}
eleNote.value = note;

eleSave.onclick = () => {
    localStorage["note"] = eleNote.value;
};