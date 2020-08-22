"use strict";

// Events
var html_table;

function onLoad() {
   html_table = document.getElementById("table");
   showTimes();
}
addEventListener('load', onLoad);

function showTimes() {
   var data = getData();
   clearTable();
   addToTable(data);
}

// Functions
function getData() {
   var text = localStorage.getItem("timestamp-service.timeStorage");
   if (text === null)
      text = "[]";
   return JSON.parse(text);
}

function clearTable() {
   while (1 < html_table.children.length)
      html_table.removeChild(html_table.children[1]);
}

function addToTable(data) {
   for (var row of data) {
      var tr = document.createElement("tr");
      var td1 = document.createElement("td");
      td1.innerText = row[0];
      var td2 = document.createElement("td");
      td2.innerText = row[1];
      tr.appendChild(td1);
      tr.appendChild(td2);
      html_table.appendChild(tr);
   }
}

