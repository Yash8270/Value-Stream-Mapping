import React from 'react';
import useVsmStore from '../../store/useVsmStore';
import { Layers, Workflow } from 'lucide-react';

export default function ViewSwitcher() {
  const { activeView, setActiveView, stages } = useVsmStore();
  const isTopActive = activeView === 'topHierarchy' || activeView === 'top';

  return (
    <div style={{
      height: '38px',
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 14px',
      gap: '6px',
      overflowX: 'auto',
      flexShrink: 0,
      boxShadow: '0 1px 2px rgba(15,35,55,0.03)',
      userSelect: 'none',
    }}>
      {/* VSM View Bar Label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '11px',
        fontWeight: 700,
        color: 'var(--secondary-text)',
        textTransform: 'uppercase',
        letterSpacing: '0.6px',
        marginRight: '6px',
        flexShrink: 0,
      }}>
        <Layers size={13} color="var(--vsm-navy)" />
        VSM View:
      </div>

      {/* Top Hierarchy Tab Button */}
      <button
        onClick={() => setActiveView('topHierarchy')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: 'var(--radius-md)',
          fontSize: '12.5px',
          fontWeight: isTopActive ? 700 : 500,
          color: isTopActive ? '#FFFFFF' : 'var(--text)',
          backgroundColor: isTopActive ? 'var(--vsm-navy)' : 'transparent',
          border: `1px solid ${isTopActive ? 'var(--vsm-navy)' : 'var(--border-light)'}`,
          cursor: 'pointer',
          transition: 'all var(--transition-fast)',
          boxShadow: isTopActive ? '0 2px 5px rgba(22,50,79,0.25)' : 'none',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => {
          if (!isTopActive) {
            e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
            e.currentTarget.style.borderColor = 'var(--vsm-blue)';
          }
        }}
        onMouseLeave={e => {
          if (!isTopActive) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = 'var(--border-light)';
          }
        }}
      >
        <Workflow size={13} />
        Top Hierarchy
      </button>

      <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border)', margin: '0 2px', flexShrink: 0 }} />

      {/* Dynamic Stage / Subassembly Tabs */}
      {(stages || []).map(stage => {
        const isActive = activeView === stage.id;
        const stageLower = (stage.name || '').toLowerCase();
        let tagColor = 'var(--vsm-process)';
        if (stageLower.includes('assembly') || stageLower.includes('build')) tagColor = 'var(--vsm-assembly)';
        if (stageLower.includes('package')) tagColor = 'var(--vsm-package)';
        if (stageLower.includes('quality')) tagColor = 'var(--vsm-quality)';

        const procCount = stage.processes ? stage.processes.length : 0;

        return (
          <button
            key={stage.id}
            onClick={() => setActiveView(stage.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: 'var(--radius-md)',
              fontSize: '12.5px',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#FFFFFF' : 'var(--text)',
              backgroundColor: isActive ? tagColor : 'transparent',
              border: `1px solid ${isActive ? tagColor : 'var(--border-light)'}`,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                e.currentTarget.style.borderColor = tagColor;
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'var(--border-light)';
              }
            }}
          >
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: isActive ? '#FFFFFF' : tagColor,
              display: 'inline-block',
            }} />
            {stage.name}
            <span style={{
              fontSize: '10.5px',
              fontWeight: 600,
              opacity: isActive ? 0.95 : 0.7,
              marginLeft: '2px',
              background: isActive ? 'rgba(0,0,0,0.2)' : '#F1F5F9',
              color: isActive ? '#FFFFFF' : 'var(--secondary-text)',
              padding: '1px 6px',
              borderRadius: '10px',
            }}>
              {procCount} {procCount === 1 ? 'proc' : 'procs'}
            </span>
          </button>
        );
      })}
    </div>
  );
}
