import React, { Dispatch, SetStateAction, useEffect, useState, useRef, useLayoutEffect } from "react";
import { Table, Row, Col } from 'antd';
import { ColumnsType } from 'antd/es/table';


const columns: ColumnsType = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    width: 100,
    fixed: 'left',
    filters: [
      {
        text: 'Joe',
        value: 'Joe',
      },
      {
        text: 'John',
        value: 'John',
      },
    ],
    onFilter: (value: string | number | boolean, record: any) => record.name.indexOf(value) === 0,
  },
  {
    title: 'Other',
    children: [
      {
        title: 'Age',
        dataIndex: 'age',
        key: 'age',
        width: 150,
        // sorter: (a: any, b: any) => a.age - b.age,
      },
      {
        title: 'Address',
        children: [
          {
            title: 'Street',
            dataIndex: 'street',
            key: 'street',
            width: 150,
          },
          {
            title: 'Block',
            children: [
              {
                title: 'Building',
                dataIndex: 'building',
                key: 'building',
                width: 100,
              },
              {
                title: 'Door No.',
                dataIndex: 'number',
                key: 'number',
                width: 100,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'Company',
    children: [
      {
        title: 'Company Address',
        dataIndex: 'companyAddress',
        key: 'companyAddress',
        width: 200,
      },
      {
        title: 'Company Name',
        dataIndex: 'companyName',
        key: 'companyName',
      },
    ],
  },
  {
    title: 'Gender',
    dataIndex: 'gender',
    key: 'gender',
    width: 80,
    fixed: 'right',
  },
];

const data: object[] = [];
for (let i = 0; i < 100; i++) {
  data.push({
    key: i,
    name: 'John Brown',
    age: i + 1,
    street: 'Lake Park',
    building: 'C',
    number: 2035,
    companyAddress: 'Lake Street 42',
    companyName: 'SoftLake Co',
    gender: 'M',
  });
}

let first = true

const TableDiff = () => {
  const listHeight = useRef<HTMLHeadingElement>(null)
  const [columns, setColumns] = useState([])
  const [data, setData] = useState([])

  useLayoutEffect(() => {
    console.log(listHeight?.current?.clientHeight)
  })

  if (first) {
    first = false 
    const ipc = window.electronAPI.ipcRenderer
    ipc.invoke('ipc_excel_paths').then((excelPaths: string[]) => {
      console.log(excelPaths)
      if (excelPaths.length) {
        console.log('render', excelPaths)
        const datas = window.electronAPI.readXlsx(excelPaths[0])
        const c: {[key: string]: {[key:string]: string|number}} = {}
        const d = []
        const sheets = Object.keys(datas)
        for (const data of datas[sheets[0]]) {
          const keys = Object.keys(data)
          const dItem: {[key:string]: string|number} = {}
          for (const k of keys) {
            dItem[k] = data[k]
            if (k in c) continue
            c[k] = {
              title: k,
              dataIndex: k,
              key: k,
              fixed: 'left'
            }
          }
          d.push(dItem)
        }
        console.log('exceljs sheet', datas)
        console.log('xxx', c)
        console.log('yyy', d)
        setColumns(Object.values(c))
        setData(d)
      }
    })
  }
  return (
    <Row>
      <Col span={12}>
        <Table
          columns={columns}
          dataSource={data}
          bordered
          size="middle"
          scroll={{ x: 'calc(50%)', y: 340 }}
          tableLayout="fixed"
        ></Table>
      </Col>
      <Col span={12} ref={listHeight}>
        <Table
          columns={columns}
          dataSource={data}
          bordered
          size="middle"
          scroll={{ x: 'calc(50%)', y: listHeight?.current?.clientHeight | 340 }}
          tableLayout="fixed"
        ></Table>
      </Col>
    </Row>
  );
}

export default TableDiff
