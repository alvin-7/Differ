/**
 * Debug tool to check why specific rows are matched
 * Usage: node debug-row-matching.js <left.xlsx> <right.xlsx> <leftRow> <rightRow>
 * Example: node debug-row-matching.js old.xlsx new.xlsx 1000 1020
 */

const fs = require('fs');
const XLSX = require('xlsx/xlsx.mjs');
const { diffArrays } = require('diff');

XLSX.set_fs(fs);

function hashRowToString(obj) {
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';
  if (typeof obj !== 'object') return String(obj);

  const keys = Object.keys(obj).sort();
  const parts = [];

  for (const key of keys) {
    const value = obj[key];
    parts.push(`${key}:${hashRowToString(value)}`);
  }

  return parts.join('|');
}

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
      rowsData[row][col] = rowsData[row][col].replaceAll('\r\n', '\n');
    }
    for (let i = 0; i < rowsData.length; i++) {
      if (!rowsData[i]) rowsData[i] = {};
    }
    sheets[sheetName] = rowsData;
  }
  return sheets;
}

function debugRowMatching(leftPath, rightPath, leftRowNum, rightRowNum, sheetName = null) {
  console.log('=== Row Matching Debug Tool ===\n');

  // Read Excel files
  console.log(`Reading left file: ${leftPath}`);
  const leftWorkbook = XLSX.read(fs.readFileSync(leftPath));
  const leftSheets = SheetToJson(leftWorkbook.Sheets);

  console.log(`Reading right file: ${rightPath}`);
  const rightWorkbook = XLSX.read(fs.readFileSync(rightPath));
  const rightSheets = SheetToJson(rightWorkbook.Sheets);

  // Get sheet name
  const leftSheetNames = Object.keys(leftSheets);
  const rightSheetNames = Object.keys(rightSheets);

  if (!sheetName) {
    sheetName = leftSheetNames[0];
  }

  console.log(`\nUsing sheet: ${sheetName}`);
  console.log(`Left file sheets: ${leftSheetNames.join(', ')}`);
  console.log(`Right file sheets: ${rightSheetNames.join(', ')}`);

  const leftData = leftSheets[sheetName];
  const rightData = rightSheets[sheetName];

  console.log(`\nLeft file: ${leftData.length} rows`);
  console.log(`Right file: ${rightData.length} rows`);

  // Check specific rows
  console.log(`\n=== Checking Row ${leftRowNum} (left) vs Row ${rightRowNum} (right) ===\n`);

  const leftRow = leftData[leftRowNum];
  const rightRow = rightData[rightRowNum];

  console.log(`Left row ${leftRowNum} content:`);
  console.log(JSON.stringify(leftRow, null, 2));

  console.log(`\nRight row ${rightRowNum} content:`);
  console.log(JSON.stringify(rightRow, null, 2));

  const leftHash = hashRowToString(leftRow);
  const rightHash = hashRowToString(rightRow);

  console.log(`\nLeft row hash: ${leftHash}`);
  console.log(`Right row hash: ${rightHash}`);
  console.log(`\nRows are ${leftHash === rightHash ? 'IDENTICAL' : 'DIFFERENT'}`);

  if (leftHash === rightHash) {
    console.log('\n✓ These rows have identical content, so Myers diff will match them.');
  } else {
    console.log('\n✗ These rows have different content.');
    console.log('\nLet me search for where left row actually matches in right file...');

    let foundAt = -1;
    for (let i = 0; i < rightData.length; i++) {
      if (hashRowToString(rightData[i]) === leftHash) {
        foundAt = i;
        break;
      }
    }

    if (foundAt >= 0) {
      console.log(`\n✓ Left row ${leftRowNum} actually matches Right row ${foundAt}`);
      console.log(`Right row ${foundAt} content:`);
      console.log(JSON.stringify(rightData[foundAt], null, 2));
    } else {
      console.log(`\n✗ Left row ${leftRowNum} not found in right file (it was deleted)`);
    }

    console.log('\nLet me search for where right row actually matches in left file...');

    foundAt = -1;
    for (let i = 0; i < leftData.length; i++) {
      if (hashRowToString(leftData[i]) === rightHash) {
        foundAt = i;
        break;
      }
    }

    if (foundAt >= 0) {
      console.log(`\n✓ Right row ${rightRowNum} actually matches Left row ${foundAt}`);
      console.log(`Left row ${foundAt} content:`);
      console.log(JSON.stringify(leftData[foundAt], null, 2));
    } else {
      console.log(`\n✗ Right row ${rightRowNum} not found in left file (it was added)`);
    }
  }

  // Run full diff to show alignment
  console.log('\n=== Running Full Diff Analysis ===\n');

  const leftHashes = leftData.map(v => hashRowToString(v));
  const rightHashes = rightData.map(v => hashRowToString(v));

  const diff = diffArrays(leftHashes, rightHashes);

  console.log(`Diff has ${diff.length} chunks:`);

  let leftIdx = 0;
  let rightIdx = 0;

  diff.forEach((chunk, idx) => {
    const type = chunk.added ? 'ADDED' : chunk.removed ? 'REMOVED' : 'SAME';
    console.log(`\nChunk ${idx}: ${type}, count=${chunk.count}`);

    if (chunk.removed) {
      console.log(`  Left rows ${leftIdx} to ${leftIdx + chunk.count - 1} were removed`);
      leftIdx += chunk.count;
    } else if (chunk.added) {
      console.log(`  Right rows ${rightIdx} to ${rightIdx + chunk.count - 1} were added`);
      rightIdx += chunk.count;
    } else {
      console.log(`  Left rows ${leftIdx}-${leftIdx + chunk.count - 1} match Right rows ${rightIdx}-${rightIdx + chunk.count - 1}`);

      // Check if our target rows are in this chunk
      if (leftRowNum >= leftIdx && leftRowNum < leftIdx + chunk.count) {
        const matchingRightRow = rightIdx + (leftRowNum - leftIdx);
        console.log(`  → Left row ${leftRowNum} matches Right row ${matchingRightRow}`);
      }

      leftIdx += chunk.count;
      rightIdx += chunk.count;
    }
  });
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 4) {
  console.log('Usage: node debug-row-matching.js <left.xlsx> <right.xlsx> <leftRow> <rightRow> [sheetName]');
  console.log('Example: node debug-row-matching.js old.xlsx new.xlsx 999 1019');
  console.log('\nNote: Row numbers are 0-indexed (first row is 0)');
  process.exit(1);
}

const leftPath = args[0];
const rightPath = args[1];
const leftRowNum = parseInt(args[2]);
const rightRowNum = parseInt(args[3]);
const sheetName = args[4] || null;

debugRowMatching(leftPath, rightPath, leftRowNum, rightRowNum, sheetName);
