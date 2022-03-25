import { contextBridge, ipcRenderer } from 'electron';
import xlsx from 'node-xlsx';
import fs from 'fs'

contextBridge.exposeInMainWorld('electronAPI', {
  ipcRenderer,
  readXlsx: (path) => {
    const sheets = []
    let excelPaths = path === '' ? [] : [path]
    if (path === '') {
      const argv = process.argv
      console.log('argv', argv)
      for (let i=0; i<argv.length; i++) {
        if (argv[i] === '--excel') {
          excelPaths.push(argv[i+1])
          excelPaths.push(argv[i+2])
          break
        }
      }
      if (!excelPaths.length) return sheets
    }
    for (let path of excelPaths) {
      if (typeof path === 'string') {
        path = fs.readFileSync(path)
      }
      sheets.push(xlsx.parse(path))
    }
    return sheets
  }
});
