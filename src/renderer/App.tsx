import * as React from 'react';
import { Button, Layout, Menu, Row, Col, Select, InputNumber, Switch } from 'antd';
import TableDiff, { TableProps } from './pages/table/table';
import VirtualDiffTable from './pages/table/VirtualDiffTable';
const { Option } = Select;

import { useAppSelector, useAppDispatch } from './redux/hooks';
import type { RootState } from './redux/store';
import {
  setSheet as redux_setSheet,
  setDiffIdx as redux_setDiffIdx,
} from './redux/setter/layoutSetter';

const { Header, Content /*Footer*/ } = Layout;

import './App.less';

const DiffButtonWidth = 90

const App = () => {
  const redux_sheets = useAppSelector(
    (state: RootState) => state.setter.sheets
  );
  const redux_sheet = useAppSelector((state: RootState) => state.setter.sheet);
  const redux_diffIdx = useAppSelector(
    (state: RootState) => state.setter.diffIdx
  );
  const redux_diffKeys = useAppSelector(
    (state: RootState) => state.setter.diffKeys
  );
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
    setTableState(prev => ({ ...prev, expandIdx: redux_diffIdx }));
  }
  function handleToggleContext(checked: boolean) {
    setShowContextOnly(checked);
    setTableState(prev => ({ ...prev, showContextOnly: checked }));
  }
  function handleContextNChange(val: number) {
    const n = Number(val) || 0;
    setContextN(n);
    setTableState(prev => ({ ...prev, contextN: n }));
  }
  function handleShowAll() {
    setShowContextOnly(false);
    setTableState(prev => ({ ...prev, showContextOnly: false }));
  }

  return (
    <Layout style={{ minHeight: '100vh', height: '100vh', overflow: 'hidden' }}>
      <Header className="header">
        <div className="logo" />
        {redux_sheets.length && redux_diffKeys.length ? (
          <Row wrap={false} justify="space-between">
            <Col span={16}>
              <Menu
                className="menu"
                theme="dark"
                mode="horizontal"
                defaultSelectedKeys={[redux_sheet]}
                onClick={(info) => {
                  dispatch(redux_setSheet(info.key));
                }}
              >
                {redux_sheets.map((value) => {
                  return <Menu.Item key={value}>{value}</Menu.Item>;
                })}
              </Menu>
            </Col>
            <Col>
              <Button type="primary" style={{ width: DiffButtonWidth }} onClick={onClickDiffScroll(true)}>
                Pre Diff
              </Button>
              <Select defaultValue={redux_diffIdx} value={redux_diffIdx} style={{ width: 70 }} onChange={handleOptionChange}>
                { redux_diffKeys.map((val: number) => (
                    <Option key={val} value={val}>{val}</Option>
                  ))
                }
              </Select>
              <Button type="primary" style={{ width: DiffButtonWidth }} onClick={onClickDiffScroll(false)}>
                Next Diff
              </Button>
              <Switch checked={showContextOnly} onChange={handleToggleContext} style={{ marginLeft: 12 }} />
              <InputNumber min={0} max={100} value={contextN} onChange={handleContextNChange} style={{ width: 80, marginLeft: 8 }} />
              <Button onClick={handleExpandCurrent} style={{ marginLeft: 8 }}>
                展开当前段
              </Button>
              <Button onClick={handleShowAll} style={{ marginLeft: 8 }}>
                显示全部
              </Button>
              <Switch
                checked={useVirtualTable}
                onChange={setUseVirtualTable}
                style={{ marginLeft: 12 }}
                checkedChildren="虚拟化"
                unCheckedChildren="标准"
              />
            </Col>
          </Row>
        ) : null}
      </Header>
      <Content style={{ overflow: 'hidden' }}>
        <Layout
          className="site-layout-background"
          style={{ padding: '24px 0', overflow: 'hidden' }}
        >
          <Content style={{ padding: '0 24px', minHeight: 280, overflow: 'hidden' }}>
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
            ) : null}
          </Content>
        </Layout>
      </Content>
      {/* <Footer style={{ textAlign: 'center' }}>Ant Design ©2018 Created by Ant UED</Footer> */}
    </Layout>
  );
};

export default App;
