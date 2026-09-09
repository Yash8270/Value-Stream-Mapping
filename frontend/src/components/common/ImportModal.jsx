import React, { useState, useRef } from 'react';
import { X, FileSpreadsheet, Upload, CheckCircle2, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import { useVSM } from '../../context/Context';

export default function ImportModal({ isOpen, onClose }) {
  const { uploadExcel, currentProject } = useVSM();
  const fileInputRef = useRef(null);

  const [status, setStatus] = useState('idle'); // 'idle' | 'uploading' | 'success' | 'error'
  const [stats, setStats] = useState(null);
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  if (!isOpen) return null;

  const handleFileSelect = async (file) => {
    if (!file) return;
    setSelectedFile(file);
    setStatus('uploading');
    setErrors([]);
    setWarnings([]);

    try {
      const res = await uploadExcel(currentProject?.id || null, file);
      if (res.success && res.vsm) {
        setStatus('success');
        setStats(res.stats || { stages: res.vsm.stages?.length || 0, processes: res.vsm.stages?.reduce((a, b) => a + (b.processes?.length || 0), 0) });
      } else {
        setStatus('error');
        setErrors(res.errors || ['Failed to parse Excel file']);
        setWarnings(res.warnings || []);
      }
    } catch (err) {
      setStatus('error');
      setErrors([`Excel Import Error: ${err.message}`]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      handleFileSelect(file);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      backgroundColor: 'rgba(15, 35, 55, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      animation: 'fadeIn 150ms ease forwards',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        animation: 'modalScale 150ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FAFBFD',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700, color: 'var(--vsm-navy)' }}>
            <FileSpreadsheet size={18} color="var(--vsm-process)" />
            <span>Import Excel VSM Workbook</span>
          </div>

          <button
            onClick={onClose}
            style={{ padding: '4px', borderRadius: 'var(--radius-sm)', background: 'none', border: 'none', color: 'var(--secondary-text)', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={e => handleFileSelect(e.target.files?.[0])}
            style={{ display: 'none' }}
          />

          {/* Dropzone */}
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px 20px',
              textAlign: 'center',
              backgroundColor: '#FAFBFD',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              marginBottom: '20px',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--vsm-blue)';
              e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.backgroundColor = '#FAFBFD';
            }}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(22,169,216,0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              <Upload size={24} color="var(--vsm-process)" />
            </div>

            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
              {selectedFile ? selectedFile.name : 'Click to select or drag & drop Excel workbook'}
            </div>

            <div style={{ fontSize: '12px', color: 'var(--secondary-text)' }}>
              Supports .xlsx and .xls workbooks (e.g. VSM_Fibre-Q_2024.xlsx or Book1.xlsx)
            </div>
          </div>

          {/* Status Display */}
          {status === 'uploading' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', fontSize: '13px', color: 'var(--vsm-blue)', background: 'var(--hover-bg)', borderRadius: 'var(--radius-md)' }}>
              <Loader2 size={16} className="spinning-icon" /> Parsing workbook structure & processes…
            </div>
          )}

          {status === 'success' && stats && (
            <div style={{ padding: '14px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#166534', marginBottom: '8px' }}>
                <CheckCircle2 size={16} /> Excel Parsing Complete!
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: '#15803D' }}>
                <div>✓ Detected <strong>{stats.stages || 0}</strong> manufacturing subassembly stages</div>
                <div>✓ Detected <strong>{stats.processes || 0}</strong> total processes with row metrics</div>
                <div>✓ Generated Top Hierarchy Map & Detailed Subassembly Diagrams</div>
              </div>
            </div>
          )}

          {status === 'error' && errors.length > 0 && (
            <div style={{ padding: '14px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#991B1B', marginBottom: '6px' }}>
                <AlertTriangle size={16} /> Import Error
              </div>
              {errors.map((err, i) => (
                <div key={i} style={{ fontSize: '12px', color: '#B91C1C' }}>{err}</div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '10px',
          background: '#FAFBFD',
        }}>
          <button
            onClick={onClose}
            style={{ padding: '6px 14px', fontSize: '13px', fontWeight: 500, color: 'var(--secondary-text)', borderRadius: 'var(--radius-md)', background: 'transparent' }}
          >
            Cancel
          </button>

          {status === 'success' && (
            <button
              onClick={onClose}
              style={{ padding: '7px 16px', fontSize: '13px', fontWeight: 600, color: '#FFFFFF', backgroundColor: 'var(--vsm-navy)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              Open Canvas Diagram <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
