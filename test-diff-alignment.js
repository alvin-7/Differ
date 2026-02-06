/**
 * Test script to verify diff algorithm alignment behavior
 * Tests: 1000 rows vs 1020 rows comparison
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

function testDiffAlignment() {
  console.log('=== Testing Diff Alignment ===\n');

  // Test Case 1: 1000 identical rows vs 1000 identical rows
  console.log('Test 1: 1000 vs 1000 (identical)');
  const left1000 = Array.from({ length: 1000 }, (_, i) => ({ A: `row${i}`, B: `data${i}` }));
  const right1000 = Array.from({ length: 1000 }, (_, i) => ({ A: `row${i}`, B: `data${i}` }));

  const leftObj1 = {};
  const rightObj1 = {};
  const leftHashes1 = left1000.map((v, idx) => {
    const str = hashRowToString(v);
    if (!(str in leftObj1)) leftObj1[str] = {};
    leftObj1[str][idx] = v;
    return str;
  });
  const rightHashes1 = right1000.map((v, idx) => {
    const str = hashRowToString(v);
    if (!(str in rightObj1)) rightObj1[str] = {};
    rightObj1[str][idx] = v;
    return str;
  });

  const diff1 = diffArrays(leftHashes1, rightHashes1);
  console.log(`Diff chunks: ${diff1.length}`);
  console.log(`Result: ${diff1.length === 1 && !diff1[0].added && !diff1[0].removed ? 'SAME' : 'DIFFERENT'}\n`);

  // Test Case 2: 1000 rows vs 1020 rows (20 rows added at end)
  console.log('Test 2: 1000 vs 1020 (20 rows added at end)');
  const left1000_2 = Array.from({ length: 1000 }, (_, i) => ({ A: `row${i}`, B: `data${i}` }));
  const right1020 = [
    ...Array.from({ length: 1000 }, (_, i) => ({ A: `row${i}`, B: `data${i}` })),
    ...Array.from({ length: 20 }, (_, i) => ({ A: `newrow${i}`, B: `newdata${i}` }))
  ];

  const leftObj2 = {};
  const rightObj2 = {};
  const leftHashes2 = left1000_2.map((v, idx) => {
    const str = hashRowToString(v);
    if (!(str in leftObj2)) leftObj2[str] = {};
    leftObj2[str][idx] = v;
    return str;
  });
  const rightHashes2 = right1020.map((v, idx) => {
    const str = hashRowToString(v);
    if (!(str in rightObj2)) rightObj2[str] = {};
    rightObj2[str][idx] = v;
    return str;
  });

  const diff2 = diffArrays(leftHashes2, rightHashes2);
  console.log(`Diff chunks: ${diff2.length}`);
  diff2.forEach((chunk, idx) => {
    console.log(`  Chunk ${idx}: count=${chunk.count}, added=${!!chunk.added}, removed=${!!chunk.removed}`);
  });
  console.log(`Expected: First 1000 rows same, last 20 rows added\n`);

  // Test Case 3: 1000 rows vs 1020 rows (20 rows added in middle)
  console.log('Test 3: 1000 vs 1020 (20 rows added in middle at line 500)');
  const left1000_3 = Array.from({ length: 1000 }, (_, i) => ({ A: `row${i}`, B: `data${i}` }));
  const right1020_3 = [
    ...Array.from({ length: 500 }, (_, i) => ({ A: `row${i}`, B: `data${i}` })),
    ...Array.from({ length: 20 }, (_, i) => ({ A: `inserted${i}`, B: `insertdata${i}` })),
    ...Array.from({ length: 500 }, (_, i) => ({ A: `row${i + 500}`, B: `data${i + 500}` }))
  ];

  const leftObj3 = {};
  const rightObj3 = {};
  const leftHashes3 = left1000_3.map((v, idx) => {
    const str = hashRowToString(v);
    if (!(str in leftObj3)) leftObj3[str] = {};
    leftObj3[str][idx] = v;
    return str;
  });
  const rightHashes3 = right1020_3.map((v, idx) => {
    const str = hashRowToString(v);
    if (!(str in rightObj3)) rightObj3[str] = {};
    rightObj3[str][idx] = v;
    return str;
  });

  const diff3 = diffArrays(leftHashes3, rightHashes3);
  console.log(`Diff chunks: ${diff3.length}`);
  diff3.forEach((chunk, idx) => {
    console.log(`  Chunk ${idx}: count=${chunk.count}, added=${!!chunk.added}, removed=${!!chunk.removed}`);
  });
  console.log(`Expected: First 500 same, 20 added, last 500 same\n`);

  // Test Case 4: 1000 rows vs 1020 rows (20 rows modified in middle)
  console.log('Test 4: 1000 vs 1020 (rows 500-519 modified to different content)');
  const left1000_4 = Array.from({ length: 1000 }, (_, i) => ({ A: `row${i}`, B: `data${i}` }));
  const right1020_4 = Array.from({ length: 1020 }, (_, i) => {
    if (i >= 500 && i < 520) {
      return { A: `modified${i}`, B: `moddata${i}` };
    }
    return { A: `row${i}`, B: `data${i}` };
  });

  const leftObj4 = {};
  const rightObj4 = {};
  const leftHashes4 = left1000_4.map((v, idx) => {
    const str = hashRowToString(v);
    if (!(str in leftObj4)) leftObj4[str] = {};
    leftObj4[str][idx] = v;
    return str;
  });
  const rightHashes4 = right1020_4.map((v, idx) => {
    const str = hashRowToString(v);
    if (!(str in rightObj4)) rightObj4[str] = {};
    rightObj4[str][idx] = v;
    return str;
  });

  const diff4 = diffArrays(leftHashes4, rightHashes4);
  console.log(`Diff chunks: ${diff4.length}`);
  diff4.forEach((chunk, idx) => {
    console.log(`  Chunk ${idx}: count=${chunk.count}, added=${!!chunk.added}, removed=${!!chunk.removed}`);
  });
  console.log(`This will show how Myers diff handles modifications\n`);

  console.log('=== Analysis ===');
  console.log('Myers diff algorithm compares rows by their CONTENT (hash), not by line number.');
  console.log('If row 1000 in left file has same content as row 1020 in right file,');
  console.log('the algorithm will match them together, not compare 1000 vs 1000.');
  console.log('\nThis is CORRECT behavior for detecting moved/reordered content.');
}

testDiffAlignment();
