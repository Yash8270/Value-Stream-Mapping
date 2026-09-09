import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import useVsmStore from '../../store/useVsmStore';
import { Layers, ShieldCheck, PackageCheck, Building2, Users, ShoppingBag, Truck, Cpu, Boxes, ChevronRight } from 'lucide-react';

const NODE_THEMES = {
  process:           { bg: 'var(--vsm-process)',   text: '#FFFFFF', border: '#0E8BB3', icon: null },
  assembly:          { bg: 'var(--vsm-assembly)',  text: '#FFFFFF', border: '#3A5B96', icon: <Layers size={13} /> },
  quality:           { bg: 'var(--vsm-quality)',   text: '#17202A', border: '#D49E00', icon: <ShieldCheck size={13} /> },
  package_assembly:  { bg: 'var(--vsm-package)',   text: '#FFFFFF', border: '#6E5400', icon: <PackageCheck size={13} /> },
  supplier:          { bg: 'var(--vsm-navy)',      text: '#FFFFFF', border: '#0F2538', icon: <Building2 size={13} /> },
  customer:          { bg: 'var(--vsm-navy)',      text: '#FFFFFF', border: '#0F2538', icon: <Users size={13} /> },
  sales:             { bg: 'var(--vsm-blue)',      text: '#FFFFFF', border: '#255A8E', icon: <ShoppingBag size={13} /> },
  purchasing:        { bg: 'var(--vsm-blue)',      text: '#FFFFFF', border: '#255A8E', icon: <Truck size={13} /> },
  production_control:{ bg: 'var(--vsm-blue)',      text: '#FFFFFF', border: '#255A8E', icon: <Cpu size={13} /> },
  single_batch:      { bg: 'var(--vsm-blue)',      text: '#FFFFFF', border: '#255A8E', icon: <Boxes size={13} /> },
};

function ProcessNode({ id, data, selected }) {
  const { setActiveView, activeView } = useVsmStore();
  const nodeType = data.nodeType || 'process';
  const theme = NODE_THEMES[nodeType] || NODE_THEMES.process;
  const metrics = data.metrics;
  const isStageBox = data.isStageBox || !!data.stageId;
  const isTop = activeView === 'topHierarchy' || activeView === 'top';

  const handleDoubleClick = (e) => {
    if (isTop && data.stageId) {
      e.stopPropagation();
      setActiveView(data.stageId);
    }
  };

  return (
    <div
      onDoubleClick={handleDoubleClick}
      style={{
        width: nodeType === 'single_batch' ? '240px' : '180px',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-md)',
        border: selected ? '2px solid var(--vsm-blue)' : '1px solid var(--border)',
        boxShadow: selected ? '0 0 0 3px rgba(47, 111, 173, 0.25)' : 'var(--shadow-sm)',
        overflow: 'hidden',
        transition: 'all 0.15s ease',
        cursor: isTop && isStageBox ? 'pointer' : 'default',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          e.currentTarget.style.borderColor = theme.border;
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          e.currentTarget.style.borderColor = 'var(--border)';
        }
      }}
    >
      {/* Handles */}
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />
      <Handle type="source" position={Position.Bottom} id="bottom" />

      {/* Header Bar */}
      <div style={{
        backgroundColor: theme.bg,
        color: theme.text,
        padding: '7px 10px',
        fontSize: '12px',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        letterSpacing: '-0.01em',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
          {theme.icon}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {data.label}
          </span>
        </div>

        {/* Double-click Subassembly Hint Badge */}
        {isTop && isStageBox && (
          <span
            title="Double-click to open detailed subassembly VSM"
            style={{
              fontSize: '9.5px',
              fontWeight: 700,
              background: 'rgba(255,255,255,0.25)',
              color: theme.text,
              padding: '1px 5px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '1px',
              flexShrink: 0,
            }}
          >
            Sub <ChevronRight size={10} />
          </span>
        )}
      </div>

      {/* Metrics Table */}
      {metrics && (
        <div style={{ padding: '6px 8px', fontSize: '11px', background: '#FFFFFF' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--secondary-text)', fontWeight: 500 }}>C/T:</span>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{metrics.ct ?? 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--secondary-text)', fontWeight: 500 }}>M/T:</span>
              <span style={{ fontWeight: 700, color: metrics.mt > 0 ? '#B45309' : 'var(--text)' }}>{metrics.mt ?? 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--secondary-text)', fontWeight: 500 }}>U/T:</span>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>{metrics.ut ?? 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--secondary-text)', fontWeight: 500 }}>S/T:</span>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>{metrics.st ?? 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--secondary-text)', fontWeight: 500 }}>Op:</span>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>{metrics.op ?? 1}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--secondary-text)', fontWeight: 500 }}>Scrap:</span>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>{metrics.scrap ? `${(metrics.scrap * 100).toFixed(0)}%` : '0%'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gridColumn: 'span 2', borderTop: '1px dashed var(--border-light)', paddingTop: '3px', marginTop: '2px' }}>
              <span style={{ color: 'var(--secondary-text)', fontWeight: 500 }}>RFT Yield:</span>
              <span style={{ fontWeight: 700, color: metrics.rft < 1 ? '#D97706' : 'var(--success)' }}>
                {metrics.rft ? `${(metrics.rft * 100).toFixed(0)}%` : '100%'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(ProcessNode);
