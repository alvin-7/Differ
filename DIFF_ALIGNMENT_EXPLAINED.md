# Diff 算法行对齐原理说明

## 问题：为什么 1000 行会和 1020 行对比？

### 简短回答

**Myers diff 算法按内容匹配，不按行号匹配。**

如果左文件的第 1000 行内容与右文件的第 1020 行内容完全相同，算法会将它们匹配在一起，因为这是最优的对齐方式。

## 详细解释

### 1. Diff 算法的工作原理

```javascript
// preload.js 中的关键代码
const sampleDiff = diffArrays(
  leftData.map(v => hashRowToString(v)),  // 将每行转换为哈希字符串
  rightData.map(v => hashRowToString(v))
);
```

算法步骤：
1. 将每行的内容转换为哈希字符串（基于所有列的值）
2. 比较两个哈希字符串数组
3. 找出最少的编辑操作（添加、删除、保持不变）
4. 按内容匹配行，而不是按行号

### 2. 为什么会出现 1000 vs 1020 的情况？

#### 场景 A：开头插入了 20 行

```
左文件 (1000 行):          右文件 (1020 行):
行 0: {A: "data0"}        行 0: {A: "new0"}      ← 新增
行 1: {A: "data1"}        行 1: {A: "new1"}      ← 新增
...                       ...
                          行 19: {A: "new19"}    ← 新增
                          行 20: {A: "data0"}    ← 匹配左文件行 0
                          行 21: {A: "data1"}    ← 匹配左文件行 1
...                       ...
行 999: {A: "data999"}    行 1019: {A: "data999"} ← 匹配左文件行 999
```

**结果**：左文件的每一行都向后偏移 20 行来匹配右文件。

#### 场景 B：中间插入了 20 行

```
左文件 (1000 行):          右文件 (1020 行):
行 0-499: 相同            行 0-499: 相同
行 500: {A: "data500"}    行 500: {A: "new0"}    ← 新增
行 501: {A: "data501"}    行 501: {A: "new1"}    ← 新增
...                       ...
                          行 519: {A: "new19"}   ← 新增
                          行 520: {A: "data500"} ← 匹配左文件行 500
行 999: {A: "data999"}    行 1019: {A: "data999"} ← 匹配左文件行 999
```

**结果**：行 500-999 向后偏移 20 行来匹配。

### 3. 这是正确的行为吗？

**是的！** 这是 Myers diff 算法的核心优势：

✅ **优点**：
- 能检测到内容的移动和重排
- 能正确识别插入和删除
- 最小化显示的差异数量
- 符合用户的直觉（相同内容应该对齐）

❌ **如果按行号对齐会怎样**：
```
左文件行 500: {A: "data500"}  vs  右文件行 500: {A: "new0"}
左文件行 501: {A: "data501"}  vs  右文件行 501: {A: "new1"}
...
左文件行 999: {A: "data999"}  vs  右文件行 999: {A: "new19"}
```
这样会显示 500 行差异，但实际上只是插入了 20 行！

## 如何验证你的情况

### 方法 1：使用调试工具

```bash
node debug-row-matching.js left.xlsx right.xlsx 999 1019
```

这个工具会：
1. 显示两行的实际内容
2. 比较它们的哈希值
3. 告诉你它们是否相同
4. 显示完整的对齐结果

### 方法 2：在应用中检查

1. 打开 Differ 应用
2. 加载你的两个文件
3. 查看行 1000（左）和行 1020（右）的内容
4. 如果它们完全相同，说明算法工作正常
5. 查看行 1001-1019（右）看看插入了什么

### 方法 3：手动检查

在 Excel 中：
1. 打开左文件，复制第 1000 行的所有单元格
2. 打开右文件，复制第 1020 行的所有单元格
3. 比较它们是否完全相同

## 常见误解

### ❌ 误解 1："行号应该对齐"
**正确理解**：Diff 工具按内容对齐，不按行号。这样才能检测到插入、删除和移动。

### ❌ 误解 2："算法有 bug"
**正确理解**：如果内容相同的行被对齐，这正是算法的正确行为。

### ❌ 误解 3："应该总是 1000 vs 1000"
**正确理解**：只有当两个文件的行数相同且没有插入/删除时，才会是 1000 vs 1000。

## 技术细节

### hashRowToString 函数

```javascript
function hashRowToString(obj) {
  // 将行对象转换为确定性字符串
  const keys = Object.keys(obj).sort();  // 排序保证一致性
  const parts = [];
  for (const key of keys) {
    parts.push(`${key}:${obj[key]}`);
  }
  return parts.join('|');
}
```

示例：
```javascript
{ A: "hello", B: "world" } → "A:hello|B:world"
{ B: "world", A: "hello" } → "A:hello|B:world"  // 相同！
```

### Myers Diff 算法

- 由 Eugene Myers 在 1986 年发明
- 用于 Git、SVN 等版本控制系统
- 时间复杂度：O((N+M)D)，其中 D 是差异数量
- 保证找到最少的编辑操作

## 如果你确实需要按行号对齐

如果你的用例确实需要按行号对齐（不推荐），需要修改算法：

```javascript
// 不推荐的方案
diffArrays: (leftData, rightData) => {
  const maxLen = Math.max(leftData.length, rightData.length);
  const diffObj = {};

  for (let i = 0; i < maxLen; i++) {
    const lRow = leftData[i] || {};
    const rRow = rightData[i] || {};

    // 逐行比较，不考虑内容匹配
    if (JSON.stringify(lRow) !== JSON.stringify(rRow)) {
      diffObj[i] = { /* 差异信息 */ };
    }
  }

  return { leftData, rightData, diffObj, nullLines: {left: [], right: []} };
}
```

**但这会导致**：
- 无法检测插入和删除
- 大量误报差异
- 用户体验变差

## 总结

1. **Myers diff 按内容匹配，这是正确的行为**
2. **如果行 1000 匹配行 1020，说明它们内容相同**
3. **中间的 20 行差异是真实的插入/删除/修改**
4. **使用 debug-row-matching.js 工具验证具体情况**

## 相关文件

- `src/preload.js` - Diff 算法实现
- `src/utils/hash.js` - 行哈希函数
- `debug-row-matching.js` - 调试工具
- `test-diff-alignment.js` - 测试用例
- `test-why-1000-matches-1020.js` - 详细示例
