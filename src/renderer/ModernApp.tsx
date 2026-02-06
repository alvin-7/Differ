import * as React from 'react';
import { Button, Select, Input, Switch, Tabs } from './components/ModernUI';
import './components/ModernApp.less';
import TableDiff, { TableProps } from './pages/table/table';
import VirtualDiffTable from './pages/table/VirtualDiffTable';

import { useAppSelector, useAppDispatch } from './redux/hooks';
import type { RootState } from './redux/store';
import {
  setSheet as redux_setSheet,
  setDiffIdx as redux_setDiffIdx,
} from './redux/setter/layoutSetter';

const ModernApp = () => {
  const redux_sheets = useAppSelector((state: RootState) => state.setter.sheets);
  const redux_sheet = useAppSelector((state: RootState) => state.setter.sheet);
  const redux_diffIdx = useAppSelector((state: RootState) => state.setter.diffIdx);
  const redux_diffKeys = useAppSelector((state: RootState) => state.setter.diffKeys);
  const dispatch = useAppDispatch();

  const [tableState, setTableState] = React.useState({} as TableProps);
  const [contextN, setContextN] = React.useState<number>(3);
  const [showContextOnly, setShowContextOnly] = React.useState<boolean>(false);
  const [expandIdx, setExpandIdx] = React.useState<number>(-1);
  const [useVirtualTable, setUseVirtualTable] = React.useState<boolean>(true);

  React.useEffect(() => {
    const ipc = window.electronAPI.ipcRenderer;
    ipc.invoke('ipc_excel_paths').then((excelPaths: string[]) => {
      if (excelPaths.length) {
        const leftDatas = window.electronAPI.readXlsx(excelPaths[0]);
        const rightDatas = window.electronAPI.readXlsx(excelPaths[1]);
        setTableState({
          lTitle: excelPaths[0],
          rTitle: excelPaths[1],
          lDatas: leftDatas,
          rDatas: rightDatas,
          contextN,
          showContextOnly,
          expandIdx,
        });
      }
    });
  }, []);

  const onClickDiffScroll = function (pre = true) {
    return () => {
      let line = -1;
      for (const l of redux_diffKeys) {
        if (pre) {
          if (l < redux_diffIdx) line = l;
          else break;
        } else {
          if (l > redux_diffIdx) {
            line = l;
            break;
          }
        }
      }
      if (line !== -1) dispatch(redux_setDiffIdx(line));
    };
  };

  function handleOptionChange(val: number) {
    dispatch(redux_setDiffIdx(val));
  }

  function handleExpandCurrent() {
    setExpandIdx(redux_diffIdx);
    setTableState((prev) => ({ ...prev, expandIdx: redux_diffIdx }));
  }

  function handleToggleContext(checked: boolean) {
    setShowContextOnly(checked);
    setTableState((prev) => ({ ...prev, showContextOnly: checked }));
  }

  function handleContextNChange(val: number) {
    const n = Number(val) || 0;
    setContextN(n);
    setTableState((prev) => ({ ...prev, contextN: n }));
  }

  function handleShowAll() {
    setShowContextOnly(false);
    setTableState((prev) => ({ ...prev, showContextOnly: false }));
  }

  // 计算统计信息
  const stats = React.useMemo(() => {
    const totalDiffs = redux_diffKeys.length;
    // 这里可以进一步分析 added/removed/modified
    return {
      total: totalDiffs,
      added: 0, // 需要从 diffObj 中计算
      removed: 0,
      modified: totalDiffs,
    };
  }, [redux_diffKeys]);

  return (
    <div className="modern-app">
      {/* 现代化头部 */}
      <header className="modern-header">
        <div className="header-content">
          {/* Sheet 标签 */}
          {redux_sheets.length > 0 && (
            <div className="header-section tabs">
              <Tabs
                tabs={redux_sheets.map((sheet) => ({ key: sheet, label: sheet }))}
                activeKey={redux_sheet}
                onChange={(key) => dispatch(redux_setSheet(key))}
              />
            </div>
          )}

          {/* 控制按钮 */}
          {redux_diffKeys.length > 0 && (
            <div className="header-section controls">
              <Button variant="primary" onClick={onClickDiffScroll(true)}>
                ← 上一个
              </Button>

              <Select
                value={redux_diffIdx}
                onChange={handleOptionChange}
                options={redux_diffKeys.map((val) => ({
                  value: val,
                  label: `行 ${val}`,
                }))}
                style={{ width: '120px' }}
              />

              <Button variant="primary" onClick={onClickDiffScroll(false)}>
                下一个 →
              </Button>

              <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />

              <Switch
                checked={showContextOnly}
                onChange={handleToggleContext}
                label="上下文模式"
              />

              <Input
                type="number"
                value={contextN}
                onChange={handleContextNChange}
                min={0}
                max={100}
                placeholder="上下文行数"
              />

              <Button variant="secondary" onClick={handleExpandCurrent}>
                展开当前
              </Button>

              <Button variant="secondary" onClick={handleShowAll}>
                显示全部
              </Button>

              <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />

              <Switch
                checked={useVirtualTable}
                onChange={setUseVirtualTable}
                label="虚拟化"
              />
            </div>
          )}
        </div>
      </header>

      {/* 统计信息卡片 */}
      {redux_diffKeys.length > 0 && (
        <div className="modern-content">
          <div className="stats-card">
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">总差异</div>
                <div className="stat-value">{stats.total}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">新增</div>
                <div className="stat-value added">{stats.added}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">删除</div>
                <div className="stat-value removed">{stats.removed}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">修改</div>
                <div className="stat-value modified">{stats.modified}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 表格内容 */}
      <div className="modern-content" style={{ paddingTop: 0 }}>
        {tableState.lTitle ? (
          useVirtualTable ? (
            <VirtualDiffTable
              lTitle={tableState.lTitle}
              rTitle={tableState.rTitle}
              lDatas={tableState.lDatas}
              rDatas={tableState.rDatas}
              contextN={tableState.contextN}
              showContextOnly={tableState.showContextOnly}
              expandIdx={tableState.expandIdx}
            />
          ) : (
            <TableDiff
              lTitle={tableState.lTitle}
              rTitle={tableState.rTitle}
              lDatas={tableState.lDatas}
              rDatas={tableState.rDatas}
              contextN={tableState.contextN}
              showContextOnly={tableState.showContextOnly}
              expandIdx={tableState.expandIdx}
            />
          )
        ) : (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
            <h2>欢迎使用 Excel Diff 工具</h2>
            <p>请通过命令行参数加载 Excel 文件</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernApp;
