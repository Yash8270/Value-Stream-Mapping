import React from 'react';
import { X, FileText, Image, FileJson, Download, CheckCircle2 } from 'lucide-react';
import useVsmStore from '../../store/useVsmStore';
import { vsmApi } from '../../api/vsmApi';

export default function ExportModal({ isOpen, onClose }) {
  const { nodes, edges, stages, project, vsmId } = useVsmStore();

  if (!isOpen) return null;

  const handleExportJson = () => {
    const data = JSON.stringify({ nodes, edges, stages, project }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vsm_${project?.name || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  const handleExportPdf = async () => {
    try {
      if (vsmId) {
        const res = await vsmApi.exportPdf(vsmId);
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `vsm_report_${project?.name || 'document'}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
          onClose();
          return;
        }
      }
      alert('Generating PDF via browser print view...');
      window.print();
    } catch {
      window.print();
    }
  };

  const handleExportPng = async () => {
    try {
      if (vsmId) {
        const res = await vsmApi.exportPng(vsmId);
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `vsm_diagram_${project?.name || 'image'}.png`;
          a.click();
          URL.revokeObjectURL(url);
          onClose();
          return;
        }
      }
      handleExportJson();
    } catch {
      handleExportJson();
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      backgroundColor: 'rgba(15, 35, 55, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      animation: 'fadeIn 150ms ease forwards',
    }}>
      <div style={{
        width: '100%', maxWidth: '480px', backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#FAFBFD',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700, color: 'var(--vsm-navy)' }}>
            <Download size={18} color="var(--vsm-blue)" />
            <span>Export VSM Report & Data</span>
          </div>

          <button onClick={onClose} style={{ padding: '4px', background: 'none', border: 'none', color: 'var(--secondary-text)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* PDF Option */}
          <button
            onClick={handleExportPdf}
            style={{
              padding: '14px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)',
              backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '14px',
              textAlign: 'left', cursor: 'pointer', transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--vsm-blue)'; e.currentTarget.style.backgroundColor = 'var(--hover-bg)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={22} color="var(--error)" />
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>Multi-Page Vector PDF Report</div>
              <div style={{ fontSize: '12px', color: 'var(--secondary-text)' }}>Page 1: Top Hierarchy, Pages 2..N: Subassemblies</div>
            </div>
          </button>

          {/* PNG Option */}
          <button
            onClick={handleExportPng}
            style={{
              padding: '14px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)',
              backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '14px',
              textAlign: 'left', cursor: 'pointer', transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--vsm-blue)'; e.currentTarget.style.backgroundColor = 'var(--hover-bg)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'rgba(22,169,216,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Image size={22} color="var(--vsm-process)" />
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>High-Resolution PNG Diagram</div>
              <div style={{ fontSize: '12px', color: 'var(--secondary-text)' }}>Export crisp 300 DPI image file</div>
            </div>
          </button>

          {/* JSON Option */}
          <button
            onClick={handleExportJson}
            style={{
              padding: '14px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)',
              backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '14px',
              textAlign: 'left', cursor: 'pointer', transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--vsm-blue)'; e.currentTarget.style.backgroundColor = 'var(--hover-bg)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'rgba(47,111,173,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileJson size={22} color="var(--vsm-blue)" />
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>Raw JSON VSM Data Model</div>
              <div style={{ fontSize: '12px', color: 'var(--secondary-text)' }}>Complete editable model backup</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
