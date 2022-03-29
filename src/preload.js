import { contextBridge, ipcRenderer } from 'electron';
// import xlsx from 'node-xlsx';
import fs from 'fs'
import * as XLSX from 'xlsx/xlsx.mjs';
import { diffArrays } from 'diff';
import { diff } from 'deep-object-diff';


XLSX.set_fs(fs)

function SheetToJson(workbookSheets) {
  const columnReg = new RegExp(/(^[A-Z]*)([0-9]*$)/)
  const sheets = {}
  for (const sheetName in workbookSheets) {
    const sheetData = workbookSheets[sheetName]
    const rowsData = []
    for (const colKey in sheetData) {
      if (colKey.startsWith('!')) continue
      const matchRst = colKey.match(columnReg)
      const row = matchRst[2] - 1
      const col = matchRst[1]
      if (!(row in rowsData)) rowsData[row] = {}
      rowsData[row][col] = sheetData[colKey].v + ''
    }
    for (let i=0; i<rowsData.length; i++) {
      if (!rowsData[i]) rowsData[i] = {}
    }
    sheets[sheetName] = rowsData
  }
  return sheets
}

contextBridge.exposeInMainWorld('electronAPI', {
  ipcRenderer: {...ipcRenderer, on: ipcRenderer.on.bind(ipcRenderer)},
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
    const datas = SheetToJson(workbook.Sheets)
    return datas
  },
  diffArrays: (leftData, rightData) => {
    return diff(leftData, rightData)
  }
});
