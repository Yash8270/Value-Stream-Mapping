import React, { useState } from 'react';
import { 
  Square, 
  Layers, 
  ShieldCheck, 
  PackageCheck, 
  Triangle, 
  Building2, 
  Users, 
  ShoppingBag, 
  Truck, 
  Cpu, 
  Boxes, 
  ArrowRight, 
  ArrowLeftRight, 
  Type, 
  StickyNote, 
  ChevronLeft, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function LeftToolbar() {
  const [collapsed, setCollapsed] = useState(false);

  const onDragStart = (event, nodeType, label) => {
    event.dataTransfer.setData('application/reactflow/type', nodeType);
    event.dataTransfer.setData('application/reactflow/label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  const vsmElements = [
    { type: 'process', label: 'Process', icon: <Square size={16} color="var(--vsm-process)" />, bg: 'rgba(22,169,216,0.1)' },
    { type: 'assembly', label: 'Assembly', icon: <Layers size={16} color="var(--vsm-assembly)" />, bg: 'rgba(75,114,181,0.1)' },
    { type: 'quality', label: 'Quality', icon: <ShieldCheck size={16} color="var(--vsm-quality)" />, bg: 'rgba(245,183,0,0.15)' },
    { type: 'package_assembly', label: 'Package', icon: <PackageCheck size={16} color="var(--vsm-package)" />, bg: 'rgba(138,105,0,0.12)' },
    { type: 'inventory', label: 'Inventory', icon: <Triangle size={16} color="var(--vsm-inventory)" />, bg: 'rgba(91,155,213,0.12)' },
    { type: 'supplier', label: 'Supplier', icon: <Building2 size={16} color="var(--vsm-navy)" />, bg: 'rgba(22,50,79,0.1)' },
    { type: 'customer', label: 'Customer', icon: <Users size={16} color="var(--vsm-navy)" />, bg: 'rgba(22,50,79,0.1)' },
    { type: 'sales', label: 'Sales', icon: <ShoppingBag size={16} color="var(--vsm-blue)" />, bg: 'rgba(47,111,173,0.1)' },
    { type: 'purchasing', label: 'Purchasing', icon: <Truck size={16} color="var(--vsm-blue)" />, bg: 'rgba(47,111,173,0.1)' },
    { type: 'production_control', label: 'Prod Ctrl', icon: <Cpu size={16} color="var(--vsm-blue)" />, bg: 'rgba(47,111,173,0.1)' },
    { type: 'single_batch', label: 'Single Batch', icon: <Boxes size={16} color="var(--vsm-blue)" />, bg: 'rgba(47,111,173,0.1)' },
  ];

  const flowElements = [
    { type: 'arrow', label: 'Arrow', icon: <ArrowRight size={16} color="var(--vsm-navy)" /> },
    { type: 'twoway', label: 'Two-way', icon: <ArrowLeftRight size={16} color="var(--vsm-navy)" /> },
  ];

  const otherElements = [
    { type: 'text', label: 'Text Box', icon: <Type size={16} color="var(--secondary-text)" /> },
    { type: 'note', label: 'Note', icon: <StickyNote size={16} color="var(--vsm-quality)" /> },
  ];

  return (
    <aside style={{
      width: collapsed ? '60px' : '220px',
      backgroundColor: '#FFFFFF',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      transition: 'width 200ms ease',
      userSelect: 'none',
      position: 'relative',
      zIndex: 20,
    }}>
      {/* Header & Collapse Toggle Button */}
      <div style={{
        height: '42px',
        padding: '0 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        borderBottom: '1px solid var(--border-light)',
      }}>
        {!collapsed && (
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--secondary-text)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Tool Palette
          </span>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand Toolbar' : 'Collapse Toolbar'}
          style={{
            background: 'var(--hover-bg)',
            border: 'none',
            color: 'var(--vsm-navy)',
            width: '26px',
            height: '26px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--border-light)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Tool Palette Items Container */}
      <div style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '10px 6px' : '12px' }}>
        {/* VSM ELEMENTS SECTION */}
        <div style={{ marginBottom: '16px' }}>
          {!collapsed && (
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--secondary-text)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
              VSM Elements
            </div>
          )}

          <div style={{
            display: collapsed ? 'flex' : 'grid',
            flexDirection: collapsed ? 'column' : 'none',
            gridTemplateColumns: collapsed ? 'none' : '1fr 1fr',
            gap: '6px',
          }}>
            {vsmElements.map((item) => (
              <div
                key={item.type}
                draggable
                onDragStart={(e) => onDragStart(e, item.type, item.label)}
                title={collapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: collapsed ? '8px' : '7px 8px',
                  borderRadius: 'var(--radius-md)',
                  background: '#FFFFFF',
                  border: '1px solid var(--border-light)',
                  cursor: 'grab',
                  transition: 'all var(--transition-fast)',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                  e.currentTarget.style.borderColor = 'var(--vsm-blue)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                  e.currentTarget.style.borderColor = 'var(--border-light)';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: item.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {item.icon}
                </div>

                {!collapsed && (
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.label}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* FLOW SECTION */}
        <div style={{ marginBottom: '16px' }}>
          {!collapsed && (
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--secondary-text)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
              Flow Connectors
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {flowElements.map((item) => (
              <div
                key={item.type}
                draggable
                onDragStart={(e) => onDragStart(e, item.type, item.label)}
                title={collapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: collapsed ? '8px' : '7px 10px',
                  borderRadius: 'var(--radius-md)',
                  background: '#FFFFFF',
                  border: '1px solid var(--border-light)',
                  cursor: 'grab',
                  transition: 'all var(--transition-fast)',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                  e.currentTarget.style.borderColor = 'var(--vsm-blue)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                  e.currentTarget.style.borderColor = 'var(--border-light)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div style={{ width: '24px', height: '24px', borderRadius: 'var(--radius-sm)', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.icon}
                </div>
                {!collapsed && <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)' }}>{item.label}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* OTHER SECTION */}
        <div>
          {!collapsed && (
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--secondary-text)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
              Annotations
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {otherElements.map((item) => (
              <div
                key={item.type}
                draggable
                onDragStart={(e) => onDragStart(e, item.type, item.label)}
                title={collapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: collapsed ? '8px' : '7px 10px',
                  borderRadius: 'var(--radius-md)',
                  background: '#FFFFFF',
                  border: '1px solid var(--border-light)',
                  cursor: 'grab',
                  transition: 'all var(--transition-fast)',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                  e.currentTarget.style.borderColor = 'var(--vsm-blue)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                  e.currentTarget.style.borderColor = 'var(--border-light)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div style={{ width: '24px', height: '24px', borderRadius: 'var(--radius-sm)', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.icon}
                </div>
                {!collapsed && <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)' }}>{item.label}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
