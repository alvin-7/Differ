import * as React from 'react';
import { Layout, Menu  } from 'antd';
import TableDiff from './pages/table/table';

import { useAppSelector, useAppDispatch } from './redux/hooks';
import type { RootState } from './redux/store';
import { setSheet } from './redux/setter/layoutSetter'

const { Header, Content, Footer } = Layout;

import './App.less';

const App = () => {
  const sheets = useAppSelector((state: RootState) => state.setter.sheets)
  const sheet = useAppSelector((state: RootState) => state.setter.sheet)
  const dispatch = useAppDispatch()

  return (
    <Layout style={{minHeight: '100vh'}}>
      <Header className="header">
        <div className="logo" />
        {
          sheets.length ? 
          <Menu theme="dark" mode="horizontal" defaultSelectedKeys={[sheet]} onClick={(info)=>{dispatch(setSheet(info.key))}}>
            {
              sheets.map((value) => {
                return <Menu.Item key={value}>{value}</Menu.Item>
              })
            }
          </Menu> : null
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
