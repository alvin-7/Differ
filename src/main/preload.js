import { contextBridge, ipcRenderer } from 'electron';
// import xlsx from 'node-xlsx';

contextBridge.exposeInMainWorld('electronAPI', {
  ipcRenderer,
  readXlsx: (path) => {
    return path
    // console.log('path', path)
    // const sheets: { name: string; data: unknown[]; }[][] = []
    // let excelPaths = path === '' ? [] : [path]
    // if (excelPaths.length) {
    //   const argvLen = process.argv.length
    //   if (argvLen <= 2) return sheets
    //   excelPaths = process.argv.slice(argvLen-2, argvLen)
    // }
    // for (const path of excelPaths) {
    //   sheets.push(xlsx.parse(path))
    // }
    // console.log('sheets', sheets)
    // return sheets
  }
});
