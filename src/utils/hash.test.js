/**
 * Simple tests for hash utility
 * Run with: node src/utils/hash.test.js
 */

const { hashRowToString } = require('./hash.js');

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function testHashConsistency() {
  const obj1 = { A: '1', B: '2', C: '3' };
  const obj2 = { A: '1', B: '2', C: '3' };

  const hash1 = hashRowToString(obj1);
  const hash2 = hashRowToString(obj2);

  assert(hash1 === hash2, 'Same objects should produce same hash');
  console.log('✓ Hash consistency test passed');
}

function testKeyOrdering() {
  const obj1 = { A: '1', B: '2', C: '3' };
  const obj2 = { C: '3', A: '1', B: '2' };

  const hash1 = hashRowToString(obj1);
  const hash2 = hashRowToString(obj2);

  assert(hash1 === hash2, 'Objects with different key order should produce same hash');
  console.log('✓ Key ordering test passed');
}

function testHashUniqueness() {
  const obj1 = { A: '1', B: '2' };
  const obj2 = { A: '1', B: '3' };
  const obj3 = { A: '2', B: '2' };

  const hash1 = hashRowToString(obj1);
  const hash2 = hashRowToString(obj2);
  const hash3 = hashRowToString(obj3);

  assert(hash1 !== hash2, 'Different objects should produce different hashes');
  assert(hash1 !== hash3, 'Different objects should produce different hashes');
  assert(hash2 !== hash3, 'Different objects should produce different hashes');
  console.log('✓ Hash uniqueness test passed');
}

function testEdgeCases() {
  const tests = [
    [null, 'null'],
    [undefined, 'undefined'],
    [{}, ''],
    [{ A: '' }, 'A:'],
    [{ A: null }, 'A:null'],
    [{ A: undefined }, 'A:undefined'],
  ];

  for (const [input, expected] of tests) {
    const result = hashRowToString(input);
    assert(result === expected, `hashRowToString(${JSON.stringify(input)}) should be "${expected}", got "${result}"`);
  }

  console.log('✓ Edge cases test passed');
}

function testNestedObjects() {
  const obj1 = { A: '1', B: { C: '2', D: '3' } };
  const obj2 = { A: '1', B: { D: '3', C: '2' } };

  const hash1 = hashRowToString(obj1);
  const hash2 = hashRowToString(obj2);

  assert(hash1 === hash2, 'Nested objects with different key order should produce same hash');
  console.log('✓ Nested objects test passed');
}

function testPerformance() {
  const testObj = {
    A: 'value1',
    B: 'value2',
    C: 'value3',
    D: 'value4',
    E: 'value5',
    F: 'value6',
    G: 'value7',
    H: 'value8',
  };

  const iterations = 10000;

  // Test hashRowToString
  const start1 = Date.now();
  for (let i = 0; i < iterations; i++) {
    hashRowToString(testObj);
  }
  const time1 = Date.now() - start1;

  // Test JSON.stringify
  const start2 = Date.now();
  for (let i = 0; i < iterations; i++) {
    JSON.stringify(testObj);
  }
  const time2 = Date.now() - start2;

  console.log(`✓ Performance test: hashRowToString: ${time1}ms, JSON.stringify: ${time2}ms`);
  console.log(`  Speedup: ${(time2 / time1).toFixed(2)}x faster`);
}

// Run all tests
console.log('Running hash utility tests...\n');

try {
  testHashConsistency();
  testKeyOrdering();
  testHashUniqueness();
  testEdgeCases();
  testNestedObjects();
  testPerformance();

  console.log('\n✓ All tests passed!');
} catch (error) {
  console.error('\n✗ Test failed:', error.message);
  process.exit(1);
}
