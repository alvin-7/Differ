import { Row, Col, Table, Tooltip } from 'antd';
import React, { useState, useEffect } from 'react';
//redux
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { RootState } from '../../redux/store';
import {
  setSheet as redux_setSheet,
  setSheets as redux_setSheets,
  setDiffKeys as redux_setDiffKeys,
  setDiffIdx as redux_setDiffIdx,
} from '../../redux/setter/layoutSetter';
import scrollIntoView from 'scroll-into-view';

import './styles.less';

const MAX_PAGE_SIZE = 100;

type diffType = { [key: string]: object };

/**
 * 获取第一个表格的可视化高度
 * @param {number} extraHeight 额外的高度(表格底部的内容高度 Number类型,默认为74)
 * @param {reactRef} ref Table所在的组件的ref
 */
function getTableScroll({ extraHeight, ref }: { [key: string]: any } = {}) {
  if (typeof extraHeight == 'undefined') {
    //  默认底部分页64 + 边距10
    extraHeight = 40 + 70;
  }
  let tHeader = null;
  if (ref && ref.current) {
    tHeader = ref.current.getElementsByClassName('ant-table-thead')[0];
  } else {
    tHeader = document.getElementsByClassName('ant-table-thead')[0];
  }
  //表格内容距离顶部的距离
  let tHeaderBottom = 0;
  if (tHeader) {
    tHeaderBottom = tHeader.getBoundingClientRect().bottom;
  }

  // 窗体高度-表格内容顶部的高度-表格内容底部的高度
  // let height = document.body.clientHeight - tHeaderBottom - extraHeight
  const height = `calc(100vh - ${tHeaderBottom + extraHeight}px)`;
  // 空数据的时候表格高度保持不变,暂无数据提示文本图片居中
  if (ref && ref.current) {
    const placeholder = ref.current.getElementsByClassName(
      'ant-table-placeholder'
    )[0];
    if (placeholder) {
      placeholder.style.height = height;
      placeholder.style.display = 'flex';
      placeholder.style.alignItems = 'center';
      placeholder.style.justifyContent = 'center';
    }
  }
  return height;
}

function setExcelData(
  diff: diffType,
  datas: any[],
  setColumns: React.Dispatch<React.SetStateAction<any[]>>,
  setData: React.Dispatch<React.SetStateAction<any[]>>,
  left = true
) {
  const columns: { [key: string]: { [key: string]: any } } = {};
  columns['Index'] = {
    title: 'Index',
    width: 80,
    fixed: "left",
    align: "center",
    render: (text: string, record: object, index: number) => `${index + 1}`,
  };
  const data = [];
  for (let i = 1; i < datas.length; i++) {
    const itemD = datas[i];
    const keys = Object.keys(itemD);
    const dItem: { [key: string]: string | number } = {};
    for (const k of keys) {
      // const cArr = itemD[k].match(/[^x00-xff]/ig);
      // const width = ((itemD[k] + '').length + (cArr ? cArr.length : 0)) * 3
      dItem[k] = itemD[k];
      if (k in columns) {
        // columns[k].width = Math.min(Math.max(+columns[k].width, width), 300)
        continue;
      }
      columns[k] = {
        title: k,
        dataIndex: k,
        width: 150,  // 默认就行
        render: itemRenderWrap(diff, k, left),
        onCell: cellRenderWrap(diff, k, left),
        // key: k,
        // fixed: 'left'
      };
    }
    dItem.key = i;
    data.push(dItem);
  }
  setColumns(Object.values(columns));
  setData(data);
}

function cellRenderWrap(diff: diffType, rowKey: string, left = true) {
  return (record: { [key: string]: string | number }, index: number) => {
    const key = record.key;
    const commonStyle = {
      maxHeight: 40,
    }
    if (key in diff && diff[key] && rowKey in diff[key]) {
      if (left) {
        return {...commonStyle, className: "diff-row-left-item" }
      }
      else {
        return {...commonStyle, className: "diff-row-right-item" }
      }
    }
    return {...commonStyle, className: "diff-row-common-item" }
  };
}

