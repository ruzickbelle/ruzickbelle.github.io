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

function smartStorageLoad() {
   var text = localStorage.getItem("timestampy.addtimes.smartStorage");
   if (text === null)
      return;
   var list = JSON.parse(text);
   for (text of list)
      smartStorageTableRowAppend(text);
}

function smartStorageSave() {
   var list = [];
   for (var elem of html_smartStorage.querySelectorAll("tr > td"))
      list.push(elem.innerText);
   var text = JSON.stringify(list);
   localStorage.setItem("timestampy.addtimes.smartStorage", text);
}

function smartStorageSelect(event) {
   if (event.target.tagName !== "TD")
      return;
   for (var cell of html_smartStorage.querySelectorAll("tr > td.selected"))
      cell.classList.remove("selected");
   event.target.classList.add("selected");
}

function smartStorageTableRowAppend(text) {
   var tr = document.createElement("tr");
   var td = document.createElement("td");
   td.innerText = text;
   tr.appendChild(td);
   html_smartStorage.appendChild(tr);
}

function smartStorageSetDescr() {
   var selected = html_smartStorage.querySelector("tr > td.selected");
   if (selected === null)
      return;
   var text = selected.innerText;
   html_descr.value = text;
   smartFillValue = text;
}

function smartStorageAppend() {
   var text = smartFillValue;
   if (text === null)
      text = html_descr.value.trim();
   if (text === "")
      return;
   smartStorageTableRowAppend(text);
   smartStorageSave();
}

function smartStorageReplace() {
   var selected = html_smartStorage.querySelector("tr > td.selected");
   if (selected === null)
      return;
   var text = smartFillValue;
   if (text === null)
      text = html_descr.value.trim();
   if (text === "")
      return;
   selected.innerText = text;
   smartStorageSave();
}

function smartStorageRemove() {
   var selected = html_smartStorage.querySelector("tr > td.selected");
   if (selected === null)
      return;
   html_smartStorage.removeChild(selected.parentElement);
   smartStorageSave();
}

function smartStorageMoveToBottom() {
   var selected = html_smartStorage.querySelector("tr > td.selected");
   if (selected === null)
      return;
   html_smartStorage.appendChild(selected.parentElement);
   smartStorageSave();
}

function smartStorageClear() {
   for (var elem of html_smartStorage.querySelectorAll("tr > td"))
      html_smartStorage.removeChild(elem.parentElement);
   smartStorageSave();
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

