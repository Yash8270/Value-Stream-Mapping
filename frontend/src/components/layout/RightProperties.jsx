import React, { useState, useEffect } from 'react';
import useVsmStore from '../../store/useVsmStore';
import { SlidersHorizontal, MousePointerClick, Trash2, Copy, ChevronDown, ChevronRight, Hash, Clock, Users, Percent, ShieldCheck } from 'lucide-react';

function AccordionSection({ title, icon, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{ borderBottom: '1px solid var(--border-light)', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 700, color: 'var(--vsm-navy)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          {icon}
          <span>{title}</span>
        </div>
        {open ? <ChevronDown size={14} color="var(--secondary-text)" /> : <ChevronRight size={14} color="var(--secondary-text)" />}
      </button>

      {open && (
        <div style={{ padding: '4px 14px 14px', animation: 'fadeIn 120ms ease forwards' }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function RightProperties() {
  const { nodes, edges, selectedNodeId, selectedEdgeId, updateNodeData, updateEdgeData, deleteSelected, duplicateNode } = useVsmStore();

  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const selectedEdge = edges.find(e => e.id === selectedEdgeId);

  // Form State
  const [label, setLabel] = useState('');
  const [nodeType, setNodeType] = useState('process');
  const [ct, setCt] = useState(0);
  const [mt, setMt] = useState(0);
  const [ut, setUt] = useState(0);
  const [st, setSt] = useState(0);
  const [op, setOp] = useState(1);
  const [scrap, setScrap] = useState(0);
  const [rft, setRft] = useState(1);
  const [invQty, setInvQty] = useState(0);
  const [invType, setInvType] = useState('WIP');
  const [edgeDir, setEdgeDir] = useState('forward');

  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.data?.label || '');
      setNodeType(selectedNode.data?.nodeType || 'process');
      const m = selectedNode.data?.metrics || {};
      setCt(m.ct ?? 0);
      setMt(m.mt ?? 0);
      setUt(m.ut ?? 0);
      setSt(m.st ?? 0);
      setOp(m.op ?? 1);
      setScrap(m.scrap ?? 0);
      setRft(m.rft ?? 1);
      setInvQty(selectedNode.data?.quantity ?? 0);
      setInvType(selectedNode.data?.inventoryType || 'WIP');
    }
  }, [selectedNodeId, selectedNode]);

  useEffect(() => {
    if (selectedEdge) {
      setEdgeDir(selectedEdge.data?.direction || selectedEdge.direction || 'forward');
    }
  }, [selectedEdgeId, selectedEdge]);

  // Apply Changes Handler
  const handleApplyNode = () => {
    if (!selectedNode) return;

    if (selectedNode.type === 'inventoryNode') {
      updateNodeData(selectedNode.id, {
        quantity: Number(invQty),
        inventoryType: invType,
        label: String(invQty),
      });
    } else {
      updateNodeData(selectedNode.id, {
        label,
        nodeType,
        metrics: {
          ct: Number(ct),
          mt: Number(mt),
          ut: Number(ut),
          st: Number(st),
          op: Number(op),
          scrap: Number(scrap),
          rft: Number(rft),
        },
      });
    }
  };

  const handleApplyEdge = (dir) => {
    if (!selectedEdge) return;
    setEdgeDir(dir);
    updateEdgeData(selectedEdge.id, { direction: dir });
  };

  return (
    <aside style={{
      width: '280px',
      backgroundColor: '#FFFFFF',
      borderLeft: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      userSelect: 'none',
      zIndex: 20,
    }}>
      {/* Inspector Panel Header */}
      <div style={{
        height: '42px',
        padding: '0 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-light)',
        background: '#FAFBFD',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, color: 'var(--vsm-navy)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          <SlidersHorizontal size={14} color="var(--vsm-blue)" />
          <span>Properties Inspector</span>
        </div>

        {(selectedNodeId || selectedEdgeId) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {selectedNodeId && (
              <button
                onClick={() => duplicateNode(selectedNodeId)}
                title="Duplicate node"
                style={{ padding: '4px 6px', borderRadius: 'var(--radius-sm)', background: 'none', border: 'none', color: 'var(--secondary-text)', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <Copy size={14} />
              </button>
            )}
            <button
              onClick={deleteSelected}
              title="Delete selected element"
              style={{ padding: '4px 6px', borderRadius: 'var(--radius-sm)', background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#FEE2E2')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Inspector Panel Body */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* EMPTY STATE */}
        {!selectedNode && !selectedEdge && (
          <div style={{
            padding: '40px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            color: 'var(--secondary-text)',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px',
            }}>
              <MousePointerClick size={24} color="var(--vsm-blue)" />
            </div>

            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
              No element selected
            </span>

            <p style={{ fontSize: '12px', lineHeight: 1.5, color: 'var(--secondary-text)' }}>
              Click any process node, inventory triangle, or flow arrow on the canvas to view and edit properties.
            </p>
          </div>
        )}

        {/* PROCESS NODE PROPERTIES */}
        {selectedNode && selectedNode.type !== 'inventoryNode' && (
          <div>
            {/* SECTION 1: GENERAL */}
            <AccordionSection title="General" icon={<Hash size={13} color="var(--vsm-blue)" />}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--secondary-text)', display: 'block', marginBottom: '4px' }}>
                    Label Name
                  </label>
                  <input
                    type="text"
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                    onBlur={handleApplyNode}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--secondary-text)', display: 'block', marginBottom: '4px' }}>
                    Node Type
                  </label>
                  <select
                    value={nodeType}
                    onChange={e => { setNodeType(e.target.value); handleApplyNode(); }}
                    style={{ width: '100%' }}
                  >
                    <option value="process">Standard Process</option>
                    <option value="assembly">Assembly Stage</option>
                    <option value="quality">Quality Inspection</option>
                    <option value="package_assembly">Package Assembly</option>
                    <option value="supplier">Supplier</option>
                    <option value="customer">Customer</option>
                    <option value="sales">Sales</option>
                    <option value="purchasing">Purchasing</option>
                    <option value="production_control">Production Control</option>
                    <option value="single_batch">Single Batch Stage</option>
                  </select>
                </div>
              </div>
            </AccordionSection>

            {/* SECTION 2: METRICS */}
            <AccordionSection title="Process Metrics" icon={<Clock size={13} color="var(--vsm-process)" />}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--secondary-text)', display: 'block', marginBottom: '4px' }}>
                    Cycle Time (C/T)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={ct}
                    onChange={e => setCt(e.target.value)}
                    onBlur={handleApplyNode}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--secondary-text)', display: 'block', marginBottom: '4px' }}>
                    Machine Time (M/T)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={mt}
                    onChange={e => setMt(e.target.value)}
                    onBlur={handleApplyNode}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--secondary-text)', display: 'block', marginBottom: '4px' }}>
                    Touch Time (U/T)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={ut}
                    onChange={e => setUt(e.target.value)}
                    onBlur={handleApplyNode}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--secondary-text)', display: 'block', marginBottom: '4px' }}>
                    Setup Time (S/T)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={st}
                    onChange={e => setSt(e.target.value)}
                    onBlur={handleApplyNode}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--secondary-text)', display: 'block', marginBottom: '4px' }}>
                    Operators (Op)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={op}
                    onChange={e => setOp(e.target.value)}
                    onBlur={handleApplyNode}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--secondary-text)', display: 'block', marginBottom: '4px' }}>
                    Scrap Rate
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={scrap}
                    onChange={e => setScrap(e.target.value)}
                    onBlur={handleApplyNode}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--secondary-text)', display: 'block', marginBottom: '4px' }}>
                    Rolled First Pass Yield (RFT)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    max="1.0"
                    min="0.0"
                    value={rft}
                    onChange={e => setRft(e.target.value)}
                    onBlur={handleApplyNode}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </AccordionSection>

            {/* SECTION 3: POSITION */}
            <AccordionSection title="Canvas Coordinates" icon={<SlidersHorizontal size={13} color="var(--secondary-text)" />} defaultOpen={false}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--secondary-text)', display: 'block', marginBottom: '4px' }}>
                    X Position
                  </label>
                  <input
                    type="number"
                    value={Math.round(selectedNode.position?.x || 0)}
                    disabled
                    style={{ width: '100%', background: '#F8FAFC', color: 'var(--secondary-text)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--secondary-text)', display: 'block', marginBottom: '4px' }}>
                    Y Position
                  </label>
                  <input
                    type="number"
                    value={Math.round(selectedNode.position?.y || 0)}
                    disabled
                    style={{ width: '100%', background: '#F8FAFC', color: 'var(--secondary-text)' }}
                  />
                </div>
              </div>
            </AccordionSection>
          </div>
        )}

        {/* INVENTORY NODE PROPERTIES */}
        {selectedNode && selectedNode.type === 'inventoryNode' && (
          <div style={{ padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--vsm-navy)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' }}>
              Inventory Triangle Properties
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--secondary-text)', display: 'block', marginBottom: '4px' }}>
                  Inventory Quantity (WIP)
                </label>
                <input
                  type="number"
                  min="0"
                  value={invQty}
                  onChange={e => { setInvQty(e.target.value); }}
                  onBlur={handleApplyNode}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--secondary-text)', display: 'block', marginBottom: '4px' }}>
                  Inventory Type
                </label>
                <select
                  value={invType}
                  onChange={e => { setInvType(e.target.value); handleApplyNode(); }}
                  style={{ width: '100%' }}
                >
                  <option value="WIP">Work in Progress (WIP)</option>
                  <option value="Raw Material">Raw Material</option>
                  <option value="Finished Goods">Finished Goods</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* EDGE / CONNECTION PROPERTIES */}
        {selectedEdge && (
          <div style={{ padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--vsm-navy)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' }}>
              Flow Arrow Properties
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--secondary-text)', display: 'block', marginBottom: '4px' }}>
                  Flow Direction
                </label>
                <select
                  value={edgeDir}
                  onChange={e => handleApplyEdge(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="forward">Forward Flow (→</option>
                  <option value="two-way">Two-Way Information Flow (↔)</option>
                  <option value="reverse">Reverse Push Flow (←)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
