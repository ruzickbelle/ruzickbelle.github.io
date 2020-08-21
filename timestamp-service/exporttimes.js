"use strict";

// Events
var html_delimiter;
var html_hint;
var html_output;

function onLoad() {
   html_delimiter = document.getElementById("delimiter");
   html_hint = document.getElementById("hint");
   html_output = document.getElementById("output");
}
addEventListener('load', onLoad);

function exportCSV() {
   var delimiter = html_delimiter.value;
   var text = localStorage.getItem("timestamp-service.timeStorage");
   if (text === null)
      text = "[]";
   var data = JSON.parse(text);
   text = "";
   for (var elem of data)
      text += elem[0] + delimiter + elem[1] + "\n";
   html_output.innerHTML = text;
   html_output.select();
   html_output.setSelectionRange(0, 999999);
   document.execCommand("copy");
   html_hint.style.display = "block";
}

