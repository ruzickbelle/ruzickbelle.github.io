"use strict";

// Events
var html_descr;
var html_storage;
var smartFillValue;

function onLoad() {
   html_descr = document.getElementById("descr");
   smartFillValue = null;
   html_storage = document.getElementById("storage");
   html_storage.onclick = storageSelect;
   storageLoad();
}
addEventListener('load', onLoad);

function addTime() {
   var text = localStorage.getItem("timestamp-service.timeStorage");
   if (text === null)
      text = "[]";
   var data = JSON.parse(text);
   var timeStr = getTimeString();
   var descr = html_descr.value.trim();
   var elem = [timeStr, descr];
   data.unshift(elem);
   text = JSON.stringify(data);
   localStorage.setItem("timestamp-service.timeStorage", text);
   html_descr.value = "";
   smartFillEdit();
}

function quickEditClear() {
   html_descr.value = "";
}

function quickEditReset() {
   html_descr.value = "";
   smartFillValue = null;
}

function smartFillEdit() {
   if (smartFillValue === null)
      return;
   html_descr.value = smartFillValue;
   smartFillValue = null;
}

function smartFill(text) {
   if (smartFillValue === null)
      smartFillValue = html_descr.value.trim();
   html_descr.value = text + " " + smartFillValue;
}

function storageLoad() {
   var text = localStorage.getItem("timestamp-service.addtimes.smartStorage");
   if (text === null)
      return;
   var list = JSON.parse(text);
   for (text of list)
      storageTableRowAppend(text);
}

function storageSave() {
   var list = [];
   for (var elem of html_storage.querySelectorAll("tr > td"))
      list.push(elem.innerText);
   var text = JSON.stringify(list);
   localStorage.setItem("timestamp-service.addtimes.smartStorage", text);
}

function storageSelect(event) {
   if (event.target.tagName !== "TD")
      return;
   for (var cell of html_storage.querySelectorAll("tr > td.selected"))
      cell.classList.remove("selected");
   event.target.classList.add("selected");
}

function storageTableRowAppend(text) {
   var tr = document.createElement("tr");
   var td = document.createElement("td");
   td.innerText = text;
   tr.appendChild(td);
   html_storage.appendChild(tr);
}

function storageSetDescr() {
   var selected = html_storage.querySelector("tr > td.selected");
   if (selected === null)
      return;
   var text = selected.innerText;
   html_descr.value = text;
   smartFillValue = text;
}

function storageAppend() {
   var text = smartFillValue;
   if (text === null)
      text = html_descr.value.trim();
   if (text === "")
      return;
   storageTableRowAppend(text);
   storageSave();
}

function storageReplace() {
   var selected = html_storage.querySelector("tr > td.selected");
   if (selected === null)
      return;
   var text = smartFillValue;
   if (text === null)
      text = html_descr.value.trim();
   if (text === "")
      return;
   selected.innerText = text;
   storageSave();
}

function storageRemove() {
   var selected = html_storage.querySelector("tr > td.selected");
   if (selected === null)
      return;
   html_storage.removeChild(selected.parentElement);
   storageSave();
}

function storageMoveToBottom() {
   var selected = html_storage.querySelector("tr > td.selected");
   if (selected === null)
      return;
   html_storage.appendChild(selected.parentElement);
   storageSave();
}

function storageClear() {
   for (var elem of html_storage.querySelectorAll("tr > td"))
      html_storage.removeChild(elem.parentElement);
   storageSave();
}

// Functions
function formatTwoDigits(inp) {
   if (inp < 10)
      return "0" + inp;
   else
      return inp;
}

function getTimeString() {
   var date = new Date();
   var year = date.getFullYear();
   var month = formatTwoDigits(date.getMonth() + 1);
   var day = formatTwoDigits(date.getDate());
   var hour = formatTwoDigits(date.getHours());
   var minute = formatTwoDigits(date.getMinutes());
   var second = formatTwoDigits(date.getSeconds());
   return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
}

