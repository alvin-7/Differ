const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// 创建测试数据
function createTestExcel() {
  // 左侧文件数据（旧版本）
  const leftData = [
    ['ID', 'Name', 'Age', 'City', 'Status'],
    [1, 'Alice', 25, 'Beijing', 'Active'],
    [2, 'Bob', 30, 'Shanghai', 'Active'],
    [3, 'Charlie', 35, 'Guangzhou', 'Inactive'],
    [4, 'David', 28, 'Shenzhen', 'Active'],
    [5, 'Eve', 32, 'Hangzhou', 'Active'],
    [6, 'Frank', 29, 'Chengdu', 'Active'],
    [7, 'Grace', 27, 'Wuhan', 'Inactive'],
    [8, 'Henry', 31, 'Xian', 'Active'],
    [9, 'Ivy', 26, 'Nanjing', 'Active'],
    [10, 'Jack', 33, 'Tianjin', 'Active'],
  ];

  // 右侧文件数据（新版本）- 包含各种差异
  const rightData = [
    ['ID', 'Name', 'Age', 'City', 'Status'],
    [1, 'Alice', 25, 'Beijing', 'Active'],           // 相同
    [2, 'Bob Smith', 30, 'Shanghai', 'Active'],      // Name 修改
    [3, 'Charlie', 36, 'Guangzhou', 'Active'],       // Age 和 Status 修改
    // [4, 'David', 28, 'Shenzhen', 'Active'],       // 删除这行
    [5, 'Eve', 32, 'Hangzhou City', 'Active'],       // City 修改
    [6, 'Frank', 29, 'Chengdu', 'Active'],           // 相同
    [7, 'Grace Wang', 27, 'Wuhan', 'Inactive'],      // Name 修改
    [8, 'Henry', 31, 'Xian', 'Active'],              // 相同
    [11, 'Kate', 24, 'Suzhou', 'Active'],            // 新增行
    [9, 'Ivy', 26, 'Nanjing', 'Active'],             // 相同
    [10, 'Jack', 33, 'Tianjin Beijing', 'Inactive'], // City 和 Status 修改
    [12, 'Leo', 28, 'Dalian', 'Active'],             // 新增行
  ];

  // 创建工作簿
  const leftWb = XLSX.utils.book_new();
  const rightWb = XLSX.utils.book_new();

  // 创建工作表
  const leftWs = XLSX.utils.aoa_to_sheet(leftData);
  const rightWs = XLSX.utils.aoa_to_sheet(rightData);

  // 添加工作表到工作簿
  XLSX.utils.book_append_sheet(leftWb, leftWs, 'Sheet1');
  XLSX.utils.book_append_sheet(rightWb, rightWs, 'Sheet1');

  // 确保目录存在
  const testDir = path.join(__dirname, 'test-data');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  // 写入文件
  const leftPath = path.join(testDir, 'left.xlsx');
  const rightPath = path.join(testDir, 'right.xlsx');

  XLSX.writeFile(leftWb, leftPath);
  XLSX.writeFile(rightWb, rightPath);

  console.log('✅ 测试 Excel 文件创建成功！');
  console.log('📁 左侧文件:', leftPath);
  console.log('📁 右侧文件:', rightPath);
  console.log('');
  console.log('📊 差异说明:');
  console.log('  - 第2行: Name 从 "Bob" 改为 "Bob Smith"');
  console.log('  - 第3行: Age 从 35 改为 36, Status 从 "Inactive" 改为 "Active"');
  console.log('  - 第4行: 被删除 (David)');
  console.log('  - 第5行: City 从 "Hangzhou" 改为 "Hangzhou City"');
  console.log('  - 第7行: Name 从 "Grace" 改为 "Grace Wang"');
  console.log('  - 第8行: 新增 (Kate)');
  console.log('  - 第10行: City 从 "Tianjin" 改为 "Tianjin Beijing", Status 从 "Active" 改为 "Inactive"');
  console.log('  - 第12行: 新增 (Leo)');
  console.log('');
  console.log('🚀 现在可以运行: npm start -- --excel "' + leftPath + '" --excel "' + rightPath + '"');

  return { leftPath, rightPath };
}

// 执行创建
try {
  const { leftPath, rightPath } = createTestExcel();

  // 输出启动命令
  console.log('');
  console.log('='.repeat(80));
  console.log('启动命令:');
  console.log('='.repeat(80));
  console.log('npm start -- --excel "' + leftPath + '" --excel "' + rightPath + '"');
  console.log('='.repeat(80));
} catch (error) {
  console.error('❌ 创建测试文件失败:', error);
  process.exit(1);
}
