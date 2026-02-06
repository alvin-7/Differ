import React from 'react';
import { Button } from 'antd';
import { DownOutlined } from '@ant-design/icons';

interface CollapsedRowIndicatorProps {
  range: {
    start: number;
    end: number;
    count: number;
    insertAfter: number;
  };
  onExpand: (range: { start: number; end: number }) => void;
}

const CollapsedRowIndicator: React.FC<CollapsedRowIndicatorProps> = ({ range, onExpand }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '30px',
        backgroundColor: '#f5f5f5',
        borderTop: '1px dashed #d9d9d9',
        borderBottom: '1px dashed #d9d9d9',
        cursor: 'pointer',
      }}
      onClick={() => onExpand({ start: range.start, end: range.end })}
    >
      <Button
        size="small"
        icon={<DownOutlined />}
        type="link"
        style={{ fontSize: '12px' }}
      >
        展开 {range.count} 行 (行 {range.start}-{range.end})
      </Button>
    </div>
  );
};

export default CollapsedRowIndicator;
