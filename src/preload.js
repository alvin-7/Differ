import { contextBridge, ipcRenderer } from 'electron';
// import xlsx from 'node-xlsx';
import fs from 'fs'
import * as XLSX from 'xlsx/xlsx.mjs';


XLSX.set_fs(fs)

contextBridge.exposeInMainWorld('electronAPI', {
  ipcRenderer,
  // readXlsx: (path) => {
  //   if (typeof path === 'string') {
  //     path = fs.readFileSync(path)
  //   }
  //   return xlsx.parse(path)
  // }, 
  readXlsx: (path) => {
    let data = path
    if (typeof path === 'string') {
      data = fs.readFileSync(path)
    }
    const workbook = XLSX.read(data)
    const datas = {}
    for (const sheet in workbook.Sheets) {
      datas[sheet] = XLSX.utils.sheet_to_json(workbook.Sheets[sheet])
    }
    return datas
  }
});
