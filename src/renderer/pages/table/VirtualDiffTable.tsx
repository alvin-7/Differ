import { Button, Spin, Progress } from 'antd';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { VariableSizeGrid as Grid } from 'react-window';
import ResizeObserver from 'rc-resize-observer';
import classNames from 'classnames';
import CollapsedRowIndicator from './CollapsedRowIndicator';
import { useDiffWorker } from '../../hooks/useDiffWorker';
import './VirtualDiffTable.less';

//redux
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { RootState } from '../../redux/store';
import {
  setSheet as redux_setSheet,
  setSheets as redux_setSheets,
  setDiffKeys as redux_setDiffKeys,
  setDiffIdx as redux_setDiffIdx,
} from '../../redux/setter/layoutSetter';

const ROW_HEIGHT = 30;
const APP_HEADER_HEIGHT = 64; // Ant Design Header 默认高度
const TABLE_TITLE_HEIGHT = 41; // 虚拟表格标题高度
const CONTENT_PADDING = 48; // Content padding (24px * 2)
const COLLAPSED_INFO_HEIGHT = 45; // 折叠信息栏高度（如果显示）
const MIN_COLUMN_WIDTH = 80;

type diffType = { [key: string]: { [column: string]: boolean } };

export type VirtualDiffTableProps = {
  lTitle?: string;
  rTitle?: string;
  lDatas?: { [key: string]: any };
  rDatas?: { [key: string]: any };
  contextN?: number;
  showContextOnly?: boolean;
  expandIdx?: number;
};

interface ColumnDef {
  title: string;
  dataIndex: string;
  width: number;
  fixed?: string;
}

const diffOriData: { [key: string]: any } = {};

