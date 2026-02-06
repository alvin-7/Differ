# Myers 算法修复总结

## 问题诊断

你的 Myers 算法实现存在**回溯逻辑错误**，导致输出的 diff 段不正确。

### 原始问题：
- 回溯时使用了当前层的 `v` 数组而不是前一层的 `prevV`
- 没有正确处理基础情况（d=0）
- 插入/删除操作的索引计算有误

## 修复内容

### 主要修改：`buildSegments()` 函数

**关键修复点：**

1. **使用前一层的 trace**（第 59 行）
   ```javascript
   const prevV = trace[d - 1];  // 使用前一层，而不是当前层
   ```

2. **添加基础情况处理**（第 49-57 行）
   ```javascript
   if (d === 0) {
     // Base case: add remaining equal elements
     while (x > 0 && y > 0) {
       edits.push({ type: 'equal', value: a[x - 1] });
       x--;
       y--;
     }
     break;
   }
   ```

3. **修正方向判断**（第 62-68 行）
   ```javascript
   // 使用 prevV 而不是 v 来判断来自哪个方向
   if (k === -d || (k !== d && prevV[k - 1 + offset] < prevV[k + 1 + offset])) {
     prevK = k + 1;  // 来自 k+1 (插入)
   } else {
     prevK = k - 1;  // 来自 k-1 (删除)
   }
   ```

4. **修正操作添加逻辑**（第 81-93 行）
   ```javascript
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
   ```

## 测试结果

所有测试用例通过 ✓：

```
✓ Simple change test passed
✓ Addition test passed
✓ Deletion test passed
✓ Identical arrays test passed
✓ Empty arrays test passed
✓ Complex diff test passed
✓ Multiple insertions test passed
✓ Multiple deletions test passed
✓ Object strings test passed
✓ Large array test passed
```

### 测试示例：

**测试 1：简单修改**
```javascript
输入: ['A', 'B', 'C'] -> ['A', 'B', 'D']
输出: [
  { count: 2 },              // A, B 相同
  { count: 1, removed: true }, // C 被删除
  { count: 1, added: true }    // D 被添加
]
```

**测试 2：添加元素**
```javascript
输入: ['A', 'B'] -> ['A', 'B', 'C']
输出: [
  { count: 2 },              // A, B 相同
  { count: 1, added: true }  // C 被添加
]
```

**测试 3：删除元素**
```javascript
输入: ['A', 'B', 'C'] -> ['A', 'B']
输出: [
  { count: 2 },                // A, B 相同
  { count: 1, removed: true }  // C 被删除
]
```

**测试 4：复杂情况**
```javascript
输入: ['A', 'B', 'C', 'D'] -> ['A', 'X', 'C', 'Y']
输出: [
  { count: 1 },                // A 相同
  { count: 1, removed: true }, // B 被删除
  { count: 1, added: true },   // X 被添加
  { count: 1 },                // C 相同
  { count: 1, removed: true }, // D 被删除
  { count: 1, added: true }    // Y 被添加
]
```

## 输出格式

修复后的算法输出格式与 `diff` 库完全兼容：

```javascript
[
  { count: n },                    // n 个相同元素
  { count: n, added: true },       // n 个添加的元素
  { count: n, removed: true },     // n 个删除的元素
  ...
]
```

## 算法复杂度

- **时间复杂度**: O(ND)，其中 N 是数组长度之和，D 是编辑距离
- **空间复杂度**: O(ND)，用于存储 trace 数组

## 使用方法

```javascript
const { diffArraysMyers } = require('./src/utils/myers.js');

const oldArray = ['A', 'B', 'C'];
const newArray = ['A', 'B', 'D'];

const result = diffArraysMyers(oldArray, newArray);
console.log(result);
// [
//   { count: 2 },
//   { count: 1, removed: true },
//   { count: 1, added: true }
// ]
```

## 与 preload.js 集成

如果要在 `preload.js` 中使用这个实现替换 `diff` 库：

```javascript
// 在 preload.js 顶部添加
import { diffArraysMyers } from './utils/myers.js';

// 替换第 58 行
const sampleDiff = diffArraysMyers(
  leftData.map(itemFunc(leftObj)),
  rightData.map(itemFunc(rightObj))
);
```

## 文件清单

- `src/utils/myers.js` - 修复后的 Myers 算法实现
- `src/utils/myers.test.js` - 全面的测试套件（10 个测试用例）

## 验证步骤

1. 运行测试：
   ```bash
   node src/utils/myers.test.js
   ```

2. 所有测试应该通过 ✓

3. 输出格式与 `diff` 库兼容，可以直接替换使用

## 技术细节

### Myers 算法原理

Myers 算法通过构建编辑图（edit graph）来找到最短编辑序列：

1. **前向搜索**：从 (0,0) 开始，找到到达 (n,m) 的最短路径
2. **记录 trace**：保存每一步的 V 数组快照
3. **回溯**：从终点回溯到起点，重建编辑序列
4. **合并段**：将连续的相同操作合并成段

### 关键概念

- **k = x - y**：对角线编号
- **V[k]**：在对角线 k 上能到达的最远 x 坐标
- **d**：编辑距离（步数）
- **trace**：每一步的 V 数组快照，用于回溯

修复后的实现正确处理了所有边界情况和回溯逻辑，输出格式完全兼容 `diff` 库。
