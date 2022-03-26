import { contextBridge, ipcRenderer } from 'electron';
import xlsx from 'node-xlsx';
import fs from 'fs'

contextBridge.exposeInMainWorld('electronAPI', {
  ipcRenderer,
  readXlsx: (path) => {
    if (typeof path === 'string') {
      path = fs.readFileSync(path)
    }
    return xlsx.parse(path)
  }
});
