import { contextBridge, ipcRenderer } from 'electron';
// import xlsx from 'node-xlsx';
import fs from 'fs';
import * as XLSX from 'xlsx/xlsx.mjs';
import { diffArrays } from 'diff';
import { diff } from 'deep-object-diff';

XLSX.set_fs(fs);

function SheetToJson(workbookSheets) {
  const columnReg = new RegExp(/(^[A-Z]*)([0-9]*$)/);
  const sheets = {};
  for (const sheetName in workbookSheets) {
    const sheetData = workbookSheets[sheetName];
    const rowsData = [];
    for (const colKey in sheetData) {
      if (colKey.startsWith('!')) continue;
      const matchRst = colKey.match(columnReg);
      const row = matchRst[2] - 1;
      const col = matchRst[1];
      if (!(row in rowsData)) rowsData[row] = {};
      rowsData[row][col] = sheetData[colKey].v + '';
      rowsData[row][col] = rowsData[row][col].replaceAll('\r\n', '\n')
    }
    for (let i = 0; i < rowsData.length; i++) {
      if (!rowsData[i]) rowsData[i] = {};
    }
    sheets[sheetName] = rowsData;
  }
  return sheets;
}

contextBridge.exposeInMainWorld('electronAPI', {
  ipcRenderer: { ...ipcRenderer, on: ipcRenderer.on.bind(ipcRenderer) },
  readXlsx: (path) => {
    let data = path;
    if (typeof path === 'string') {
      data = fs.readFileSync(path);
    }
    const workbook = XLSX.read(data);
    const datas = SheetToJson(workbook.Sheets);
    return datas;
  },
  diffArrays: (leftSrcData, rightSrcData) => {
    const leftData = [...leftSrcData];
    const rightData = [...rightSrcData];
    const leftObj = {};
    const rightObj = {};
    const itemFunc = function (obj) {
      return (v, idx) => {
        const str = JSON.stringify(v);
        if (!(str in obj)) obj[str] = {};
        obj[str][idx] = v;
        return str;
      };
    };

    const sampleDiff = diffArrays(
      leftData.map(itemFunc(leftObj)),
      rightData.map(itemFunc(rightObj))
    );
    let removeObj = null;
    const diffObj = {};
    const diffItems = [];
    let leftLine = 0;
    let rightLine = 0;
    let removeLine = 0;
    for (let i = 0; i < sampleDiff.length; i++) {
      const diffItem = sampleDiff[i];
      const lineNum = diffItem.count;
      if (diffItem.removed) {
        //表示左边被移除行
        leftLine += lineNum;
        removeObj = diffItem;
        removeLine = lineNum;
      } else if (diffItem.added) {
        //表示右边添加行
        rightLine += lineNum;
        const addObj = diffItem;
        if (removeObj) {
          //表示移除左边，并添加右边
          diffItems.push([removeObj, addObj, leftLine-removeLine, rightLine-lineNum]);
          removeObj = null;
        } else {
          //仅仅是右边添加，没有移除左边
          diffItems.push([null, addObj, leftLine-removeLine, rightLine-lineNum]);
        }
      } else if (removeObj) {
        //表示左边被移除，但是没有添加   也就是右边需要添加几个空行
        leftLine += lineNum;
        rightLine += lineNum;

        diffItems.push([removeObj, null, leftLine-lineNum-removeLine, rightLine-lineNum]);
        removeObj = null;
      } else {
        leftLine += lineNum;
        rightLine += lineNum;
      }
    }
    if (removeObj) {
      diffItems.push([removeObj, null, leftLine-removeLine, rightLine]);
    }

    const addLines = [0, 0]
    const nullLines = {
      'left': [],
      'right': []
    }
    const diffLines = []
    for (const item of diffItems) {
      item[2] += addLines[0]
      item[3] += addLines[1]
      if (!item[0] && item[1]?.added) {
        // 右边增加行，说明需要给左边加空行
        item[2] += 1
        leftData.splice(item[2], 0, ...Array(item[1].count).fill(''));
        for (let i=0; i<item[1].count; i++) {
          nullLines.left.push(item[2]+i)
        }
        addLines[0] += item[1].count
      } else if (item[0]?.removed && !item[1]) {
        // 左边删除行，说明需要给右边加空行
        rightData.splice(item[3], 0, ...Array(item[0].count).fill(''));
        for (let i=0; i<item[0].count; i++) {
          nullLines.right.push(item[3]+i)
        }
        addLines[1] += item[0].count
      } else if (item[0]?.removed && item[1].added) {
        if (item[0].count > item[1].added) {
          const diffCnt = item[0].count - item[1].count
          rightData.splice(item[3], 0, ...Array(diffCnt).fill(''));
          for (let i=0; i<diffCnt; i++) {
            nullLines.right.push(item[3]+i)
          }
          addLines[1] += diffCnt
          item[2] += diffCnt
          item[3] += diffCnt
        } else if (item[0].count < item[1].added){
          const diffCnt = item[1].count - item[0].count
          leftData.splice(item[2], 0, ...Array(diffCnt).fill(''));
          for (let i=0; i<diffCnt; i++) {
            nullLines.left.push(item[3]+i)
          }
          addLines[0] += diffCnt
        }
      }
      for (let add=0; add<item[1].count; add++) {
        diffLines.push([item[2]+add, item[3]+add])
      }
    }

    for (const item of diffLines) {
      const data = {}
      data[item[0]] = diff(leftData[item[0]], rightData[item[1]])
      Object.assign(diffObj, data);
    }
    console.error('ee', {
      leftData: leftData,
      rightData: rightData,
      diffObj: diffObj,
      diffItems,
      nullLines,
    })

    return {
      leftData: leftData,
      rightData: rightData,
      diffObj: diffObj,
      nullLines,
    };
  },
});
