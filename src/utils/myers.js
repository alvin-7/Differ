// Myers O(ND) diff for arrays
// Returns segments similar to 'diff' library:
// [{count: n}, {count: n, added: true}, {count: n, removed: true}, ...]
function diffArraysMyers(a, b) {
  const n = a.length;
  const m = b.length;
  const max = n + m;
  const offset = max;
  let v = new Array(2 * max + 1).fill(0);
  const trace = [];

  for (let d = 0; d <= max; d++) {
    const vSnapshot = new Array(2 * max + 1).fill(0);
    for (let k = -d; k <= d; k += 2) {
      let x;
      if (k === -d || (k !== d && v[k - 1 + offset] < v[k + 1 + offset])) {
        x = v[k + 1 + offset];
      } else {
        x = v[k - 1 + offset] + 1;
      }
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) {
        x++;
        y++;
      }
      v[k + offset] = x;
      vSnapshot[k + offset] = x;
      if (x >= n && y >= m) {
        trace.push(vSnapshot);
        return buildSegments(trace, a, b, offset);
      }
    }
    trace.push(vSnapshot);
    v = vSnapshot;
  }
  return [{ count: 0 }];
}

function buildSegments(trace, a, b, offset) {
  let x = a.length;
  let y = b.length;
  const edits = [];

  for (let d = trace.length - 1; d >= 0; d--) {
    const v = trace[d];
    const k = x - y;
    let prevK, prevX, prevY;

    if (d === 0) {
      // Base case: add remaining equal elements
      while (x > 0 && y > 0) {
        edits.push({ type: 'equal', value: a[x - 1] });
        x--;
        y--;
      }
      break;
    }

    const prevV = trace[d - 1];

    // Determine which direction we came from
    if (k === -d || (k !== d && prevV[k - 1 + offset] < prevV[k + 1 + offset])) {
      // Came from k+1 (insertion)
      prevK = k + 1;
    } else {
      // Came from k-1 (deletion)
      prevK = k - 1;
    }

    prevX = prevV[prevK + offset];
    prevY = prevX - prevK;

    // Add diagonal moves (equal elements)
    while (x > prevX && y > prevY) {
      edits.push({ type: 'equal', value: a[x - 1] });
      x--;
      y--;
    }

    // Add the edit operation
    if (prevK === k + 1) {
      // Insertion
      if (y > prevY) {
        edits.push({ type: 'insert', value: b[y - 1] });
        y--;
      }
    } else {
      // Deletion
      if (x > prevX) {
        edits.push({ type: 'delete', value: a[x - 1] });
        x--;
      }
    }
  }

  edits.reverse();

  // Collapse into segments with counts
  const segments = [];
  let i = 0;
  while (i < edits.length) {
    const t = edits[i].type;
    let cnt = 0;
    if (t === 'equal') {
      while (i < edits.length && edits[i].type === 'equal') {
        cnt++;
        i++;
      }
      if (cnt > 0) segments.push({ count: cnt });
    } else if (t === 'insert') {
      while (i < edits.length && edits[i].type === 'insert') {
        cnt++;
        i++;
      }
      segments.push({ count: cnt, added: true });
    } else if (t === 'delete') {
      while (i < edits.length && edits[i].type === 'delete') {
        cnt++;
        i++;
      }
      segments.push({ count: cnt, removed: true });
    } else {
      i++;
    }
  }
  return segments;
}

module.exports = { diffArraysMyers };
