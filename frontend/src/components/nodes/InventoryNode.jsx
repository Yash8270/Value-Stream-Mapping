import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

function InventoryNode({ data, selected }) {
  const quantity = data?.quantity ?? data?.label ?? 0;

  return (
    <div
      style={{
        position: 'relative',
        width: '64px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'transform 0.15s ease',
        transform: selected ? 'scale(1.06)' : 'none',
      }}
      onMouseEnter={e => {
        if (!selected) e.currentTarget.style.transform = 'scale(1.04)';
      }}
      onMouseLeave={e => {
        if (!selected) e.currentTarget.style.transform = 'none';
      }}
    >
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Bottom} id="bottom" />

      <svg width="64" height="56" viewBox="0 0 64 56" style={{ filter: selected ? 'drop-shadow(0 0 6px rgba(47,111,173,0.5))' : 'drop-shadow(0 2px 5px rgba(15,35,55,0.12))' }}>
        <polygon
          points="32,4 60,52 4,52"
          fill="#5B9BD5"
          stroke={selected ? '#16324F' : '#2F6FAD'}
          strokeWidth={selected ? '2.5' : '1.5'}
          strokeLinejoin="round"
        />
        <text
          x="32"
          y="38"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="13"
          fontWeight="800"
          fontFamily="Inter, sans-serif"
        >
          {quantity}
        </text>
      </svg>
    </div>
  );
}

export default memo(InventoryNode);
