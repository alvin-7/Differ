import { contextBridge, ipcRenderer } from 'electron';
// import xlsx from 'node-xlsx';
import fs from 'fs';
import * as XLSX from 'xlsx/xlsx.mjs';
import { diffArrays, diffWords } from 'diff';
import { hashRowToString } from './utils/hash.js';

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

    // 使用 Myers diff 算法识别行的变化
    const leftObj = {};
    const rightObj = {};
    const itemFunc = function (obj) {
      return (v, idx) => {
        const str = hashRowToString(v);
        if (!(str in obj)) obj[str] = {};
        obj[str][idx] = v;
        return str;
      };
    };

    const sampleDiff = diffArrays(
      leftData.map(itemFunc(leftObj)),
      rightData.map(itemFunc(rightObj))
    );

    // 插入空行来对齐左右两边，并记录差异信息
    const diffObj = {}; // { lineNumber: { columnName: true } } 简化结构
    const nullLines = { left: [], right: [] };
    const rowTypes = {}; // { lineNumber: 'added' | 'removed' | 'modified' | 'same' }
    let leftLine = 0;
    let rightLine = 0;
    let removeObj = null;
    let removeLine = 0;

    for (let i = 0; i < sampleDiff.length; i++) {
      const diffItem = sampleDiff[i];
      const lineNum = diffItem.count;

      if (diffItem.removed) {
        // 左边被删除的行
        leftLine += lineNum;
        removeObj = diffItem;
        removeLine = lineNum;
      } else if (diffItem.added) {
        // 右边添加的行
        rightLine += lineNum;
        const addObj = diffItem;

        if (removeObj) {
          // 左边删除，右边添加（可能是修改）
          const leftCount = removeLine;
          const rightCount = lineNum;
          const maxCount = Math.max(leftCount, rightCount);

          if (leftCount > rightCount) {
            // 右边需要补空行
            rightData.splice(rightLine - lineNum, 0, ...Array(leftCount - rightCount).fill(''));
            for (let j = 0; j < leftCount - rightCount; j++) {
              nullLines.right.push(rightLine - lineNum + j);
            }
          } else if (leftCount < rightCount) {
            // 左边需要补空行
            leftData.splice(leftLine - removeLine, 0, ...Array(rightCount - leftCount).fill(''));
            for (let j = 0; j < rightCount - leftCount; j++) {
              nullLines.left.push(leftLine - removeLine + j);
            }
            leftLine += rightCount - leftCount;
          }

          // 标记这些行为修改，并检查单元格差异
          for (let j = 0; j < maxCount; j++) {
            const currentLine = leftLine - removeLine + j;
            const lRow = leftData[currentLine];
            const rRow = rightData[currentLine];

            if (lRow && rRow && lRow !== '' && rRow !== '') {
              // 检查单元格级别的差异
              const allColumns = new Set([
                ...Object.keys(lRow),
                ...Object.keys(rRow)
              ]);

              const cellDiffs = {};
              for (const col of allColumns) {
                const leftValue = String(lRow[col] || '');
                const rightValue = String(rRow[col] || '');
                if (leftValue !== rightValue) {
                  cellDiffs[col] = true; // 简化：只标记有差异，不存储详细内容
                }
              }

              if (Object.keys(cellDiffs).length > 0) {
                diffObj[currentLine] = cellDiffs;
                rowTypes[currentLine] = 'modified';
              }
            } else {
              // 空行，标记为添加或删除
              diffObj[currentLine] = {};
              rowTypes[currentLine] = lRow === '' ? 'removed' : 'added';
            }
          }

          removeObj = null;
        } else {
          // 只有右边添加，左边需要补空行
          leftData.splice(leftLine, 0, ...Array(lineNum).fill(''));
          for (let j = 0; j < lineNum; j++) {
            nullLines.left.push(leftLine + j);
            diffObj[leftLine + j] = {};
            rowTypes[leftLine + j] = 'added';
          }
          leftLine += lineNum;
        }
      } else if (removeObj) {
        // 只有左边删除，右边需要补空行
        rightData.splice(rightLine, 0, ...Array(removeLine).fill(''));
        for (let j = 0; j < removeLine; j++) {
          nullLines.right.push(rightLine + j);
          diffObj[leftLine - removeLine + j] = {};
          rowTypes[leftLine - removeLine + j] = 'removed';
        }
        rightLine += removeLine;
        removeObj = null;
      } else {
        // 相同的行，检查单元格级别的差异
        for (let j = 0; j < lineNum; j++) {
          const lRow = leftData[leftLine + j];
          const rRow = rightData[rightLine + j];

          if (lRow && rRow) {
            const allColumns = new Set([
              ...Object.keys(lRow),
              ...Object.keys(rRow)
            ]);

            const cellDiffs = {};
            for (const col of allColumns) {
              const leftValue = String(lRow[col] || '');
              const rightValue = String(rRow[col] || '');
              if (leftValue !== rightValue) {
                cellDiffs[col] = true;
              }
            }

            if (Object.keys(cellDiffs).length > 0) {
              diffObj[leftLine + j] = cellDiffs;
              rowTypes[leftLine + j] = 'modified';
            }
          }
        }
        leftLine += lineNum;
        rightLine += lineNum;
      }
    }

    // 处理末尾的删除
    if (removeObj) {
      rightData.splice(rightLine, 0, ...Array(removeLine).fill(''));
      for (let j = 0; j < removeLine; j++) {
        nullLines.right.push(rightLine + j);
        diffObj[leftLine - removeLine + j] = {};
        rowTypes[leftLine - removeLine + j] = 'removed';
      }
    }

    return {
      leftData: leftData,
      rightData: rightData,
      diffObj: diffObj, // { lineNumber: { columnName: true } }
      nullLines: nullLines,
      rowTypes: rowTypes, // { lineNumber: 'added' | 'removed' | 'modified' }
    };
  },
});
