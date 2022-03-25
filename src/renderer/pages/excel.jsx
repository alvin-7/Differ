import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Table } from 'antd';
import { Row, Col, Divider } from 'antd';
import './excel.less'

const columns = [
  {
    title: 'Key',
    dataIndex: 'key',
  },
  {
    title: 'Name',
    dataIndex: 'name',
    // render: function (text, now, index) {
    //   console.log(text, now, index)
    //   return <a>{text}</a>
    // }
  },
  {
    title: 'Chinese Score',
    dataIndex: 'chinese',
    // sorter: {
    //   compare: (a, b) => a.chinese - b.chinese,
    //   multiple: 3,
    // },
  },
  {
    title: 'Math Score',
    dataIndex: 'math',
    sorter: {
      compare: (a, b) => a.math - b.math,
      multiple: 2,
    },
  },
  {
    title: 'English Score',
    dataIndex: 'english',
    sorter: {
      compare: (a, b) => a.english - b.english,
      multiple: 1,
    },
  },
];

const data = [
  {
    key: '1',
    name: 'John Brown',
    chinese: 98,
    math: 60,
    english: 70,
  },
  {
    key: '2',
    name: 'Jim Green',
    chinese: 98,
    math: 66,
    english: 89,
  },
  {
    key: '3',
    name: 'Joe Black',
    chinese: 98,
    math: 90,
    english: 70,
  },
  {
    key: '4',
    name: 'Jim Red',
    chinese: 88,
    math: 99,
    english: 89,
  },
];

function onChange(pagination, filters, sorter, extra) {
  console.log('params', pagination, filters, sorter, extra);
}


const Home = () => {
  return (
    <>
      <Divider orientation="left">Excel Differ</Divider>
      <Row gutter={10} wrap={false}>
        <Col span={12}>
          <Table className='leftTable' columns={columns} dataSource={data} onChange={onChange} />,
        </Col>
        {/* <Col span={1}></Col> */}
        <Col span={12} >
          <Table className='rightTable' columns={columns} dataSource={data} onChange={onChange} />
        </Col>
      </Row>
    </>
  )
}

export default Home