function itemRenderWrap(diff: diffType, rowKey: string, left = true) {
  return (
    text: string,
    record: { [key: string]: string | number },
    index: number
  ) => {
    // if (!text) return text;
    // const key = record.key;
    // if (key in diff && diff[key] && rowKey in diff[key]) {
    //   if (left) return <div className="diff-row-left-item">{text}</div>;
    //   else return <div className="diff-row-right-item">{text}</div>;
    // }
    // return <div className="diff-row-common-item">{text}</div>;
    return <Tooltip placement='top' title={text}>
      <div className='ellipsis'>{text}</div>
    </Tooltip>
  };
}

function rowClassRenderWrap(diff: diffType, page: number, left = true) {
  return (record: any, index: number) => {
    index = (page - 1) * MAX_PAGE_SIZE + index + 1;
    // if (index in diff && JSON.stringify(diff[index]) !== '{}') {
    if (index in diff) {
      return (
        (left ? 'diff-row-left' : 'diff-row-right') + ` scroll-row-${index}`
      );
    }
    return 'diff-row-common' + ` scroll-row-${index}`;
  };
}

function handleScroll(index: number) {
  diffScroll = 0;
  scrollIntoView(document.querySelector(`.scroll-row-${index}`), {
    align: {
      top: 0,
      left: 0,
    },
  });
}

// 绑定两个表格的滚动事件
function bindTableScrollEvent() {
  const leftTable = document.querySelector('.diff-left-table .ant-table-body');
  const rightTable = document.querySelector('.diff-right-table .ant-table-body');
  let scrollLock = false;
  leftTable.addEventListener('scroll', function () {
    if (
      scrollLock ||
      (leftTable.scrollLeft === rightTable.scrollLeft &&
        leftTable.scrollTop === rightTable.scrollTop)
    ) {
      return;
    }
    scrollLock = true;
    rightTable.scrollLeft = leftTable.scrollLeft;
    rightTable.scrollTop = leftTable.scrollTop;
    scrollLock = false;
  });
  rightTable.addEventListener('scroll', function () {
    if (
      scrollLock ||
      (leftTable.scrollLeft === rightTable.scrollLeft &&
        leftTable.scrollTop === rightTable.scrollTop)
    ) {
      return;
    }
    scrollLock = true;
    leftTable.scrollLeft = rightTable.scrollLeft;
    leftTable.scrollTop = rightTable.scrollTop;
    scrollLock = false;
  });
}

function resetScrollNumber() {
  const leftTable = document.querySelector('.diff-left-table .ant-table-body');
  const rightTable = document.querySelector('.diff-right-table .ant-table-body');
  leftTable.scrollLeft = 0;
  leftTable.scrollTop = 0;
  rightTable.scrollLeft = 0;
  rightTable.scrollTop = 0;
}

let diffScroll = 0;

export type TableProps = {
  lTitle? : string,
  rTitle? : string,
  lDatas? : { [key: string]: any },
  rDatas? : { [key: string]: any } 
}

const diffOriData: {[key: string]: any} = {};

