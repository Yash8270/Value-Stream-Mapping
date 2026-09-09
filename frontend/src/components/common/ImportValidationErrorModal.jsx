import React from 'react';
import { AlertTriangle, CheckCircle2, XCircle, X } from 'lucide-react';

export default function ImportValidationErrorModal({ isOpen, onClose, errorDetail }) {
  if (!isOpen) return null;

  const missingList = errorDetail?.missing || (errorDetail?.errorDetail?.missing) || [];
  const presentList = errorDetail?.present || (errorDetail?.errorDetail?.present) || [];
  const message = errorDetail?.message || errorDetail?.errorDetail?.message || (typeof errorDetail === 'string' ? errorDetail : "Not enough data is provided to generate the VSM.");

  const allCategories = [
    { key: 'Process data', label: 'Process data' },
    { key: 'Process flow', label: 'Process flow' },
    { key: 'Inventory information', label: 'Inventory information' },
    { key: 'VSM structure', label: 'VSM structure' },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 4000,
      backgroundColor: 'rgba(15, 35, 55, 0.7)',
      backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      animation: 'fadeIn 150ms ease forwards',
    }}>
      <div style={{
        width: '100%', maxWidth: '480px', backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border)', overflow: 'hidden',
        animation: 'modalScale 150ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 28px 16px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle size={22} color="#DC2626" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--vsm-navy)', marginBottom: '2px' }}>
                Unable to Generate VSM
              </h2>
              <span style={{ fontSize: '12px', color: '#DC2626', fontWeight: 600 }}>
                Import Validation Failed
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ padding: '4px', background: 'none', border: 'none', color: 'var(--secondary-text)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 28px 24px' }}>
          <p style={{ fontSize: '13.5px', lineHeight: 1.5, color: 'var(--text)', marginBottom: '18px' }}>
            {message}
          </p>

          <div style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            marginBottom: '20px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--secondary-text)', marginBottom: '12px' }}>
              Validation Status Checklist:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {allCategories.map(cat => {
                const isMissing = missingList.some(m => m.toLowerCase().includes(cat.key.toLowerCase()));
                const isPresent = presentList.some(p => p.toLowerCase().includes(cat.key.toLowerCase())) || (!isMissing && missingList.length > 0);

                return (
                  <div key={cat.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 600 }}>
                    {isMissing ? (
                      <XCircle size={17} color="#DC2626" />
                    ) : (
                      <CheckCircle2 size={17} color="#16A34A" />
                    )}
                    <span style={{ color: isMissing ? '#DC2626' : '#1E293B' }}>
                      {cat.label} {isMissing ? '(Missing)' : '(Present)'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <p style={{ fontSize: '12.5px', color: 'var(--secondary-text)', lineHeight: 1.5, marginBottom: '24px' }}>
            Please ensure your Excel or JSON file includes explicit process sequence order, inventory values, and stage structure, then try again.
          </p>

          {/* Action Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 24px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--vsm-navy)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '13.5px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(22,50,79,0.2)',
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
