/**
 * Comprehensive tests for Myers diff algorithm
 * Run with: node src/utils/myers.test.js
 */

const { diffArraysMyers } = require('./myers.js');

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function testSimpleChange() {
  const a = ['A', 'B', 'C'];
  const b = ['A', 'B', 'D'];
  const result = diffArraysMyers(a, b);

  assert(result.length === 3, 'Should have 3 segments');
  assert(result[0].count === 2 && !result[0].added && !result[0].removed, 'First 2 equal');
  assert(result[1].count === 1 && result[1].removed, 'C removed');
  assert(result[2].count === 1 && result[2].added, 'D added');

  console.log('✓ Simple change test passed');
}

function testAddition() {
  const a = ['A', 'B'];
  const b = ['A', 'B', 'C'];
  const result = diffArraysMyers(a, b);

  assert(result.length === 2, 'Should have 2 segments');
  assert(result[0].count === 2 && !result[0].added && !result[0].removed, 'First 2 equal');
  assert(result[1].count === 1 && result[1].added, 'C added');

  console.log('✓ Addition test passed');
}

function testDeletion() {
  const a = ['A', 'B', 'C'];
  const b = ['A', 'B'];
  const result = diffArraysMyers(a, b);

  assert(result.length === 2, 'Should have 2 segments');
  assert(result[0].count === 2 && !result[0].added && !result[0].removed, 'First 2 equal');
  assert(result[1].count === 1 && result[1].removed, 'C removed');

  console.log('✓ Deletion test passed');
}

function testIdentical() {
  const a = ['A', 'B', 'C'];
  const b = ['A', 'B', 'C'];
  const result = diffArraysMyers(a, b);

  assert(result.length === 1, 'Should have 1 segment');
  assert(result[0].count === 3 && !result[0].added && !result[0].removed, 'All equal');

  console.log('✓ Identical arrays test passed');
}

function testEmptyArrays() {
  // Empty to non-empty
  const result1 = diffArraysMyers([], ['A']);
  assert(result1.length === 1, 'Should have 1 segment');
  assert(result1[0].count === 1 && result1[0].added, 'A added');

  // Non-empty to empty
  const result2 = diffArraysMyers(['A'], []);
  assert(result2.length === 1, 'Should have 1 segment');
  assert(result2[0].count === 1 && result2[0].removed, 'A removed');

  // Both empty
  const result3 = diffArraysMyers([], []);
  assert(result3.length === 1, 'Should have 1 segment');
  assert(result3[0].count === 0, 'Empty result');

  console.log('✓ Empty arrays test passed');
}

function testComplexDiff() {
  const a = ['A', 'B', 'C', 'D', 'E'];
  const b = ['A', 'X', 'C', 'Y', 'E'];
  const result = diffArraysMyers(a, b);

  // Expected: A (equal), B->X (remove+add), C (equal), D->Y (remove+add), E (equal)
  assert(result.length === 7, 'Should have 7 segments');
  assert(result[0].count === 1 && !result[0].added && !result[0].removed, 'A equal');
  assert(result[1].count === 1 && result[1].removed, 'B removed');
  assert(result[2].count === 1 && result[2].added, 'X added');
  assert(result[3].count === 1 && !result[3].added && !result[3].removed, 'C equal');
  assert(result[4].count === 1 && result[4].removed, 'D removed');
  assert(result[5].count === 1 && result[5].added, 'Y added');
  assert(result[6].count === 1 && !result[6].added && !result[6].removed, 'E equal');

  console.log('✓ Complex diff test passed');
}

function testMultipleInsertions() {
  const a = ['A', 'B'];
  const b = ['A', 'X', 'Y', 'Z', 'B'];
  const result = diffArraysMyers(a, b);

  assert(result.length === 3, 'Should have 3 segments');
  assert(result[0].count === 1 && !result[0].added && !result[0].removed, 'A equal');
  assert(result[1].count === 3 && result[1].added, 'X,Y,Z added');
  assert(result[2].count === 1 && !result[2].added && !result[2].removed, 'B equal');

  console.log('✓ Multiple insertions test passed');
}

function testMultipleDeletions() {
  const a = ['A', 'X', 'Y', 'Z', 'B'];
  const b = ['A', 'B'];
  const result = diffArraysMyers(a, b);

  assert(result.length === 3, 'Should have 3 segments');
  assert(result[0].count === 1 && !result[0].added && !result[0].removed, 'A equal');
  assert(result[1].count === 3 && result[1].removed, 'X,Y,Z removed');
  assert(result[2].count === 1 && !result[2].added && !result[2].removed, 'B equal');

  console.log('✓ Multiple deletions test passed');
}

function testWithObjects() {
  // Test with stringified objects (like in preload.js)
  const a = [
    'A:1|B:2',
    'A:3|B:4',
    'A:5|B:6'
  ];
  const b = [
    'A:1|B:2',
    'A:3|B:99',  // Changed
    'A:5|B:6'
  ];
  const result = diffArraysMyers(a, b);

  assert(result.length === 4, 'Should have 4 segments');
  assert(result[0].count === 1 && !result[0].added && !result[0].removed, 'First row equal');
  assert(result[1].count === 1 && result[1].removed, 'Second row removed');
  assert(result[2].count === 1 && result[2].added, 'Second row added');
  assert(result[3].count === 1 && !result[3].added && !result[3].removed, 'Third row equal');

  console.log('✓ Object strings test passed');
}

function testLargeArray() {
  // Test with larger arrays
  const a = Array.from({ length: 100 }, (_, i) => `row${i}`);
  const b = [...a.slice(0, 50), 'inserted', ...a.slice(50)];

  const result = diffArraysMyers(a, b);

  assert(result.length === 3, 'Should have 3 segments');
  assert(result[0].count === 50, 'First 50 equal');
  assert(result[1].count === 1 && result[1].added, 'One inserted');
  assert(result[2].count === 50, 'Last 50 equal');

  console.log('✓ Large array test passed');
}

// Run all tests
console.log('Running Myers diff algorithm tests...\n');

try {
  testSimpleChange();
  testAddition();
  testDeletion();
  testIdentical();
  testEmptyArrays();
  testComplexDiff();
  testMultipleInsertions();
  testMultipleDeletions();
  testWithObjects();
  testLargeArray();

  console.log('\n✓ All tests passed!');
} catch (error) {
  console.error('\n✗ Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
