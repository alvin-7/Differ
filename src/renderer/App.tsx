import * as React from 'react';
import { Button, Layout, Menu, Row, Col } from 'antd';
import TableDiff, { TableProps } from './pages/table/table';

import { useAppSelector, useAppDispatch } from './redux/hooks';
import type { RootState } from './redux/store';
import {
  setSheet as redux_setSheet,
  setDiffIdx as redux_setDiffIdx,
} from './redux/setter/layoutSetter';

const { Header, Content /*Footer*/ } = Layout;

import './App.less';

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
      console.error('curline', redux_diffKeys, line)
      if (line !== -1) dispatch(redux_setDiffIdx(line));
    };
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="header">
        <div className="logo" />
        {redux_sheets.length ? (
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
              <Button type="primary" onClick={onClickDiffScroll(true)}>
                Pre Diff
              </Button>
              &nbsp;&nbsp;
              <Button type="primary" onClick={onClickDiffScroll(false)}>
                Next Diff
              </Button>
            </Col>
          </Row>
        ) : null}
      </Header>
      <Content>
        <Layout
          className="site-layout-background"
          style={{ padding: '24px 0' }}
        >
          <Content style={{ padding: '0 24px', minHeight: 280 }}>
            {tableState.lTitle ? (
              <TableDiff
                lTitle={tableState.lTitle}
                rTitle={tableState.rTitle}
                lDatas={tableState.lDatas}
                rDatas={tableState.rDatas}
              />
            ) : null}
          </Content>
        </Layout>
      </Content>
      {/* <Footer style={{ textAlign: 'center' }}>Ant Design ©2018 Created by Ant UED</Footer> */}
    </Layout>
  );
};

export default App;
