// Web Worker for diff calculation
// This runs in a separate thread to avoid blocking the UI

import { diffArrays, diffWords } from 'diff';

// Hash function for row comparison (copied from hash.js)
function hashRowToString(row: any) {
  if (!row || typeof row !== 'object') return String(row);

  const keys = Object.keys(row).sort();
  const parts = [];

  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null) {
      parts.push(`${key}:${String(value)}`);
    }
  }

  return parts.join('|');
}

interface DiffRequest {
  type: 'CALCULATE_DIFF';
  leftData: any[];
  rightData: any[];
}

interface DiffResponse {
  type: 'DIFF_RESULT' | 'PROGRESS';
  result?: {
    leftData: any[];
    rightData: any[];
    diffObj: any;
    nullLines: { left: number[]; right: number[] };
  };
  progress?: number;
}

self.onmessage = (e: MessageEvent<DiffRequest>) => {
  const { type, leftData, rightData } = e.data;

  if (type === 'CALCULATE_DIFF') {
    try {
      // Report initial progress
      self.postMessage({ type: 'PROGRESS', progress: 10 } as DiffResponse);

      const result = calculateDiff(leftData, rightData);

      // Report completion
      self.postMessage({ type: 'PROGRESS', progress: 100 } as DiffResponse);

      const response: DiffResponse = {
        type: 'DIFF_RESULT',
        result,
      };

      self.postMessage(response);
    } catch (error) {
      console.error('Diff calculation error:', error);
      self.postMessage({
        type: 'DIFF_RESULT',
        result: {
          leftData,
          rightData,
          diffObj: {},
          nullLines: { left: [], right: [] },
        },
      });
    }
  }
};

function calculateDiff(leftSrcData: any[], rightSrcData: any[]) {
  const leftData = [...leftSrcData];
  const rightData = [...rightSrcData];
  const leftObj: any = {};
  const rightObj: any = {};

  const itemFunc = function (obj: any) {
    return (v: any, idx: number) => {
      const str = hashRowToString(v);
      if (!(str in obj)) obj[str] = {};
      obj[str][idx] = v;
      return str;
    };
  };

  // Report progress
  self.postMessage({ type: 'PROGRESS', progress: 30 } as DiffResponse);

  const sampleDiff = diffArrays(
    leftData.map(itemFunc(leftObj)),
    rightData.map(itemFunc(rightObj))
  );

  // Report progress
  self.postMessage({ type: 'PROGRESS', progress: 50 } as DiffResponse);

  let removeObj: any = null;
  const diffObj: any = {};
  const diffItems: any[] = [];
  let leftLine = 0;
  let rightLine = 0;
  let removeLine = 0;

  for (let i = 0; i < sampleDiff.length; i++) {
    const diffItem = sampleDiff[i];
    const lineNum = diffItem.count || 0;
    if (diffItem.removed) {
      leftLine += lineNum;
      removeObj = diffItem;
      removeLine = lineNum;
    } else if (diffItem.added) {
      rightLine += lineNum;
      const addObj = diffItem;
      if (removeObj) {
        diffItems.push([removeObj, addObj, leftLine - removeLine, rightLine - lineNum]);
        removeObj = null;
      } else {
        diffItems.push([null, addObj, leftLine - removeLine, rightLine - lineNum]);
      }
    } else if (removeObj) {
      leftLine += lineNum;
      rightLine += lineNum;
      diffItems.push([removeObj, null, leftLine - lineNum - removeLine, rightLine - lineNum]);
      removeObj = null;
    } else {
      leftLine += lineNum;
      rightLine += lineNum;
    }
  }

  if (removeObj) {
    diffItems.push([removeObj, null, leftLine - removeLine, rightLine]);
  }

  // Report progress
  self.postMessage({ type: 'PROGRESS', progress: 70 } as DiffResponse);

  const addLines = [0, 0];
  const nullLines = {
    left: [] as number[],
    right: [] as number[],
  };
  const diffLines: number[] = [];

  for (const item of diffItems) {
    item[2] += addLines[0];
    item[3] += addLines[1];
    let diffCnt = 0;
    if (item[0]?.removed || item[1]?.added) {
      const leftCount = item[0]?.count || 0;
      const rightCount = item[1]?.count || 0;
      if (leftCount > rightCount) {
        diffCnt = leftCount - rightCount;
        rightData.splice(item[3], 0, ...Array(diffCnt).fill(''));
        for (let i = 0; i < diffCnt; i++) {
          nullLines.right.push(item[3] + i);
        }
        addLines[1] += diffCnt;
      } else if (leftCount < rightCount) {
        diffCnt = rightCount - leftCount;
        leftData.splice(item[3], 0, ...Array(diffCnt).fill(''));
        for (let i = 0; i < diffCnt; i++) {
          nullLines.left.push(item[3] + i);
        }
        addLines[0] += diffCnt;
      }
      for (let add = 0; add < Math.max(item[0]?.count || 0, item[1]?.count || 0); add++) {
        diffLines.push(item[3] + add);
      }
    }
  }

  // Report progress
  self.postMessage({ type: 'PROGRESS', progress: 90 } as DiffResponse);

  // 使用 Myers diff 算法进行单元格级对比
  for (const line of diffLines) {
    const leftRow = leftData[line];
    const rightRow = rightData[line];

    if (!leftRow || !rightRow) {
      // 空行，标记整行为 diff
      diffObj[line] = {};
      continue;
    }

    // 获取所有列
    const allColumns = new Set([
      ...Object.keys(leftRow),
      ...Object.keys(rightRow)
    ]);

    const rowDiff: any = {};
    for (const col of Array.from(allColumns)) {
      const leftValue = String(leftRow[col] || '');
      const rightValue = String(rightRow[col] || '');

      // 使用 Myers diff 算法对比单元格内容
      if (leftValue !== rightValue) {
        const cellDiff = diffWords(leftValue, rightValue);

        // 如果有差异，标记这个单元格
        if (cellDiff.some(part => part.added || part.removed)) {
          rowDiff[col] = {
            oldValue: leftValue,
            newValue: rightValue,
            diff: cellDiff  // Myers diff 结果
          };
        }
      }
    }

    if (Object.keys(rowDiff).length > 0) {
      diffObj[line] = rowDiff;
    }
  }

  return {
    leftData: leftData,
    rightData: rightData,
    diffObj: diffObj,
    nullLines,
  };
}

export {};
