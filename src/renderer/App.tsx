import * as React from 'react';
import { Button, Layout, Menu, Space, Row, Col } from 'antd';
import TableDiff from './pages/table/table';

import { useAppSelector, useAppDispatch } from './redux/hooks';
import type { RootState } from './redux/store';
import { setSheet as redux_setSheet, setDiffIdx as redux_setDiffIdx, setDiffIdx } from './redux/setter/layoutSetter'

const { Header, Content, Footer } = Layout;

import './App.less';

const App = () => {
  const redux_sheets = useAppSelector((state: RootState) => state.setter.sheets)
  const redux_sheet = useAppSelector((state: RootState) => state.setter.sheet)
  const redux_diffIdx = useAppSelector((state: RootState) => state.setter.diffIdx)
  const redux_diffLen = useAppSelector((state: RootState) => state.setter.diffLen)
  const dispatch = useAppDispatch()

  const onClickDiffScroll = function(pre=true) {
    return () => {
      console.log('xxxxxxx', redux_diffIdx, redux_diffLen)
      const idx = pre ? redux_diffIdx - 1 : redux_diffIdx + 1
      if (idx < -1)  return
      if (idx > redux_diffLen)  return
      dispatch(setDiffIdx(idx))
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="header">
        <div className="logo" />
        {
          redux_sheets.length ?
          <Row wrap={false} justify="space-between">
            <Col span={16}>
              <Menu className='menu' theme="dark" mode="horizontal" defaultSelectedKeys={[redux_sheet]} onClick={(info) => { dispatch(redux_setSheet(info.key)) }}>
                {
                  redux_sheets.map((value) => {
                    return <Menu.Item key={value}>{value}</Menu.Item>
                  })
                }
              </Menu>
            </Col>
            <Col>
              <Button type="primary" onClick={onClickDiffScroll(true)}>上一个Diff</Button>
              &nbsp;&nbsp;
              <Button type="primary" onClick={onClickDiffScroll(false)}>下一个Diff</Button>
            </Col>
          </Row>
            : null
        }
      </Header>
      <Content>
        <Layout className="site-layout-background" style={{ padding: '24px 0' }}>
          <Content style={{ padding: '0 24px', minHeight: 280 }}>
            {/* <CodeDiffer/> */}
            <TableDiff></TableDiff>
          </Content>
        </Layout>
      </Content>
      <Footer style={{ textAlign: 'center' }}>Ant Design ©2018 Created by Ant UED</Footer>
    </Layout>
  );
};

export default App;