const TableDiff = (props: TableProps) => {
  //redux
  const dispatch = useAppDispatch();
  const redux_sheet = useAppSelector((state: RootState) => state.setter.sheet);
  const redux_diffIdx = useAppSelector(
    (state: RootState) => state.setter.diffIdx
  );
  const redux_diffKeys = useAppSelector(
    (state: RootState) => state.setter.diffKeys
  );

  const [leftColumns, setLeftColumns] = useState([]);
  const [leftData, setLeftData] = useState([]);
  const [rightColumns, setRightColumns] = useState([]);
  const [rightData, setRightData] = useState([]);

  const [diff, setDiff] = useState<diffType>({});
  const [scrollY, setScrollY] = useState('');

  const [page, setPage] = useState(1); // 当前页数


  useEffect(() => {
    // 页面加载完成后才能获取到对应的元素及其位置
    setScrollY(getTableScroll());
    bindTableScrollEvent();

    // 数据初始化
    const sheetItems = new Set([
      ...Object.keys(props.lDatas),
      ...Object.keys(props.rDatas),
    ]);
    for (const sheetItem of Array.from(sheetItems)) {
      props.lDatas[sheetItem]?.splice(0, 0, {});
      props.rDatas[sheetItem]?.splice(0, 0, {});
      const leftD = props.lDatas[sheetItem] || [];
      const rightD = props.rDatas[sheetItem] || [];
      const diffData = window.electronAPI.diffArrays(leftD, rightD);
      if (diffData.diffObj && Object.keys(diffData.diffObj).length > 0) {
        diffOriData[sheetItem] = diffData;
      }
    }

    const sheetNames = Object.keys(diffOriData)
    dispatch(redux_setSheets(sheetNames));
    dispatch(redux_setSheet(sheetNames[0]));
  }, []);

  useEffect(() => {
    if (!redux_sheet) return;
    const diffData = diffOriData[redux_sheet];
    setDiff(diffData.diffObj);
    const lineKeys = Object.keys(diffData.diffObj).map((v) => +v);
    setPage(1)
    dispatch(redux_setDiffKeys(lineKeys));
    dispatch(redux_setDiffIdx(-1));
    setExcelData(
      diffData.diffObj,
      diffData.leftData,
      setLeftColumns,
      setLeftData,
      true
    );
    setExcelData(
      diffData.diffObj,
      diffData.rightData,
      setRightColumns,
      setRightData,
      false
    );
  }, [redux_sheet]);

  useEffect(() => {
    if (redux_diffKeys.indexOf(redux_diffIdx) === -1) return;
    const page_diff = Math.ceil(redux_diffIdx / MAX_PAGE_SIZE);
    if (page_diff > 0 && page_diff !== page) {
      diffScroll = redux_diffIdx;
      resetScrollNumber();
      setPage(page_diff);
    } else {
      handleScroll(redux_diffIdx);
    }
  }, [redux_diffIdx]);

  useEffect(() => {
    if (diffScroll !== 0) {
      handleScroll(diffScroll);
    } else if (redux_diffIdx >= 0) {
      // it set
      const curLine = (page - 1) * MAX_PAGE_SIZE;
      dispatch(redux_setDiffIdx(curLine));
    }
  }, [page]);

  return leftColumns && leftData && rightData ? (
    <Row>
      <Col span={12}>
        <Table
          className="diff-left-table"
          columns={leftColumns}
          dataSource={leftData}
          title={() => props.lTitle}
          pagination={{
            current: page,
            pageSize: MAX_PAGE_SIZE,
            hideOnSinglePage: true,
            showSizeChanger: false,
            onChange: (page: number) => setPage(page),
          }}
          bordered
          // size="middle"
          // scroll={{ x: '100vw', y: '100vh' }}
          tableLayout="fixed"
          scroll={{ y: scrollY, x: '100%' }}
          rowClassName={rowClassRenderWrap(diff, page, true)}
        ></Table>
      </Col>
      <Col span={12}>
        <Table
          className="diff-right-table"
          columns={rightColumns}
          dataSource={rightData}
          title={() => props.rTitle}
          pagination={{
            current: page,
            pageSize: MAX_PAGE_SIZE,
            hideOnSinglePage: true,
            showSizeChanger: false,
            onChange: (page: number) => setPage(page),
          }}
          bordered
          // size="middle"
          // scroll={{ x: '100vw', y: '100vh' }}
          // tableLayout="fixed"
          scroll={{ y: scrollY, x: '100%' }}
          tableLayout="fixed"
          rowClassName={rowClassRenderWrap(diff, page, false)}
        ></Table>
      </Col>
    </Row>
  ) : null;
};

export default TableDiff;
