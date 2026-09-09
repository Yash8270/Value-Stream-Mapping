import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, FileSpreadsheet, Sparkles, Activity } from 'lucide-react';

export default function UploadProgressModal({ isOpen, fileName = 'VSM Data File', type = 'EXCEL', onComplete }) {
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setProgress(15);
      return;
    }

    const t1 = setTimeout(() => {
      setStep(2);
      setProgress(55);
    }, 400);

    const t2 = setTimeout(() => {
      setStep(3);
      setProgress(88);
    }, 900);

    const t3 = setTimeout(() => {
      setProgress(100);
    }, 1400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const steps = [
    { id: 1, label: `Reading ${type === 'EXCEL' ? 'Excel workbook & tables' : 'JSON model'}` },
    { id: 2, label: 'Validating Process Data & WIP Inventory' },
    { id: 3, label: 'Generating interactive VSM diagram & hierarchy' },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 4000,
      backgroundColor: 'rgba(15, 35, 55, 0.72)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      animation: 'fadeIn 180ms ease forwards',
    }}>
      <div style={{
        width: '100%', maxWidth: '440px', backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border)', padding: '32px 28px',
        animation: 'modalScale 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Animated Glow Halo */}
        <div style={{
          position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)',
          width: '200px', height: '120px', background: 'radial-gradient(circle, rgba(22,169,216,0.25) 0%, transparent 70%)',
          pointerEvents: 'none', filter: 'blur(20px)',
        }} />

        {/* Central Animated Icon with Pulse Wave */}
        <div style={{
          position: 'relative', width: '64px', height: '64px', margin: '0 auto 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            position: 'absolute', inset: -6, borderRadius: '50%',
            background: 'rgba(22, 169, 216, 0.15)',
            animation: 'pulseGlow 2s infinite',
          }} />
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--vsm-navy) 0%, var(--vsm-blue) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(22,50,79,0.25)',
          }}>
            {progress === 100 ? (
              <CheckCircle2 size={28} color="#4ADE80" className="animate-fade-in" />
            ) : (
              <FileSpreadsheet size={26} color="#FFFFFF" className="float-icon" />
            )}
          </div>
        </div>

        <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--vsm-navy)', marginBottom: '4px' }}>
          {progress === 100 ? 'VSM Model Ready!' : 'Analyzing & Building VSM'}
        </h3>
        <p style={{ fontSize: '12.5px', color: 'var(--secondary-text)', marginBottom: '22px' }}>
          {fileName}
        </p>

        {/* Dynamic Progress Bar */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '11.5px', fontWeight: 700, color: 'var(--vsm-navy)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Sparkles size={13} color="var(--vsm-process)" /> Processing Stages
            </span>
            <span style={{ color: 'var(--vsm-process)', fontVariantNumeric: 'tabular-nums' }}>{progress}%</span>
          </div>

          <div style={{
            width: '100%', height: '8px', backgroundColor: '#F1F5F9',
            borderRadius: '999px', overflow: 'hidden', border: '1px solid var(--border-light)'
          }}>
            <div
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Checkpoints List */}
        <div style={{
          backgroundColor: '#F8FAFC', border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-lg)', padding: '14px 16px', textAlign: 'left',
          display: 'flex', flexDirection: 'column', gap: '10px'
        }}>
          {steps.map((s) => {
            const isCompleted = step > s.id || progress === 100;
            const isCurrent = step === s.id && progress < 100;

            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px' }}>
                {isCompleted ? (
                  <CheckCircle2 size={16} color="#16A34A" />
                ) : isCurrent ? (
                  <Loader2 size={16} color="var(--vsm-process)" className="spinning-icon" />
                ) : (
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1.5px solid #CBD5E1' }} />
                )}
                <span style={{
                  fontWeight: isCurrent || isCompleted ? 600 : 400,
                  color: isCurrent ? 'var(--vsm-navy)' : (isCompleted ? '#334155' : '#94A3B8'),
                  transition: 'color 0.2s ease',
                }}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
