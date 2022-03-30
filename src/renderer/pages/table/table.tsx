// import React, { Dispatch, SetStateAction, useEffect, useState, useRef, useLayoutEffect } from "react";
import { Row, Col, Table } from 'antd';
import React, { useState, useEffect, useRef } from 'react';
import { VariableSizeGrid as Grid } from 'react-window';
import ResizeObserver from 'rc-resize-observer';
import classNames from 'classnames';

function VirtualTable(props: Parameters<typeof Table>[0]) {
  const { columns, scroll } = props;
  const [tableWidth, setTableWidth] = useState(0);

  const widthColumnCount = columns!.filter(({ width }) => !width).length;
  const mergedColumns = columns!.map(column => {
    if (column.width) {
      return column;
    }

    return {
      ...column,
      width: Math.floor(tableWidth / widthColumnCount),
    };
  });

  const gridRef = useRef<any>();
  const [connectObject] = useState<any>(() => {
    const obj = {};
    Object.defineProperty(obj, 'scrollLeft', {
      get: () => null,
      set: (scrollLeft: number) => {
        if (gridRef.current) {
          gridRef.current.scrollTo({ scrollLeft });
        }
      },
    });

    return obj;
  });

  const resetVirtualGrid = () => {
    gridRef.current.resetAfterIndices({
      columnIndex: 0,
      shouldForceUpdate: true,
    });
  };

  useEffect(() => resetVirtualGrid, [tableWidth]);

  const renderVirtualList = (rawData: object[], { scrollbarSize, ref, onScroll }: any) => {
    ref.current = connectObject;
    const totalHeight = rawData.length * 54;

    return (
      <Grid
        ref={gridRef}
        className="virtual-grid"
        columnCount={mergedColumns.length}
        columnWidth={(index: number) => {
          const { width } = mergedColumns[index];
          return totalHeight > scroll.y && index === mergedColumns.length - 1
            ? (width as number) - scrollbarSize - 1
            : (width as number);
        }}
        height={+scroll?.y||1000}
        rowCount={rawData.length}
        rowHeight={() => 54}
        width={tableWidth}
        onScroll={({ scrollLeft }: { scrollLeft: number }) => {
          onScroll({ scrollLeft });
        }}
      >
        {({
          columnIndex,
          rowIndex,
          style,
        }: {
          columnIndex: number;
          rowIndex: number;
          style: React.CSSProperties;
        }) => (
          <div
            className={classNames('virtual-table-cell', {
              'virtual-table-cell-last': columnIndex === mergedColumns.length - 1,
            })}
            style={style}
          >
            {(rawData[rowIndex] as any)[(mergedColumns as any)[columnIndex].dataIndex]}
          </div>
        )}
      </Grid>
    );
  };

  return (
    <ResizeObserver
      onResize={({ width }) => {
        setTableWidth(width);
      }}
    >
      <Table
        {...props}
        className="virtual-table"
        columns={mergedColumns}
        pagination={false}
        components={{
          body: renderVirtualList,
        }}
      />
    </ResizeObserver>
  );
}


/**
 * 获取第一个表格的可视化高度
 * @param {number} extraHeight 额外的高度(表格底部的内容高度 Number类型,默认为74) 
 * @param {reactRef} ref Table所在的组件的ref
 */
function getTableScroll({ extraHeight, ref }: {[key:string]: any}={}) {
  if (typeof extraHeight == "undefined") {
    //  默认底部分页64 + 边距10
    extraHeight = 74
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

let first = true

const TableDiff = () => {
  // const listHeight = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState([])
  const [data, setData] = useState([])
  const [diff, setDiff] = useState({})
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
        console.log('render', excelPaths)
        const datas = window.electronAPI.readXlsx(excelPaths[0])
        const rightDatas = window.electronAPI.readXlsx(excelPaths[1])

        console.log('datas', datas, rightDatas)
        const columns: {[key: string]: {[key:string]: string|number}} = {}
        const data = []
        const sheetNames = Object.keys(datas)

        console.log('orgin data', datas[sheetNames[0]], rightDatas[sheetNames[0]])
        const diffData = window.electronAPI.diffArrays(datas[sheetNames[0]], rightDatas[sheetNames[0]])
        console.log('diffData', diffData  )
        diffData && setDiff(diffData)

        for (let i=1; i<datas[sheetNames[0]].length; i++) { 
          const itemD = datas[sheetNames[0]][i]
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
            columns[k] = {
              title: k,
              dataIndex: k,
              width: width
              // key: k,
              // fixed: 'left'
            }
          }
          dItem.key = i
          data.push(dItem)
        }
        console.log('exceljs sheet', datas)
        console.log('columns', columns)
        console.log('data', data)
        setColumns(Object.values(columns))
        setData(data)
      }
    })
  }
  return (
    columns && data ?
    <Row>
      <Col span={12}>
        <VirtualTable
          columns={columns}
          dataSource={data}
          // bordered
          // size="middle"
          // scroll={{ x: '100vw', y: '100vh' }}
          tableLayout="fixed"
          scroll={{ y: scrollY, x: '100vw' }}
        ></VirtualTable>
      </Col>
      <Col span={12}>
        <VirtualTable
          columns={columns}
          dataSource={data}
          // bordered
          // size="middle"
          // scroll={{ x: '100vw', y: '100vh' }}
          // tableLayout="fixed"
          scroll={{ y: 1000, x: 500 }}
          tableLayout='auto'
          rowClassName={(record, index) => {
            console.log(index)
            return index%2 === 0 ? "active": ''
          }}
        ></VirtualTable>
      </Col>
    </Row> : null
  );
}


export default TableDiff