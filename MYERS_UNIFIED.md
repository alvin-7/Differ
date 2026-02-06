# 统一使用 Myers Diff 算法

## 修改日期
2026-02-05

## 修改内容

### 之前的实现
- **行级对比**: 使用 Myers diff 算法（通过 `diff` 库的 `diffArrays`）
- **单元格级对比**: 使用 `deep-object-diff` 库（不是 Myers diff）

### 修改后的实现
- **行级对比**: 使用 Myers diff 算法（`diffArrays`）✅
- **单元格级对比**: 使用 Myers diff 算法（`diffWords`）✅

## 技术细节

### 1. 移除的依赖
```javascript
// 移除
import { diff } from 'deep-object-diff';
```

### 2. 新增的导入
```javascript
// 新增 diffWords
import { diffArrays, diffWords } from 'diff';
```

### 3. 单元格对比逻辑

**之前 (使用 deep-object-diff):**
```javascript
for (const line of diffLines) {
  const data = {}
  data[line] = diff(leftData[line], rightData[line])
  Object.assign(diffObj, data);
}
```

**修改后 (使用 Myers diff):**
```javascript
for (const line of diffLines) {
  const leftRow = leftData[line];
  const rightRow = rightData[line];

  // 获取所有列
  const allColumns = new Set([
    ...Object.keys(leftRow),
    ...Object.keys(rightRow)
  ]);

  const rowDiff = {};
  for (const col of allColumns) {
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
```

## 修改的文件

1. **src/preload.js**
   - 移除 `deep-object-diff` 导入
   - 添加 `diffWords` 导入
   - 重写单元格对比逻辑

2. **src/workers/diffWorker.ts**
   - 同步修改 Worker 中的实现
   - 保持一致性

## Myers Diff 算法说明

### diffArrays (行级对比)
- 对比两个数组
- 找出新增、删除、相同的行
- 时间复杂度: O(N*D)，其中 D 是差异数量

### diffWords (单元格对比)
- 对比两个字符串
- 按单词边界分割
- 找出新增、删除、相同的单词
- 时间复杂度: O(N*D)

## 数据结构变化

### 之前的 diffObj 结构
```javascript
{
  "5": {
    "A": "changed_value",
    "B": "another_value"
  }
}
```

### 修改后的 diffObj 结构
```javascript
{
  "5": {
    "A": {
      oldValue: "old text",
      newValue: "new text",
      diff: [
        { value: "old", removed: true },
        { value: "new", added: true },
        { value: " text", count: 1 }
      ]
    },
    "B": {
      oldValue: "value1",
      newValue: "value2",
      diff: [
        { value: "value1", removed: true },
        { value: "value2", added: true }
      ]
    }
  }
}
```

## 优势

1. **统一算法**: 所有对比都使用 Myers diff，算法一致性更好
2. **更详细的差异信息**: `diffWords` 提供了详细的单词级差异
3. **移除外部依赖**: 不再依赖 `deep-object-diff` 库
4. **更好的性能**: Myers diff 算法经过高度优化

## 兼容性

### UI 层需要适配

由于 `diffObj` 的数据结构发生了变化，UI 层需要相应调整：

**之前的判断方式:**
```javascript
if (key in diff && diff[key] && rowKey in diff[key]) {
  // 单元格有差异
}
```

**修改后的判断方式:**
```javascript
if (key in diff && diff[key] && rowKey in diff[key]) {
  const cellDiff = diff[key][rowKey];
  // cellDiff.oldValue - 旧值
  // cellDiff.newValue - 新值
  // cellDiff.diff - Myers diff 详细结果
}
```

## 测试建议

1. **基本功能测试**
   - 加载两个 Excel 文件
   - 验证差异高亮显示正确
   - 测试行级和单元格级差异

2. **性能测试**
   - 测试大文件 (10,000+ 行)
   - 对比性能是否有变化

3. **边界情况**
   - 空单元格
   - 特殊字符
   - 长文本

## 回滚方案

如果需要回滚到之前的实现：

```bash
git checkout HEAD~1 src/preload.js
git checkout HEAD~1 src/workers/diffWorker.ts
npm install deep-object-diff
```

## 总结

✅ **完全统一使用 Myers diff 算法**
- 行级对比: `diffArrays` (Myers diff)
- 单元格对比: `diffWords` (Myers diff)

✅ **移除了 deep-object-diff 依赖**

✅ **提供更详细的差异信息**

✅ **编译通过，0 错误**
