import { Row, Col, Table, Tooltip, Input } from 'antd';
import React, { useState, useEffect, useMemo } from 'react';
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
  diffData: any,
  left = true,
  getRenderer?: (rowKey: string, left: boolean) => any
) {
  const columns: { [key: string]: { [key: string]: any } } = {};
  columns['Index'] = {
    title: 'Index',
    width: 60,
    fixed: "left",
    align: "center",
    render: (text: string, record: { [key: string]: string | number }, index: number) => {
      return `${Number(record.key)}`
    },
  };
  const datas: any[] = left ? diffData.leftData : diffData.rightData;
  const data = [];

  // 先收集所有列
  const allColumns = new Set<string>();
  for (let i = 1; i < datas.length; i++) {
    const itemD = datas[i];
    Object.keys(itemD).forEach(k => allColumns.add(k));
  }

  // 计算动态列宽（自适应窗口）
  const columnCount = allColumns.size;
  const dynamicWidth = Math.max(80, Math.floor((window.innerWidth / 2 - 100) / columnCount));

  for (let i = 1; i < datas.length; i++) {
    const itemD = datas[i];
    const keys = Object.keys(itemD);
    const dItem: { [key: string]: string | number } = {};
    for (const k of keys) {
      dItem[k] = itemD[k];
      if (k in columns) {
        continue;
      }
      columns[k] = {
        title: k,
        dataIndex: k,
        width: dynamicWidth,
        render: getRenderer ? getRenderer(k, left) : itemRenderWrap(diffData, k, left),
        onCell: cellRenderWrap(diffData, k, left),
      };
    }
    dItem.key = i;
    data.push(dItem);
  }
  return { columns: Object.values(columns), data };
}

function cellRenderWrap(diffData: any, rowKey: string, left = true) {
  const diff: diffType = diffData.diffObj;
  const nullLines = left ? diffData.nullLines.left : diffData.nullLines.right;
  const otherNullLines = !left ? diffData.nullLines.left : diffData.nullLines.right;
  return (record: { [key: string]: string | number }, index: number) => {
    const key = record.key;
    if (nullLines.indexOf(key) !== -1) {
      return {className: "diff-row-null" }
    }
    if (otherNullLines.indexOf(key) !== -1) {
      return left ? {className: "diff-row-delete" }: {className: "diff-row-add" }
    }
    if (key in diff && diff[key] && rowKey in diff[key]) {
      if (left) {
        return {className: "diff-row-left-item" }
      } else {
        return {className: "diff-row-right-item" }
      }
    }
    return {className: "diff-row-common-item" }
  };
}

function itemRenderWrap(diffData: any, rowKey: string, left = true) {
  return (
    text: string,
    record: { [key: string]: string | number },
    index: number
  ) => {
    const value = String(text ?? '');
    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      const line = Number(record.key);
      if (left) {
        diffData.leftData[line][rowKey] = v;
      } else {
        diffData.rightData[line][rowKey] = v;
      }
      const newDiff = window.electronAPI.diffArrays(diffData.leftData, diffData.rightData).diffObj;
      Object.assign(diffData.diffObj, newDiff);
    };
    return (
      <Tooltip placement='top' title={value}>
        <Input defaultValue={value} onChange={onChange}/>
      </Tooltip>
    )
  };
}

function rowClassRenderWrap(diff: diffType, page: number, left: boolean) {
  return (record: any, index: number) => {
    const idx = Number(record.key);
    if (idx in diff && (left ? true : diff[idx])) {
      if (left && !diff[idx]) {
        return 'diff-row-delete' + ` scroll-row-${idx}`
      }
      return (
        (left ? 'diff-row-left' : 'diff-row-right') + ` scroll-row-${idx}`
      );
    }
    return 'diff-row-common' + ` scroll-row-${idx}`;
  };
}

let onHandleScroll = false
function handleScroll(index: number) {
  diffScroll = 0;
  onHandleScroll = true
  scrollIntoView(document.querySelector(`.scroll-row-${index}`), {
    time: 0,
    align: {
      top: 0,
      left: 0,
    },
  });
}

// 绑定两个表格的滚动事件
function bindTableScrollEvent(dispatch: any) {
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
    if (!onHandleScroll) {
      dispatch(redux_setDiffIdx(-1));
    }
    onHandleScroll = false
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
    if (!onHandleScroll) {
      dispatch(redux_setDiffIdx(-1));
    }
    onHandleScroll = false
  });
}

function resetScrollNumber() {
  if (diffScroll) return
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
  rDatas? : { [key: string]: any },
  contextN?: number,
  showContextOnly?: boolean,
  expandIdx?: number
}

