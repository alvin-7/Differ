import { contextBridge, ipcRenderer } from 'electron';
import xlsx from 'node-xlsx';
import fs from 'fs'

contextBridge.exposeInMainWorld('electronAPI', {
  ipcRenderer,
  readXlsx: (path) => {
    console.log('path22', path, typeof path)
    const sheets = []
    let excelPaths = path === '' ? [] : [path]
    if (path === '') {
      // const argvLen = process.argv.length
      // console.log(process.argv)
      // for (const arg of process.argv) {
      // }
      // if (argvLen <= 2) return sheets
      // excelPaths = process.argv.slice(argvLen-2, argvLen)
      return sheets
    }
    for (let path of excelPaths) {
      console.log('1',path)
      if (typeof path === 'string') {
        path = fs.readFileSync(path)
      }
      console.log('2',path)
      sheets.push(xlsx.parse(path))
    }
    return sheets
  }
});
