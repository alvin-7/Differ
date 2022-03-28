import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
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
  const [columns, setColumns] = useState([])
  const [data, setData] = useState([])
  const ipc = window.electronAPI.ipcRenderer
  if (first) {
    first = true
    ipc.invoke('ipc_excel_paths').then((excelPaths: string[]) => {
      console.log(excelPaths)
      if (excelPaths.length) {
        console.log('render', excelPaths)
        const workbook = window.electronAPI.readXlsx(excelPaths[0])
        console.log('exceljs sheet', workbook)
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
    </Row>
  );
}

export default TableDiff
