import React from 'react';
import useVsmStore from '../../store/useVsmStore';
import { LayoutGrid, Maximize2, Plus, Box, Info } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';

export default function CanvasHeader() {
  const { activeView, stages, addNode } = useVsmStore();
  const reactFlow = useReactFlow();

  const isTop = activeView === 'topHierarchy' || activeView === 'top';
  const currentStage = !isTop ? (stages || []).find(s => s.id === activeView) : null;

  const title = isTop ? 'Top Hierarchy Map' : (currentStage?.name || 'Subassembly Diagram');
  const procCount = isTop
    ? (stages || []).reduce((acc, s) => acc + (s.processes ? s.processes.length : 0), 0)
    : (currentStage?.processes ? currentStage.processes.length : 0);

  const invVal = isTop
    ? null
    : (currentStage?.startingInventory !== undefined && currentStage?.startingInventory !== null
        ? currentStage.startingInventory
        : (currentStage?.inventory !== undefined && currentStage?.inventory !== null ? currentStage.inventory : null));

  const handleAddProcess = () => {
    const newNode = {
      id: `proc_${Date.now()}`,
      type: 'processNode',
      position: { x: 250 + Math.random() * 100, y: 180 },
      data: {
        label: isTop ? 'New Assembly Stage' : 'New Process Step',
        nodeType: 'process',
        stageId: !isTop ? activeView : undefined,
        metrics: { ct: 1.0, mt: 0.0, ut: 0.9, st: 0.1, op: 1, scrap: 0, rft: 1.0 },
      },
    };
    addNode(newNode);
  };

  const handleAddInventory = () => {
    const newNode = {
      id: `inv_${Date.now()}`,
      type: 'inventoryNode',
      position: { x: 300 + Math.random() * 80, y: 200 },
      data: { quantity: 15, inventoryType: 'WIP', stageId: !isTop ? activeView : undefined },
    };
    addNode(newNode);
  };

  const handleFitView = () => {
    if (reactFlow && reactFlow.fitView) {
      reactFlow.fitView({ padding: 0.2, duration: 300 });
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: '12px',
      left: '14px',
      right: '14px',
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      pointerEvents: 'none',
    }}>
      {/* Active Context Information Pill */}
      <div style={{
        pointerEvents: 'auto',
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '6px 14px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: isTop ? 'var(--vsm-navy)' : 'var(--vsm-process)',
        }} />
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
          {title}
        </span>

        <div style={{ width: '1px', height: '14px', background: 'var(--border)' }} />

        <span style={{ fontSize: '11.5px', fontWeight: 500, color: 'var(--secondary-text)' }}>
          {procCount} {isTop ? 'Total Processes' : 'Processes'}
        </span>

        {invVal !== null && invVal !== undefined && (
          <>
            <div style={{ width: '1px', height: '14px', background: 'var(--border)' }} />
            <span style={{ fontSize: '11.5px', fontWeight: 500, color: 'var(--vsm-blue)' }}>
              Starting Inventory: <strong>{invVal}</strong>
            </span>
          </>
        )}
      </div>

      {/* Quick Action Toolbar */}
      <div style={{
        pointerEvents: 'auto',
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '4px 6px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}>
        <button
          onClick={handleFitView}
          title="Fit view to all elements"
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '5px 10px', fontSize: '12px', fontWeight: 500,
            color: 'var(--text)', borderRadius: 'var(--radius-md)',
            background: 'transparent',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <Maximize2 size={13} color="var(--vsm-navy)" /> Fit View
        </button>

        <button
          onClick={handleAddProcess}
          title="Add new process node"
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '5px 10px', fontSize: '12px', fontWeight: 500,
            color: 'var(--text)', borderRadius: 'var(--radius-md)',
            background: 'transparent',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <Plus size={13} color="var(--vsm-process)" /> Process
        </button>

        <button
          onClick={handleAddInventory}
          title="Add inventory node"
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '5px 10px', fontSize: '12px', fontWeight: 500,
            color: 'var(--text)', borderRadius: 'var(--radius-md)',
            background: 'transparent',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <Box size={13} color="var(--vsm-inventory)" /> Inventory
        </button>
      </div>
    </div>
  );
}