const VirtualDiffTable = (props: VirtualDiffTableProps) => {
  //redux
  const dispatch = useAppDispatch();
  const redux_sheet = useAppSelector((state: RootState) => state.setter.sheet);
  const redux_diffIdx = useAppSelector(
    (state: RootState) => state.setter.diffIdx
  );
  const redux_diffKeys = useAppSelector(
    (state: RootState) => state.setter.diffKeys
  );

  const [leftColumns, setLeftColumns] = useState<ColumnDef[]>([]);
  const [leftData, setLeftData] = useState<any[]>([]);
  const [leftFullData, setLeftFullData] = useState<any[]>([]);
  const [rightColumns, setRightColumns] = useState<ColumnDef[]>([]);
  const [rightData, setRightData] = useState<any[]>([]);
  const [rightFullData, setRightFullData] = useState<any[]>([]);

  const [diff, setDiff] = useState<diffType>({});
  const [nullLines, setNullLines] = useState<{ left: number[]; right: number[] }>({
    left: [],
    right: [],
  });
  const [rowTypes, setRowTypes] = useState<{ [key: number]: string }>({});

  const [tableWidth, setTableWidth] = useState(0);
  const [tableHeight, setTableHeight] = useState(600);
  const [expandedLines, setExpandedLines] = useState<Set<number>>(new Set());

  const leftGridRef = useRef<Grid>(null);
  const rightGridRef = useRef<Grid>(null);
  const lastScrollSource = useRef<'left' | 'right' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use diff worker for async calculation
  const { calculateDiff: calculateDiffAsync, isCalculating, progress } = useDiffWorker();

  // Build array from data with key
  const buildArrayFromData = useCallback((data: any[]) => {
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
  }, []);

  // Initialize data on mount
  useEffect(() => {
    // Calculate table height - 减去所有固定高度的元素
    const calculateHeight = () => {
      // 尝试获取实际的 header 高度
      const header = document.querySelector('.ant-layout-header');
      const headerHeight = header ? header.clientHeight : APP_HEADER_HEIGHT;

      // 获取折叠信息栏高度（如果存在）
      const collapsedInfo = document.querySelector('.collapsed-info');
      const collapsedInfoHeight = collapsedInfo ? collapsedInfo.clientHeight : 0;

      const totalFixedHeight =
        headerHeight +
        TABLE_TITLE_HEIGHT +
        CONTENT_PADDING +
        collapsedInfoHeight +
        ROW_HEIGHT + // 减去一整行高度，确保最后一行完整显示
        25; // 额外的安全边距

      const availableHeight = window.innerHeight - totalFixedHeight;
      setTableHeight(Math.max(400, availableHeight)); // 最小高度 400px
    };

    // 延迟计算，确保 DOM 已渲染
    setTimeout(calculateHeight, 100);

    // 监听窗口大小变化
    const handleResize = () => {
      calculateHeight();
    };
    window.addEventListener('resize', handleResize);

    // Initialize sheet data asynchronously
    const initializeData = async () => {
      const sheetItems = new Set([
        ...Object.keys(props.lDatas || {}),
        ...Object.keys(props.rDatas || {}),
      ]);

      for (const sheetItem of Array.from(sheetItems)) {
        props.lDatas[sheetItem]?.splice(0, 0, {});
        props.rDatas[sheetItem]?.splice(0, 0, {});
        const leftD = props.lDatas[sheetItem] || [];
        const rightD = props.rDatas[sheetItem] || [];

        try {
          // Use async diff calculation for large datasets
          const diffData = await calculateDiffAsync(leftD, rightD);
          if (diffData.diffObj && Object.keys(diffData.diffObj).length > 0) {
            diffOriData[sheetItem] = diffData;
          }
        } catch (error) {
          console.error('Failed to calculate diff:', error);
          // Fallback to sync calculation
          const diffData = window.electronAPI.diffArrays(leftD, rightD);
          if (diffData.diffObj && Object.keys(diffData.diffObj).length > 0) {
            diffOriData[sheetItem] = diffData;
          }
        }
      }

      const sheetNames = Object.keys(diffOriData);
      dispatch(redux_setSheets(sheetNames));
      dispatch(redux_setSheet(sheetNames[0]));

      // 数据加载后重新计算高度
      setTimeout(calculateHeight, 100);
    };

    initializeData();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Process data when sheet changes
  useEffect(() => {
    if (!redux_sheet) return;
    const diffData = diffOriData[redux_sheet];
    setDiff(diffData.diffObj);
    setNullLines(diffData.nullLines);
    setRowTypes(diffData.rowTypes || {});
    const lineKeys = Object.keys(diffData.diffObj).map((v) => +v);
    dispatch(redux_setDiffKeys(lineKeys));
    dispatch(redux_setDiffIdx(-1));

    // Build columns and data
    const { columns: lCols, data: lData } = buildExcelData(diffData, true);
    const { columns: rCols, data: rData } = buildExcelData(diffData, false);

    console.log('Data loaded:', {
      leftColumns: lCols.length,
      leftRows: lData.length,
      rightColumns: rCols.length,
      rightRows: rData.length,
      diffCount: lineKeys.length,
      sampleDiff: Object.keys(diffData.diffObj).slice(0, 3).map(k => ({
        line: k,
        columns: Object.keys(diffData.diffObj[k]),
        type: diffData.rowTypes?.[k]
      }))
    });

    setLeftColumns(lCols);
    setRightColumns(rCols);
    setLeftFullData(lData);
    setRightFullData(rData);
    setLeftData(lData);
    setRightData(rData);
    setExpandedLines(new Set());
  }, [redux_sheet]);

  // Memoized visible rows calculation for context folding
  const visibleRowIndices = useMemo(() => {
    if (!props.showContextOnly) {
      return new Set(leftFullData.map((_, idx) => idx));
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

  // Memoized collapsed ranges calculation
  const collapsedRanges = useMemo(() => {
    if (!props.showContextOnly) return [];

    const visibleArray = Array.from(visibleRowIndices).sort((a, b) => a - b);
    if (visibleArray.length === 0) return [];

    const ranges: Array<{ start: number; end: number; count: number; insertAfter: number }> = [];
    let prevRow = 0;

    for (const row of visibleArray) {
      const gap = row - prevRow - 1;
      if (gap > 0) {
        ranges.push({
          start: prevRow + 1,
          end: row - 1,
          count: gap,
          insertAfter: prevRow,
        });
      }
      prevRow = row;
    }

    // Add trailing collapsed range
    const total = Math.max(leftFullData.length, rightFullData.length);
    if (prevRow < total - 1) {
      ranges.push({
        start: prevRow + 1,
        end: total - 1,
        count: total - prevRow - 1,
        insertAfter: prevRow,
      });
    }

    return ranges;
  }, [visibleRowIndices, props.showContextOnly, leftFullData.length, rightFullData.length]);

  // Handle context filtering with memoization
  useEffect(() => {
    if (!props.showContextOnly) {
      setLeftData(leftFullData);
      setRightData(rightFullData);
      return;
    }

    const lData = (leftFullData as any[]).filter((d) =>
      visibleRowIndices.has(Number((d as any).key))
    );
    const rData = (rightFullData as any[]).filter((d) =>
      visibleRowIndices.has(Number((d as any).key))
    );
    setLeftData(lData as any);
    setRightData(rData as any);
  }, [props.showContextOnly, visibleRowIndices, leftFullData, rightFullData]);

  // Handle expand range
  const handleExpandRange = useCallback((range: { start: number; end: number }) => {
    const set = new Set(expandedLines);
    for (let i = range.start; i <= range.end; i++) {
      set.add(i);
    }
    setExpandedLines(set);
  }, [expandedLines]);

  // Handle collapse all
  const handleCollapseAll = useCallback(() => {
    setExpandedLines(new Set());
  }, []);
  useEffect(() => {
    if (!props.showContextOnly) return;
    if (props.expandIdx === undefined || props.expandIdx < 0) return;
    const idx = props.expandIdx;
    const keys = Object.keys(diff)
      .map((v) => Number(v))
      .sort((a, b) => a - b);
    let prev = 1;
    let next = Math.max(leftFullData.length, rightFullData.length) - 1;
    for (let i = 0; i < keys.length; i++) {
      if (keys[i] === idx) {
        prev = i > 0 ? keys[i - 1] : 1;
        next = i < keys.length - 1 ? keys[i + 1] : next;
        break;
      }
    }
    const set = new Set(expandedLines);
    for (let i = prev; i <= next; i++) set.add(i);
    setExpandedLines(set);
  }, [props.expandIdx]);

  // Handle diff navigation
  useEffect(() => {
    if (redux_diffIdx < 0 || redux_diffKeys.indexOf(redux_diffIdx) === -1) return;
    scrollToRow(redux_diffIdx);
  }, [redux_diffIdx]);

  // Build Excel data structure with dynamic column width
  const buildExcelData = (diffData: any, left = true) => {
    const columns: ColumnDef[] = [];

    const datas: any[] = left ? diffData.leftData : diffData.rightData;
    const data = [];

    // 根据总行数计算行号列宽度
    // 每个数字约 8px，加上 padding 和边距
    const maxRowNumber = datas.length;
    const digitCount = String(maxRowNumber).length;
    const indexColumnWidth = Math.max(50, digitCount * 10 + 20);

    columns.push({
      title: 'Index',
      dataIndex: 'Index',
      width: indexColumnWidth,
      fixed: 'left',
    });

    // 先收集所有列和数据
    const allColumns = new Set<string>();
    const columnMaxLengths: { [key: string]: number } = {};

    for (let i = 1; i < datas.length; i++) {
      const itemD = datas[i];
      if (itemD) {
        const keys = Object.keys(itemD);
        keys.forEach(k => {
          allColumns.add(k);
          // 计算列的最大内容长度
          const value = String(itemD[k] || '');
          const length = value.length;
          if (!columnMaxLengths[k] || length > columnMaxLengths[k]) {
            columnMaxLengths[k] = length;
          }
        });
      }
    }

    // 计算每列的宽度
    const columnArray = Array.from(allColumns);
    columnArray.forEach((k) => {
      // 考虑列名和内容的长度
      const headerLength = k.length;
      const contentLength = columnMaxLengths[k] || 0;
      const maxLength = Math.max(headerLength, contentLength);

      // 根据内容长度计算宽度（每个字符约 8px，加上 padding）
      // 最小 80px，最大 400px
      const calculatedWidth = Math.min(400, Math.max(MIN_COLUMN_WIDTH, maxLength * 8 + 24));

      columns.push({
        title: k,
        dataIndex: k,
        width: calculatedWidth,
      });
    });

    // 构建数据
    for (let i = 1; i < datas.length; i++) {
      const itemD = datas[i];
      const dItem: { [key: string]: string | number } = {};
      if (itemD) {
        for (const k of Object.keys(itemD)) {
          dItem[k] = itemD[k];
        }
      }
      dItem.key = i;
      dItem.Index = i;
      data.push(dItem);
    }
    return { columns, data };
  };

  // Scroll to specific row
  const scrollToRow = useCallback((rowIndex: number) => {
    if (leftGridRef.current && rightGridRef.current) {
      leftGridRef.current.scrollToItem({
        align: 'center',
        rowIndex: rowIndex,
      });
      rightGridRef.current.scrollToItem({
        align: 'center',
        rowIndex: rowIndex,
      });
    }
  }, []);

  // Get cell class name based on diff status
  const getCellClassName = useCallback(
    (rowIndex: number, columnKey: string, isLeft: boolean) => {
      const row = isLeft ? leftData[rowIndex] : rightData[rowIndex];
      if (!row) return 'diff-cell';

      const key = row.key;

      // 检查是否是空行（没有实际数据）
      const hasData = Object.keys(row).some(k => k !== 'key' && k !== 'Index' && row[k]);
      if (!hasData) {
        return 'diff-cell diff-row-null';
      }

      const isNullRow = isLeft
        ? nullLines.left.indexOf(key) !== -1
        : nullLines.right.indexOf(key) !== -1;
      const otherIsNullRow = !isLeft
        ? nullLines.left.indexOf(key) !== -1
        : nullLines.right.indexOf(key) !== -1;

      if (isNullRow) {
        return 'diff-cell diff-row-null';
      }
      if (otherIsNullRow) {
        return isLeft
          ? 'diff-cell diff-row-delete'
          : 'diff-cell diff-row-add';
      }

      // 检查单元格级别的差异（新的简化结构）
      if (key in diff && diff[key]) {
        const cellDiffs = diff[key] as { [column: string]: boolean };
        // 检查这个单元格是否有差异
        if (columnKey in cellDiffs && cellDiffs[columnKey]) {
          return isLeft
            ? 'diff-cell diff-row-left-item'
            : 'diff-cell diff-row-right-item';
        }
      }

      return 'diff-cell diff-row-common-item';
    },
    [leftData, rightData, diff, nullLines]
  );

  // Get row class name
  const getRowClassName = useCallback(
    (rowIndex: number, isLeft: boolean) => {
      const row = isLeft ? leftData[rowIndex] : rightData[rowIndex];
      if (!row) return '';

      const key = row.key;
      if (key in diff) {
        if (isLeft && !diff[key]) {
          return 'diff-row-delete';
        }
        return isLeft ? 'diff-row-left' : 'diff-row-right';
      }
      return 'diff-row-common';
    },
    [leftData, rightData, diff]
  );

  // Handle cell edit with async diff recalculation (currently not used in read-only mode)
  const handleCellEdit = useCallback(
    async (rowIndex: number, columnKey: string, value: string, isLeft: boolean) => {
      if (isLeft) {
        setLeftFullData((prev) => {
          const next = [...prev] as any[];
          const row = next[rowIndex];
          if (row) {
            next[rowIndex] = { ...row, [columnKey]: value };
          }
          return next as any;
        });
      } else {
        setRightFullData((prev) => {
          const next = [...prev] as any[];
          const row = next[rowIndex];
          if (row) {
            next[rowIndex] = { ...row, [columnKey]: value };
          }
          return next as any;
        });
      }

      // Recalculate diff asynchronously
      try {
        const newLeftArr = buildArrayFromData(
          isLeft ? leftFullData : (leftFullData as any[])
        );
        const newRightArr = buildArrayFromData(
          isLeft ? (rightFullData as any[]) : rightFullData
        );
        const rst = await calculateDiffAsync(newLeftArr, newRightArr);
        setDiff(rst.diffObj as diffType);
        setNullLines(rst.nullLines);
        setRowTypes(rst.rowTypes || {});
      } catch (error) {
        console.error('Failed to recalculate diff:', error);
        // Fallback to sync calculation
        const newLeftArr = buildArrayFromData(
          isLeft ? leftFullData : (leftFullData as any[])
        );
        const newRightArr = buildArrayFromData(
          isLeft ? (rightFullData as any[]) : rightFullData
        );
        const rst = window.electronAPI.diffArrays(newLeftArr, newRightArr);
        setDiff(rst.diffObj as diffType);
        setNullLines(rst.nullLines);
        setRowTypes(rst.rowTypes || {});
      }
    },
    [leftFullData, rightFullData, buildArrayFromData, calculateDiffAsync]
  );

  // Cell renderer with React.memo for performance
  const CellRenderer = useCallback(
    ({
      columnIndex,
      rowIndex,
      style,
      data,
    }: {
      columnIndex: number;
      rowIndex: number;
      style: React.CSSProperties;
      data: any;
    }) => {
      const { columns, rowData, isLeft } = data;
      const column = columns[columnIndex];
      const row = rowData[rowIndex];

      if (!row || !column) {
        return <div style={style} className="diff-cell" />;
      }

      const value = String(row[column.dataIndex] ?? '');
      const isIndexColumn = column.dataIndex === 'Index';

      // 行号列使用特殊样式
      if (isIndexColumn) {
        return (
          <div
            style={style}
            className="diff-cell diff-index-cell"
            title={value}
          >
            {value}
          </div>
        );
      }

      const className = getCellClassName(rowIndex, column.dataIndex, isLeft);
      const rowClassName = getRowClassName(rowIndex, isLeft);

      // 只读模式，不使用 Input 组件以提升性能
      return (
        <div
          style={style}
          className={classNames(className, rowClassName, `scroll-row-${row.key}`)}
          title={value}
        >
          <div style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            padding: '6px 12px'
          }}>
            {value}
          </div>
        </div>
      );
    },
    [getCellClassName, getRowClassName]
  );

  // Synchronized scroll handler
  const handleScroll = useCallback(
    (source: 'left' | 'right') => {
      return ({ scrollLeft, scrollTop }: { scrollLeft: number; scrollTop: number }) => {
        // If this scroll was triggered by the other side, ignore it
        if (lastScrollSource.current && lastScrollSource.current !== source) {
          lastScrollSource.current = null;
          return;
        }

        // Mark this as the scroll source
        lastScrollSource.current = source;

        // Sync the other grid
        requestAnimationFrame(() => {
          if (source === 'left') {
            rightGridRef.current?.scrollTo({ scrollLeft, scrollTop });
          } else {
            leftGridRef.current?.scrollTo({ scrollLeft, scrollTop });
          }
        });

        // Clear diff index on manual scroll
        dispatch(redux_setDiffIdx(-1));
      };
    },
    [dispatch]
  );

  // Calculate total width for columns
  const columnWidth = useCallback(
    (index: number, columns: ColumnDef[]) => {
      return columns[index]?.width || MIN_COLUMN_WIDTH;
    },
    []
  );

  return (
    <ResizeObserver
      onResize={({ width }) => {
        if (width > 0) {
          setTableWidth(width);
        }
      }}
    >
      <div className="virtual-diff-container" ref={containerRef}>
        {isCalculating && (
          <div className="loading-overlay">
            <div className="loading-content">
              <Spin size="large" />
              <div className="loading-text">正在计算差异...</div>
              <Progress percent={progress} style={{ marginTop: '16px' }} />
            </div>
          </div>
        )}
        {props.showContextOnly && collapsedRanges.length > 0 && (
          <div className="collapsed-info">
            <span className="collapsed-count">
              隐藏了 {collapsedRanges.reduce((sum, r) => sum + r.count, 0)} 行
            </span>
            <Button size="small" onClick={handleCollapseAll}>
              全部折叠
            </Button>
          </div>
        )}
        <div className="diff-tables-wrapper">
          <div className="diff-table-panel">
            <div className="table-header">{props.lTitle}</div>
            {leftData.length > 0 ? (
              <div style={{ position: 'relative', flex: 1 }}>
                <Grid
                  ref={leftGridRef}
                  className="diff-grid left-grid"
                  columnCount={leftColumns.length}
                  columnWidth={(index) => columnWidth(index, leftColumns)}
                  height={tableHeight}
                  rowCount={leftData.length}
                  rowHeight={() => ROW_HEIGHT}
                  width={(tableWidth || 1200) / 2}
                  onScroll={handleScroll('left')}
                  overscanRowCount={5}
                  overscanColumnCount={2}
                  itemData={{
                    columns: leftColumns,
                    rowData: leftData,
                    isLeft: true,
                  }}
                  style={{ outline: 'none' }}
                >
                  {CellRenderer}
                </Grid>
              </div>
            ) : (
              <div style={{ padding: '20px', color: '#999' }}>
                Loading left... (rows: {leftData.length}, cols: {leftColumns.length})
              </div>
            )}
          </div>
          <div className="diff-table-panel">
            <div className="table-header">{props.rTitle}</div>
            {rightData.length > 0 ? (
              <div style={{ position: 'relative', flex: 1 }}>
                <Grid
                  ref={rightGridRef}
                  className="diff-grid right-grid"
                  columnCount={rightColumns.length}
                  columnWidth={(index) => columnWidth(index, rightColumns)}
                  height={tableHeight}
                  rowCount={rightData.length}
                  rowHeight={() => ROW_HEIGHT}
                  width={(tableWidth || 1200) / 2}
                  onScroll={handleScroll('right')}
                  overscanRowCount={5}
                  overscanColumnCount={2}
                  itemData={{
                    columns: rightColumns,
                    rowData: rightData,
                    isLeft: false,
                  }}
                  style={{ outline: 'none' }}
                >
                  {CellRenderer}
                </Grid>
              </div>
            ) : (
              <div style={{ padding: '20px', color: '#999' }}>
                Loading right... (rows: {rightData.length}, cols: {rightColumns.length})
              </div>
            )}
          </div>
        </div>
      </div>
    </ResizeObserver>
  );
};

export default VirtualDiffTable;
