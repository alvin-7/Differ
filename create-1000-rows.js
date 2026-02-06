const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// 创建1000行测试数据
function createLargeTestExcel() {
  const leftData = [['ID', 'Name', 'Age', 'City', 'Department', 'Salary', 'Status', 'Email']];
  const rightData = [['ID', 'Name', 'Age', 'City', 'Department', 'Salary', 'Status', 'Email']];

  const cities = ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Hangzhou', 'Chengdu', 'Wuhan', 'Xian', 'Nanjing', 'Tianjin'];
  const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'IT', 'Support'];
  const statuses = ['Active', 'Inactive', 'Pending'];
  const firstNames = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack', 'Kate', 'Leo', 'Mary', 'Nick', 'Olivia', 'Peter', 'Quinn', 'Rose', 'Sam', 'Tom'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

  // 生成1000行数据
  for (let i = 1; i <= 1000; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
    const name = `${firstName} ${lastName}`;
    const age = 22 + (i % 40);
    const city = cities[i % cities.length];
    const department = departments[i % departments.length];
    const salary = 50000 + (i * 100);
    const status = statuses[i % statuses.length];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@company.com`;

    leftData.push([i, name, age, city, department, salary, status, email]);

    // 右侧数据 - 添加一些差异
    let rightRow;

    // 每10行有一个差异
    if (i % 10 === 0) {
      // 修改名字
      rightRow = [i, `${firstName} ${lastName} Jr.`, age, city, department, salary, status, email];
    } else if (i % 15 === 0) {
      // 修改年龄和工资
      rightRow = [i, name, age + 1, city, department, salary + 5000, status, email];
    } else if (i % 20 === 0) {
      // 修改城市和部门
      rightRow = [i, name, age, cities[(i + 1) % cities.length], departments[(i + 1) % departments.length], salary, status, email];
    } else if (i % 25 === 0) {
      // 修改状态
      rightRow = [i, name, age, city, department, salary, statuses[(i + 1) % statuses.length], email];
    } else if (i % 50 === 0) {
      // 跳过这行（删除）
      continue;
    } else if (i % 30 === 0) {
      // 修改多个字段
      rightRow = [i, `${firstName} ${lastName} Sr.`, age + 2, cities[(i + 2) % cities.length], department, salary + 10000, statuses[(i + 1) % statuses.length], email];
    } else {
      // 相同
      rightRow = [i, name, age, city, department, salary, status, email];
    }

    rightData.push(rightRow);
  }

  // 在右侧添加一些新行
  for (let i = 1001; i <= 1020; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
    const name = `${firstName} ${lastName}`;
    const age = 22 + (i % 40);
    const city = cities[i % cities.length];
    const department = departments[i % departments.length];
    const salary = 50000 + (i * 100);
    const status = statuses[i % statuses.length];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@company.com`;

    rightData.push([i, name, age, city, department, salary, status, email]);
  }

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
  const leftPath = path.join(testDir, 'left-1000.xlsx');
  const rightPath = path.join(testDir, 'right-1000.xlsx');

  XLSX.writeFile(leftWb, leftPath);
  XLSX.writeFile(rightWb, rightPath);

  console.log('✅ 1000行测试 Excel 文件创建成功！');
  console.log('📁 左侧文件:', leftPath);
  console.log('📁 右侧文件:', rightPath);
  console.log('');
  console.log('📊 数据统计:');
  console.log('  - 左侧: 1000 行数据');
  console.log('  - 右侧: 1020 行数据（包含20行新增）');
  console.log('');
  console.log('🔍 差异类型:');
  console.log('  - 每10行: 名字修改 (~100处)');
  console.log('  - 每15行: 年龄和工资修改 (~67处)');
  console.log('  - 每20行: 城市和部门修改 (~50处)');
  console.log('  - 每25行: 状态修改 (~40处)');
  console.log('  - 每30行: 多字段修改 (~33处)');
  console.log('  - 每50行: 删除 (~20处)');
  console.log('  - 新增: 20行');
  console.log('  - 预计总差异: ~330处');
  console.log('');
  console.log('🚀 启动命令:');
  console.log('npm start -- --excel "' + leftPath + '" --excel "' + rightPath + '"');

  return { leftPath, rightPath };
}

// 执行创建
try {
  const { leftPath, rightPath } = createLargeTestExcel();

  console.log('');
  console.log('='.repeat(80));
  console.log('快速启动:');
  console.log('='.repeat(80));
  console.log('npm start -- --excel "test-data/left-1000.xlsx" --excel "test-data/right-1000.xlsx"');
  console.log('='.repeat(80));
} catch (error) {
  console.error('❌ 创建测试文件失败:', error);
  process.exit(1);
}