const diffOriData: {[key: string]: any} = {};
// const diffRowData: {[key: string]: any} = {};

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
  const [leftFullData, setLeftFullData] = useState([]);
  const [rightColumns, setRightColumns] = useState([]);
  const [rightData, setRightData] = useState([]);
  const [rightFullData, setRightFullData] = useState([]);

  const [diff, setDiff] = useState<diffType>({});
  const [scrollY, setScrollY] = useState('');

  const [page, setPage] = useState(1); // 当前页数
  const [expandedLines, setExpandedLines] = useState<Set<number>>(new Set());

  // Memoized visible rows calculation for context folding
  const visibleRowIndices = useMemo(() => {
    if (!props.showContextOnly) {
      return null; // Show all rows
    }

    const total = Math.max(leftFullData.length, rightFullData.length);
    const visible = new Set<number>();
    const contextN = props.contextN ?? 3;

    // Add diff rows and their context
    for (const k of Object.keys(diff)) {
      const center = Number(k);
      const start = Math.max(1, center - contextN);
      const end = Math.min(total - 1, center + contextN);
      for (let i = start; i <= end; i++) visible.add(i);
    }

    // Add manually expanded lines
    for (const i of Array.from(expandedLines)) visible.add(i);

    return visible;
  }, [props.showContextOnly, props.contextN, leftFullData.length, rightFullData.length, diff, expandedLines]);

  const buildArrayFromData = (data: any[]) => {
    const len = data.length;
    const arr: any[] = new Array(len);
    for (const rec of data as any[]) {
      const k = Number((rec as any).key);
      const obj: any = {};
      for (const kk of Object.keys(rec as any)) {
        if (kk === 'key') continue;
        obj[kk] = (rec as any)[kk];
      }
      arr[k] = obj;
    }
    return arr;
  };


  useEffect(() => {
    // 页面加载完成后才能获取到对应的元素及其位置
    setScrollY(getTableScroll());
    bindTableScrollEvent(dispatch);

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
        // diffRowData[sheetItem] = {
        //   'left': [],
        //   'right': []
        // }
        // for (const row in diffData.diffObj) {
        //   const val = diffData.diffObj[row]
        //   if (val === undefined) {
        //     diffRowData[sheetItem].left.push(row)
        //   } 
        // }
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
    const rendererFactory = (rowKey: string, leftSide: boolean) => {
      return (
        text: string,
        record: { [key: string]: string | number },
        index: number
      ) => {
        const value = String(text ?? '');
        const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const v = e.target.value;
          const line = Number(record.key);
          if (leftSide) {
            setLeftFullData(prev => {
              const next = [...prev] as any[];
              const idx = next.findIndex(d => Number((d as any).key) === line);
              const item = { ...(next[idx] as any), [rowKey]: v };
              next[idx] = item;
              return next as any;
            });
          } else {
            setRightFullData(prev => {
              const next = [...prev] as any[];
              const idx = next.findIndex(d => Number((d as any).key) === line);
              const item = { ...(next[idx] as any), [rowKey]: v };
              next[idx] = item;
              return next as any;
            });
          }
          const newLeftArr = buildArrayFromData(leftFullData as any[]);
          const newRightArr = buildArrayFromData(rightFullData as any[]);
          const rst = window.electronAPI.diffArrays(newLeftArr, newRightArr);
          setDiff(rst.diffObj);
        };
        return (
          <Tooltip placement='top' title={value}>
            <Input defaultValue={value} onChange={onChange}/>
          </Tooltip>
        )
      };
    };
    const leftPack = setExcelData(diffData, true, rendererFactory);
    const rightPack = setExcelData(diffData, false, rendererFactory);
    setLeftColumns(leftPack.columns);
    setRightColumns(rightPack.columns);
    setLeftFullData(leftPack.data);
    setRightFullData(rightPack.data);
    setLeftData(leftPack.data);
    setRightData(rightPack.data);
    setExpandedLines(new Set());
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
    if (!props.showContextOnly || !visibleRowIndices) {
      setLeftData(leftFullData);
      setRightData(rightFullData);
      return;
    }

    const lData = (leftFullData as any[]).filter(d => visibleRowIndices.has(Number((d as any).key)));
    const rData = (rightFullData as any[]).filter(d => visibleRowIndices.has(Number((d as any).key)));
    setLeftData(lData as any);
    setRightData(rData as any);
  }, [props.showContextOnly, visibleRowIndices, leftFullData, rightFullData]);

  useEffect(() => {
    if (!props.showContextOnly) return;
    if (props.expandIdx === undefined || props.expandIdx < 0) return;
    const idx = props.expandIdx;
    const keys = Object.keys(diff).map(v => Number(v)).sort((a,b)=>a-b);
    let prev = 1;
    let next = Math.max(leftFullData.length, rightFullData.length) - 1;
    for (let i=0;i<keys.length;i++) {
      if (keys[i] === idx) {
        prev = i>0 ? keys[i-1] : 1;
        next = i<keys.length-1 ? keys[i+1] : next;
        break;
      }
    }
    const set = new Set(expandedLines);
    for (let i = prev; i <= next; i++) set.add(i);
    setExpandedLines(set);
  }, [props.expandIdx]);

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
