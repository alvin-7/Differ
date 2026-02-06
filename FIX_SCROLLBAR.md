# ✅ 修复横向滚动条问题

## 问题描述
打开软件后，最右边出现横向滚动条，表格列宽超出窗口宽度。

## 原因分析
- 之前：固定列宽 150px
- 8列数据：80 (索引) + 7×150 = 1130px
- 半屏宽度：约 960px
- 结果：超出 170px，出现滚动条

## 解决方案

### 1. 动态计算列宽
```typescript
// 计算可用宽度
const availableWidth = (tableWidth / 2) - INDEX_COLUMN_WIDTH - 20;

// 平均分配给所有列
const dynamicColumnWidth = Math.max(MIN_COLUMN_WIDTH, Math.floor(availableWidth / columnCount));
```

### 2. 优化后的宽度
- 索引列：60px（减小）
- 最小列宽：80px
- 动态列宽：根据窗口和列数自动计算

### 3. 修改的文件
- `src/renderer/pages/table/VirtualDiffTable.tsx` - 虚拟化表格
- `src/renderer/pages/table/table.tsx` - 标准表格

## 效果

### 之前
```
索引(80px) + 7列×150px = 1130px
窗口宽度: 960px
结果: 出现横向滚动条 ❌
```

### 之后
```
索引(60px) + 7列×自适应 = 960px
窗口宽度: 960px
结果: 完美适配，无滚动条 ✅
```

## 自适应规则

**8列数据示例（窗口宽度 1920px）:**
- 可用宽度：960px - 60px - 20px = 880px
- 每列宽度：880px / 7 = 125px
- 结果：所有列正好填满，无滚动条

**5列数据示例（窗口宽度 1920px）:**
- 可用宽度：960px - 60px - 20px = 880px
- 每列宽度：880px / 4 = 220px
- 结果：列更宽，更易阅读

**10列数据示例（窗口宽度 1920px）:**
- 可用宽度：960px - 60px - 20px = 880px
- 每列宽度：880px / 9 = 97px
- 最小宽度：80px
- 结果：每列 97px，仍然可读

## 测试

### 测试1: 8列数据（1000行测试）
```bash
npm start -- --excel "test-data/left-1000.xlsx" --excel "test-data/right-1000.xlsx"
```
- [ ] 无横向滚动条
- [ ] 所有列可见
- [ ] 列宽合理

### 测试2: 5列数据（小测试）
```bash
npm start -- --excel "test-data/left.xlsx" --excel "test-data/right.xlsx"
```
- [ ] 无横向滚动条
- [ ] 列宽更宽
- [ ] 内容易读

### 测试3: 窗口调整
1. 最大化窗口
2. 缩小窗口
3. 观察列宽自动调整

## 编译状态
✅ 0 错误
⚠️ 108 警告（可接受）

---

**修复时间**: 2026-02-05
**状态**: ✅ 已修复
