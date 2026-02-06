/**
 * Test to understand why row 1000 might match with row 1020
 * This simulates content-based matching behavior
 */

const { diffArrays } = require('diff');

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

console.log('=== Why Row 1000 Matches Row 1020 ===\n');

// Scenario: Left file has 1000 rows, right file has 1020 rows
// But rows 1-20 in right file are NEW, and rows 21-1020 match rows 1-1000 in left

console.log('Scenario: 20 rows inserted at the beginning of right file\n');

const leftData = Array.from({ length: 1000 }, (_, i) => ({
  A: `original${i}`,
  B: `data${i}`
}));

const rightData = [
  // 20 new rows at the beginning
  ...Array.from({ length: 20 }, (_, i) => ({
    A: `new${i}`,
    B: `newdata${i}`
  })),
  // Then the original 1000 rows
  ...Array.from({ length: 1000 }, (_, i) => ({
    A: `original${i}`,
    B: `data${i}`
  }))
];

console.log(`Left file: ${leftData.length} rows`);
console.log(`Right file: ${rightData.length} rows`);
console.log(`\nLeft row 0 content: ${JSON.stringify(leftData[0])}`);
console.log(`Right row 0 content: ${JSON.stringify(rightData[0])}`);
console.log(`Right row 20 content: ${JSON.stringify(rightData[20])}`);
console.log(`\nNotice: Left row 0 matches Right row 20 (not row 0)\n`);

// Hash the rows
const leftHashes = leftData.map(v => hashRowToString(v));
const rightHashes = rightData.map(v => hashRowToString(v));

const diff = diffArrays(leftHashes, rightHashes);

console.log('Diff result:');
diff.forEach((chunk, idx) => {
  console.log(`  Chunk ${idx}: count=${chunk.count}, added=${!!chunk.added}, removed=${!!chunk.removed}`);
});

console.log('\n=== What This Means ===');
console.log('Myers diff found that:');
console.log('- First 20 rows in right file are NEW (added)');
console.log('- Remaining 1000 rows in right file match the 1000 rows in left file');
console.log('\nSo the algorithm will align:');
console.log('- Left row 0 → Right row 20');
console.log('- Left row 1 → Right row 21');
console.log('- ...');
console.log('- Left row 999 → Right row 1019');
console.log('\nThis is CORRECT because it detects that 20 rows were inserted at the top.');

console.log('\n=== Another Scenario ===');
console.log('What if the content at row 1000 actually appears at row 1020?\n');

const leftData2 = Array.from({ length: 1000 }, (_, i) => ({
  A: `row${i}`,
  B: `data${i}`
}));

const rightData2 = [
  ...Array.from({ length: 999 }, (_, i) => ({
    A: `row${i}`,
    B: `data${i}`
  })),
  // Insert 20 new rows before row 999
  ...Array.from({ length: 20 }, (_, i) => ({
    A: `inserted${i}`,
    B: `insertdata${i}`
  })),
  // Then row 999
  { A: 'row999', B: 'data999' }
];

console.log(`Left file: ${leftData2.length} rows`);
console.log(`Right file: ${rightData2.length} rows`);
console.log(`\nLeft row 999 content: ${JSON.stringify(leftData2[999])}`);
console.log(`Right row 999 content: ${JSON.stringify(rightData2[999])}`);
console.log(`Right row 1019 content: ${JSON.stringify(rightData2[1019])}`);
console.log(`\nNotice: Left row 999 matches Right row 1019 (not row 999)\n`);

const leftHashes2 = leftData2.map(v => hashRowToString(v));
const rightHashes2 = rightData2.map(v => hashRowToString(v));

const diff2 = diffArrays(leftHashes2, rightHashes2);

console.log('Diff result:');
diff2.forEach((chunk, idx) => {
  console.log(`  Chunk ${idx}: count=${chunk.count}, added=${!!chunk.added}, removed=${!!chunk.removed}`);
});

console.log('\n=== Conclusion ===');
console.log('Myers diff compares by CONTENT, not by line number.');
console.log('If you see "row 1000 matches row 1020", it means:');
console.log('1. The CONTENT of row 1000 in left file is identical to row 1020 in right file');
console.log('2. There are 20 rows of differences between them (inserted, deleted, or modified)');
console.log('3. This is the optimal alignment to minimize the number of changes');
console.log('\nTo debug your specific case:');
console.log('- Check the actual content of row 1000 in left file');
console.log('- Check the actual content of row 1020 in right file');
console.log('- See if they are identical');
console.log('- Look at rows 1001-1019 in right file to see what was inserted');
