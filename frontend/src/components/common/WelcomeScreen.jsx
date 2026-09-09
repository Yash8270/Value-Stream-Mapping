import React from 'react';
import { Activity, FileSpreadsheet, Edit3, Sparkles, ArrowRight, Layers, Workflow, CheckCircle2 } from 'lucide-react';
import useVsmStore from '../../store/useVsmStore';
import { demoVsm } from '../../data/demoVsm';

export default function WelcomeScreen({ onOpenImportModal, onOpenManualModal }) {
  const setVsmModel = useVsmStore(s => s.setVsmModel);

  const handleLoadDemo = () => {
    setVsmModel(demoVsm);
  };

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 50,
      backgroundColor: 'var(--background)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      overflowY: 'auto',
      animation: 'fadeIn 200ms ease forwards',
    }}>
      <div style={{
        maxWidth: '860px',
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
      }}>
        {/* Left Hero Column */}
        <div style={{
          padding: '40px 36px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            {/* Logo Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--vsm-process) 0%, var(--vsm-blue) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 10px rgba(22,169,216,0.35)',
              }}>
                <Activity size={20} color="#FFFFFF" />
              </div>
              <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--vsm-navy)', letterSpacing: '-0.02em' }}>
                VSM Studio
              </span>
            </div>

            <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--vsm-navy)', lineHeight: 1.25, marginBottom: '12px', letterSpacing: '-0.02em' }}>
              Build better manufacturing flows.
            </h1>

            <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: 'var(--secondary-text)', marginBottom: '32px' }}>
              Import production data, generate Value Stream Maps automatically, and refine detailed subassembly timelines visually.
            </p>

            {/* Feature Highlights List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text)' }}>
                <CheckCircle2 size={16} color="var(--vsm-blue)" />
                <span>Automatic Two-Level VSM diagram layout engine</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text)' }}>
                <CheckCircle2 size={16} color="var(--vsm-blue)" />
                <span>Subassembly & Top Hierarchy rectangular wave timelines</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text)' }}>
                <CheckCircle2 size={16} color="var(--vsm-blue)" />
                <span>Excel workbook import & ReportLab vector PDF export</span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '11.5px', color: 'var(--secondary-text)', marginTop: '32px' }}>
            VSM Studio Engineering Edition • Version 2.0
          </div>
        </div>

        {/* Right Actions & Interactive Flow Preview Column */}
        <div style={{
          backgroundColor: '#FAFBFD',
          borderLeft: '1px solid var(--border-light)',
          padding: '40px 36px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--secondary-text)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '16px' }}>
              Get Started
            </div>

            {/* Action 1: Import Excel */}
            <button
              onClick={onOpenImportModal}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
                transition: 'all var(--transition-fast)',
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                e.currentTarget.style.borderColor = 'var(--vsm-blue)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'rgba(22,169,216,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileSpreadsheet size={18} color="var(--vsm-process)" />
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>Import Excel Workbook</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--secondary-text)' }}>Parse stages, processes, and C/T metrics</div>
                </div>
              </div>
              <ArrowRight size={16} color="var(--vsm-blue)" />
            </button>

            {/* Action 2: Create Manually */}
            <button
              onClick={onOpenManualModal}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
                transition: 'all var(--transition-fast)',
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                e.currentTarget.style.borderColor = 'var(--vsm-blue)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'rgba(47,111,173,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Edit3 size={18} color="var(--vsm-blue)" />
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>Create VSM Manually</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--secondary-text)' }}>Interactive 5-step process wizard</div>
                </div>
              </div>
              <ArrowRight size={16} color="var(--vsm-blue)" />
            </button>

            {/* Action 3: Load Demo VSM */}
            <button
              onClick={handleLoadDemo}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--vsm-navy)',
                color: '#FFFFFF',
                border: 'none',
                boxShadow: '0 4px 12px rgba(22,50,79,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#255A8E';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'var(--vsm-navy)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <Sparkles size={16} color="#FDE68A" /> Load Fibre-Q Demo Model
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
