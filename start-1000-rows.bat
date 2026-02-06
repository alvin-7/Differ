@echo off
echo ========================================
echo   Differ - Excel 对比工具
echo   1000行性能测试
echo ========================================
echo.
echo 正在启动应用...
echo.
echo 测试文件:
echo   左侧: test-data\left-1000.xlsx (1000行)
echo   右侧: test-data\right-1000.xlsx (1020行)
echo.
echo 预期差异: ~330处
echo   - 名字修改: ~100处
echo   - 年龄/工资修改: ~67处
echo   - 城市/部门修改: ~50处
echo   - 状态修改: ~40处
echo   - 多字段修改: ~33处
echo   - 删除: ~20处
echo   - 新增: 20行
echo.
echo 性能测试要点:
echo   - 虚拟化渲染是否流畅
echo   - 滚动是否卡顿
echo   - Diff 导航是否快速
echo   - 内存占用是否合理
echo.

cd /d "%~dp0"
npm start -- --excel "test-data/left-1000.xlsx" --excel "test-data/right-1000.xlsx"
