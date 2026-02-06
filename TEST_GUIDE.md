# 测试说明 - Myers Diff 统一实现

## 测试文件位置

- **左侧文件**: `test-data/left.xlsx` (旧版本)
- **右侧文件**: `test-data/right.xlsx` (新版本)

## 启动命令

```bash
npm start -- --excel "test-data/left.xlsx" --excel "test-data/right.xlsx"
```

## 测试数据说明

### 左侧文件 (10行数据)
```
ID | Name    | Age | City      | Status
1  | Alice   | 25  | Beijing   | Active
2  | Bob     | 30  | Shanghai  | Active
3  | Charlie | 35  | Guangzhou | Inactive
4  | David   | 28  | Shenzhen  | Active
5  | Eve     | 32  | Hangzhou  | Active
6  | Frank   | 29  | Chengdu   | Active
7  | Grace   | 27  | Wuhan     | Inactive
8  | Henry   | 31  | Xian      | Active
9  | Ivy     | 26  | Nanjing   | Active
10 | Jack    | 33  | Tianjin   | Active
```

### 右侧文件 (11行数据)
```
ID | Name       | Age | City            | Status
1  | Alice      | 25  | Beijing         | Active
2  | Bob Smith  | 30  | Shanghai        | Active      ← Name 修改
3  | Charlie    | 36  | Guangzhou       | Active      ← Age 和 Status 修改
   | (David 被删除)                                     ← 第4行删除
5  | Eve        | 32  | Hangzhou City   | Active      ← City 修改
6  | Frank      | 29  | Chengdu         | Active
7  | Grace Wang | 27  | Wuhan           | Inactive    ← Name 修改
8  | Henry      | 31  | Xian            | Active
11 | Kate       | 24  | Suzhou          | Active      ← 新增行
9  | Ivy        | 26  | Nanjing         | Active
10 | Jack       | 33  | Tianjin Beijing | Inactive    ← City 和 Status 修改
12 | Leo        | 28  | Dalian          | Active      ← 新增行
```

## 预期差异详情

### 1. 第2行 - 单元格修改
- **列**: Name
- **旧值**: "Bob"
- **新值**: "Bob Smith"
- **Myers diff 结果**:
  ```javascript
  {
    oldValue: "Bob",
    newValue: "Bob Smith",
    diff: [
      { value: "Bob", count: 1 },
      { value: " Smith", added: true }
    ]
  }
  ```

### 2. 第3行 - 多个单元格修改
- **列1**: Age
  - 旧值: "35"
  - 新值: "36"
- **列2**: Status
  - 旧值: "Inactive"
  - 新值: "Active"

### 3. 第4行 - 整行删除
- **David** 这一行被完全删除
- 应该显示为红色背景（diff-row-delete）

### 4. 第5行 - 单元格修改
- **列**: City
- **旧值**: "Hangzhou"
- **新值**: "Hangzhou City"
- **Myers diff 结果**:
  ```javascript
  {
    oldValue: "Hangzhou",
    newValue: "Hangzhou City",
    diff: [
      { value: "Hangzhou", count: 1 },
      { value: " City", added: true }
    ]
  }
  ```

### 5. 第7行 - 单元格修改
- **列**: Name
- **旧值**: "Grace"
- **新值**: "Grace Wang"

### 6. 第8行 - 整行新增
- **Kate** 这一行是新增的
- 应该显示为黄色背景（diff-row-add）

### 7. 第10行 - 多个单元格修改
- **列1**: City
  - 旧值: "Tianjin"
  - 新值: "Tianjin Beijing"
- **列2**: Status
  - 旧值: "Active"
  - 新值: "Inactive"

### 8. 第12行 - 整行新增
- **Leo** 这一行是新增的
- 应该显示为黄色背景（diff-row-add）

## 检查要点

### 1. Myers Diff 算法验证

**行级对比 (diffArrays):**
- [ ] 正确识别删除的行（David）
- [ ] 正确识别新增的行（Kate, Leo）
- [ ] 正确识别修改的行

**单元格对比 (diffWords):**
- [ ] 单元格差异正确标记
- [ ] diffObj 包含详细的 Myers diff 结果
- [ ] oldValue 和 newValue 正确
- [ ] diff 数组包含 added/removed 标记

### 2. UI 显示验证

**颜色高亮:**
- [ ] 删除行: 红色背景 (diff-row-delete)
- [ ] 新增行: 黄色背景 (diff-row-add)
- [ ] 修改行: 蓝色背景 (diff-row-left / diff-row-right)
- [ ] 修改单元格: 橙色/黄色背景 (diff-row-left-item / diff-row-right-item)
- [ ] 普通单元格: 白色背景 (diff-row-common-item)

**Diff 导航:**
- [ ] Pre Diff / Next Diff 按钮正常工作
- [ ] Diff 下拉框显示所有差异行号
- [ ] 点击跳转到对应行

**虚拟化渲染:**
- [ ] 滚动流畅（60 FPS）
- [ ] 只渲染可见行
- [ ] 左右表格同步滚动
- [ ] 切换"虚拟化"/"标准"模式正常

**上下文折叠:**
- [ ] 开启"上下文模式"后只显示差异及其上下文
- [ ] 调整上下文行数正常工作
- [ ] "展开当前段"按钮正常
- [ ] "显示全部"按钮正常
- [ ] 显示隐藏行数统计

### 3. 数据结构验证

打开浏览器开发者工具（F12），在 Console 中检查：

```javascript
// 查看 diffObj 结构
console.log(window.diffObj);

// 应该看到类似这样的结构：
{
  "2": {
    "Name": {
      oldValue: "Bob",
      newValue: "Bob Smith",
      diff: [
        { value: "Bob", count: 1 },
        { value: " Smith", added: true }
      ]
    }
  },
  "3": {
    "Age": {
      oldValue: "35",
      newValue: "36",
      diff: [...]
    },
    "Status": {
      oldValue: "Inactive",
      newValue: "Active",
      diff: [...]
    }
  }
}
```

### 4. 性能验证

- [ ] 初始加载时间 < 1秒
- [ ] 滚动流畅无卡顿
- [ ] 切换 sheet 响应快速
- [ ] 内存占用合理

## 常见问题排查

### 问题1: 差异没有正确高亮
- 检查 diffObj 是否正确生成
- 检查 CSS 类名是否正确应用
- 查看浏览器控制台是否有错误

### 问题2: 虚拟化模式不工作
- 确认 rc-resize-observer 已安装
- 检查 react-window 是否正常加载
- 查看控制台错误信息

### 问题3: Myers diff 结果不正确
- 检查 diffWords 是否正确导入
- 验证 preload.js 中的逻辑
- 查看 diffObj 的实际内容

## 测试通过标准

✅ **所有差异正确识别**
✅ **UI 高亮显示准确**
✅ **Myers diff 数据结构正确**
✅ **虚拟化渲染流畅**
✅ **所有功能正常工作**

## 下一步

测试通过后，可以：
1. 测试更大的文件（1000+ 行）
2. 测试更复杂的差异场景
3. 性能压力测试
4. 用户验收测试

---

**测试日期**: 2026-02-05
**版本**: 0.2.2 + Myers Diff 统一实现
