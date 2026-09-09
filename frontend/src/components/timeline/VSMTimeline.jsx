import React, { useState } from 'react';
import useVsmStore from '../../store/useVsmStore';
import { ChevronUp, ChevronDown, Clock, Maximize2 } from 'lucide-react';

function safeNum(val, defaultVal = 0) {
  if (val === null || val === undefined || val === '') return defaultVal;
  const n = parseFloat(val);
  return isNaN(n) ? defaultVal : n;
}

export default function VSMTimeline() {
  const { stages, activeView } = useVsmStore();
  const [collapsed, setCollapsed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = normal, 1.25 = zoomed

  const isTop = activeView === 'topHierarchy' || activeView === 'top';
  const currentStage = !isTop ? (stages || []).find(s => s.id === activeView) : null;

  let items = [];
  let title = '';

  if (isTop) {
    title = 'TOP HIERARCHY SUMMARY TIMELINE';
    items = (stages || []).map(stg => {
      const procs = stg.processes || [];
      const totalCt = procs.reduce((acc, p) => acc + safeNum(p.metrics?.ct), 0);
      const totalMt = procs.reduce((acc, p) => acc + safeNum(p.metrics?.mt), 0);
      return {
        id: stg.id,
        name: stg.name || 'Stage',
        ct: parseFloat(totalCt.toFixed(2)),
        mt: parseFloat(totalMt.toFixed(2)),
      };
    });
  } else if (currentStage) {
    const procs = currentStage.processes || [];
    const totalCt = procs.reduce((acc, p) => acc + safeNum(p.metrics?.ct), 0);
    const totalMt = procs.reduce((acc, p) => acc + safeNum(p.metrics?.mt), 0);
    
    title = `${(currentStage.name || 'STAGE').toUpperCase()} TIMELINE — Total C/T: ${totalCt.toFixed(2)}h | Total M/T: ${totalMt.toFixed(2)}h`;
    items = procs.map(p => ({
      id: p.id,
      name: p.name || 'Process Step',
      ct: safeNum(p.metrics?.ct),
      mt: safeNum(p.metrics?.mt),
    }));
  }

  if (items.length === 0) {
    return (
      <div style={{
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FFFFFF',
        borderTop: '1px solid var(--border)',
        color: 'var(--secondary-text)',
        fontSize: '12px',
        userSelect: 'none',
      }}>
        No processes found for timeline rendering
      </div>
    );
  }

  // Wave Layout Geometry
  const Y_WAIT     = 38;   // Top level of wave (Wait)
  const Y_PROC     = 108;  // Bottom level of wave (Processing)
  const PROC_WIDTH = 110 * zoomLevel; // Width of processing segment
  const WAIT_WIDTH = 55 * zoomLevel;  // Width of wait segment
  const LEFT_PAD   = 105;  // Left margin for axis labels
  const SVG_H      = 150;

  const totalWidth = LEFT_PAD + items.length * (PROC_WIDTH + WAIT_WIDTH) + 80;

  // Build continuous square wave path
  let pathD = `M ${LEFT_PAD},${Y_PROC} `;
  let currX = LEFT_PAD;

  items.forEach((item) => {
    const pEnd = currX + PROC_WIDTH;
    const wEnd = pEnd + WAIT_WIDTH;

    pathD += `L ${pEnd},${Y_PROC} `;
    pathD += `L ${pEnd},${Y_WAIT} `;
    pathD += `L ${wEnd},${Y_WAIT} `;
    pathD += `L ${wEnd},${Y_PROC} `;

    currX = wEnd;
  });

  return (
    <div style={{
      height: collapsed ? '36px' : `${SVG_H + 24}px`,
      flexShrink: 0,
      background: '#FFFFFF',
      borderTop: '1px solid var(--border)',
      overflow: 'hidden',
      transition: 'height 200ms cubic-bezier(0.16, 1, 0.3, 1)',
      position: 'relative',
      fontFamily: 'Inter, Arial, sans-serif',
      userSelect: 'none',
      boxShadow: '0 -2px 10px rgba(15,35,55,0.06)',
    }}>
      {/* Timeline Header Banner & Controls */}
      <div style={{
        height: '36px',
        padding: '0 16px',
        fontSize: '11.5px',
        fontWeight: 700,
        color: 'var(--vsm-navy)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#FAFBFD',
        borderBottom: collapsed ? 'none' : '1px solid var(--border-light)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={14} color="var(--vsm-blue)" />
          <span style={{ letterSpacing: '0.4px', textTransform: 'uppercase' }}>{title}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {!collapsed && (
            <button
              onClick={() => setZoomLevel(z => z === 1 ? 1.25 : 1)}
              title="Toggle Timeline Zoom"
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '3px 8px', fontSize: '11px', fontWeight: 600,
                color: 'var(--secondary-text)', borderRadius: 'var(--radius-sm)',
                background: 'transparent', border: '1px solid var(--border-light)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Maximize2 size={11} /> {zoomLevel > 1 ? '100%' : 'Zoom'}
            </button>
          )}

          <button
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand Timeline Panel' : 'Collapse Timeline Panel'}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '3px 8px', fontSize: '11px', fontWeight: 600,
              color: 'var(--vsm-navy)', borderRadius: 'var(--radius-sm)',
              background: 'var(--hover-bg)', border: '1px solid var(--border-light)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--border-light)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
          >
            {collapsed ? (
              <><span>Expand</span> <ChevronUp size={13} /></>
            ) : (
              <><span>Collapse</span> <ChevronDown size={13} /></>
            )}
          </button>
        </div>
      </div>

      {/* SVG Wave Render Area */}
      {!collapsed && (
        <div style={{ height: `${SVG_H - 12}px`, overflowX: 'auto', overflowY: 'hidden' }}>
          <svg width={Math.max(totalWidth, 900)} height={SVG_H - 12} style={{ display: 'block' }}>
            {/* Left Axis Labels & Vertical Line */}
            <text x={LEFT_PAD - 18} y={Y_WAIT + 4} textAnchor="end" fontSize="12" fontWeight="700" fill="#000000">
              Wait
            </text>
            <text x={LEFT_PAD - 18} y={Y_PROC + 4} textAnchor="end" fontSize="12" fontWeight="700" fill="#000000">
              Processing
            </text>
            <line x1={LEFT_PAD} y1={Y_WAIT - 10} x2={LEFT_PAD} y2={Y_PROC} stroke="#000000" strokeWidth="2.5" />

            {/* Bright Yellow Highlights for Wait Segments where M/T > 0 */}
            {items.map((item, i) => {
              const itemX = LEFT_PAD + i * (PROC_WIDTH + WAIT_WIDTH);
              const pEnd  = itemX + PROC_WIDTH;
              const hasWait = item.mt > 0;

              if (!hasWait) return null;

              return (
                <rect
                  key={`yellow_${i}`}
                  x={pEnd}
                  y={Y_WAIT - 12}
                  width={WAIT_WIDTH}
                  height={14}
                  fill="#FFFF00"
                />
              );
            })}

            {/* Continuous Square Wave Path */}
            <path d={pathD} stroke="#000000" strokeWidth="2.5" fill="none" strokeLinecap="square" strokeLinejoin="miter" />

            {/* Values & Process Name Labels */}
            {items.map((item, i) => {
              const itemX = LEFT_PAD + i * (PROC_WIDTH + WAIT_WIDTH);
              const pEnd  = itemX + PROC_WIDTH;
              const procCenter = itemX + PROC_WIDTH / 2;
              const waitCenter = pEnd + WAIT_WIDTH / 2;

              return (
                <g key={item.id || i}>
                  {/* Process Name Label Above Wave */}
                  <text
                    x={procCenter}
                    y={Y_WAIT - 22}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="600"
                    fill="#475569"
                  >
                    {item.name.length > 20 ? item.name.slice(0, 19) + '…' : item.name}
                  </text>

                  {/* Processing C/T Value (Centered on bottom line) */}
                  <text
                    x={procCenter}
                    y={Y_PROC - 6}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill="#000000"
                  >
                    {item.ct}
                  </text>

                  {/* Wait M/T Value (Centered on top line) */}
                  <text
                    x={waitCenter}
                    y={Y_WAIT - 2}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill="#000000"
                  >
                    {item.mt}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}
