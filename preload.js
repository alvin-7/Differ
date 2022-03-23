const { contextBridge, ipcRenderer } = require('electron');
const xlsx = require('node-xlsx');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer, xlsx
});
