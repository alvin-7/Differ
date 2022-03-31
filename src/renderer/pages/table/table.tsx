// import React, { Dispatch, SetStateAction, useEffect, useState, useRef, useLayoutEffect } from "react";
import { Row, Col, Table } from 'antd';
import React, { useState, useEffect } from 'react';
import './styles.less'

/**
 * 获取第一个表格的可视化高度
 * @param {number} extraHeight 额外的高度(表格底部的内容高度 Number类型,默认为74) 
 * @param {reactRef} ref Table所在的组件的ref
 */
function getTableScroll({ extraHeight, ref }: {[key:string]: any}={}) {
  if (typeof extraHeight == "undefined") {
    //  默认底部分页64 + 边距10
    extraHeight = 74 + 50
  }
  let tHeader = null
  if (ref && ref.current) {
    tHeader = ref.current.getElementsByClassName("ant-table-thead")[0]
  } else {
    tHeader = document.getElementsByClassName("ant-table-thead")[0]
  }
  //表格内容距离顶部的距离
  let tHeaderBottom = 0
  if (tHeader) {
    tHeaderBottom = tHeader.getBoundingClientRect().bottom
  }

  // 窗体高度-表格内容顶部的高度-表格内容底部的高度
  // let height = document.body.clientHeight - tHeaderBottom - extraHeight
  const height = `calc(100vh - ${tHeaderBottom + extraHeight}px)`
  // 空数据的时候表格高度保持不变,暂无数据提示文本图片居中
  if (ref && ref.current) {
    const placeholder = ref.current.getElementsByClassName('ant-table-placeholder')[0]
    if (placeholder) {
      placeholder.style.height = height
      placeholder.style.display = "flex"
      placeholder.style.alignItems = "center"
      placeholder.style.justifyContent = "center"
    }
  }
  return height
}

function setExcelData(diff: any, datas: any[], setColumns: React.Dispatch<React.SetStateAction<any[]>>, setData: React.Dispatch<React.SetStateAction<any[]>>, left=true) {
  const columns: {[key: string]: {[key:string]: any}} = {}
  const data = []
  for (let i=1; i<datas.length; i++) { 
    const itemD = datas[i]
    const keys = Object.keys(itemD)
    const dItem: {[key:string]: string|number} = {}
    for (const k of keys) {
      const cArr = itemD[k].match(/[^x00-xff]/ig);
      const width = ((itemD[k]+'').length + (cArr ? cArr.length : 0)) * 10
      dItem[k] = itemD[k]
      if (k in columns) {
        columns[k].width = Math.max(+columns[k].width, width)
        continue
      }
      console.log('ccccck', k)
      columns[k] = {
        title: k,
        dataIndex: k,
        width: width,
        render: itemRenderWrap(diff, k, left)
        // key: k,
        // fixed: 'left'
      }
    }
    dItem.key = i
    data.push(dItem)
  }
  setColumns(Object.values(columns))
  setData(data)
}

function itemRenderWrap (diff: any, rowKey: string, left=true) {
  return (text:string, record: {[key:string]: string|number}, index: number) => {
    if (!text) return text
    const key = record.key
    if (key in diff && rowKey in diff[key]) {
      if (left) return <text className='row-item-left-highlight'>{text}</text>
      else return <text className='row-item-right-highlight'>{text}</text>
    }
    return text
  }
}

let first = true

const TableDiff = () => {
  // const listHeight = useRef<HTMLDivElement>(null)
  const [leftColumns, setLeftColumns] = useState([])
  const [leftData, setLeftData] = useState([])
  const [rightColumns, setRightColumns] = useState([])
  const [rightData, setRightData] = useState([])
  const [diff, setDiff] = useState<{[key:string]: object}>({})
  const [scrollY, setScrollY] = useState("")
    //页面加载完成后才能获取到对应的元素及其位置
  useEffect(() => {
      setScrollY(getTableScroll())
  }, [])

  // const getWindowSize = () => ({
  //   innerHeight: window.innerHeight,
  //   innerWidth: window.innerWidth,
  // });
  // const [windowSize, setWindowSize] = useState(getWindowSize());

  // useLayoutEffect(() => {
  //   console.log('listHeight', listHeight?.current?.clientHeight)
  // })
  // useEffect(()=> {
  //   window.addEventListener('rezise', () => {
  //     console.log('111listHeight', listHeight?.current?.clientHeight)
  //   })
  // }, [windowSize])


  if (first) {
    first = false 
    const ipc = window.electronAPI.ipcRenderer
    // ipc.on('resized', (e, msg) => {
    //   console.log('resized', e, msg)
    //   console.log(listHeight, listHeight?.current?.clientHeight)
    // })
    ipc.invoke('ipc_excel_paths').then((excelPaths: string[]) => {
      console.log(excelPaths)
      if (excelPaths.length) {
        // console.log('render', excelPaths)
        const datas = window.electronAPI.readXlsx(excelPaths[0])
        const rightDatas = window.electronAPI.readXlsx(excelPaths[1])

        // const data = []
        const defaultSheet = Object.keys(datas)[0]

        datas[defaultSheet].splice(0, 0, {})
        rightDatas[defaultSheet].splice(0, 0, {})
        const diffData = window.electronAPI.diffArrays(datas[defaultSheet], rightDatas[defaultSheet])
        setExcelData(diffData.diffObj, diffData.leftData, setLeftColumns, setLeftData, true)
        setExcelData(diffData.diffObj, diffData.rightData, setRightColumns, setRightData, false)
        setDiff(diffData.diffObj)
      }
    })
  }
  return (
    leftColumns && leftData ?
    <Row>
      <Col span={12}>
        <Table
          columns={leftColumns}
          dataSource={leftData}
          pagination={false}
          bordered
          // size="middle"
          // scroll={{ x: '100vw', y: '100vh' }}
          tableLayout="fixed"
          scroll={{ y: scrollY, x: '100vw' }}
          rowClassName={(record, index)=> {
            index += 1
            if (index in diff && Object.keys(diff[index]).length) return 'row-left-highlight'
          }}
        ></Table>
      </Col>
      <Col span={12}>
        <Table
          columns={rightColumns}
          dataSource={rightData}
          pagination={false}
          bordered
          // size="middle"
          // scroll={{ x: '100vw', y: '100vh' }}
          // tableLayout="fixed"
          scroll={{ y: scrollY, x: '100vw' }}
          tableLayout='fixed'
          rowClassName={(record, index)=> {
            index += 1
            if (index in diff && Object.keys(diff[index]).length) return 'row-right-highlight'
          }}
        ></Table>
      </Col>
    </Row> : null
  );
}


export default TableDiff