import { Table } from 'antd';
import classNames from 'classnames';
import ResizeObserver from 'rc-resize-observer';
import React, { useEffect, useRef, useState } from 'react';
import { VariableSizeGrid as Grid } from 'react-window';

import scrollIntoView from 'scroll-into-view';

import './styles.less';

const g_RowHeight = 30

const VirtualTable = (props: Parameters<typeof Table>[0]) => {
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


  function ScrollToIndex(idx: number) {
    document.querySelector(`div.${props.className}`).scrollTo({top: (idx - 20)*g_RowHeight})
    scrollIntoView(document.querySelector(`.scroll-row-${idx}`), {
      align: {
        top: 0,
        left: 0,
      },
    });
  }

  // setTimeout(() => ScrollToIndex(1000), 2000)

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
    const totalHeight = rawData.length * g_RowHeight;

    return (
      <Grid
        ref={gridRef}
        className= {props.className ? props.className : "virtual-grid"}
        columnCount={mergedColumns.length}
        columnWidth={(index: number) => {
          const { width } = mergedColumns[index];
          return totalHeight > scroll!.y! && index === mergedColumns.length - 1
            ? (width as number) - scrollbarSize - 1
            : (width as number);
        }}
        height={scroll!.y as number}
        rowCount={rawData.length}
        rowHeight={() => g_RowHeight}
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
        }) => {
          return <div
            className={classNames('virtual-table-cell', `scroll-row-${rowIndex}`, {
              'virtual-table-cell-last': columnIndex === mergedColumns.length - 1,
              'diff-row-left': true,
              // 'diff-row-left-item': true,
            })}
            style={style}
          >
            {(rawData[rowIndex] as any)[(mergedColumns as any)[columnIndex].dataIndex]}
          </div>
        }}
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
};

export default VirtualTable;

// Usage
// const columns = [
//   { title: 'A', dataIndex: 'key' },
//   { title: 'B', dataIndex: 'key' },
//   { title: 'C', dataIndex: 'key' },
//   { title: 'D', dataIndex: 'key' },
//   { title: 'E', dataIndex: 'key' },
//   { title: 'F', dataIndex: 'key', width: 1110 },
// ];

// const data = Array.from({ length: 100000 }, (_, key) => ({ key }));

// const App: React.FC = () => (
//   <VirtualTable className='sssss' columns={columns} dataSource={data} title={() => "111"} scroll={{ y: 1300, x: '100vw' }} />
// );

// export default App;