import React, { useState } from 'react';
import { X, Plus, Trash2, Copy, CheckCircle2, ChevronRight, ChevronLeft, Sparkles, Layers, SlidersHorizontal } from 'lucide-react';
import useVsmStore from '../../store/useVsmStore';
import { useVSM } from '../../context/Context';

export default function ManualInputModal({ isOpen, onClose }) {
  const setVsmModel = useVsmStore(s => s.setVsmModel);
  const { createProject, isAuthenticated } = useVSM();

  const [step, setStep] = useState(1); // 1: Project, 2: Stages, 3: Processes, 4: Review
  const [projectName, setProjectName] = useState('Fibre-Q Line');
  const [productName, setProductName] = useState('Fibre-Q');

  const [stages, setStages] = useState([
    {
      id: 'stg_1',
      name: 'Fibre Prep',
      startingInventory: 35,
      inventory: 35,
      processes: [
        { id: 'p1', sequence: 1, name: 'Measure & cut Fibre', metrics: { ct: 0.49, mt: 0, ut: 0.46, st: 0.03, op: 1, scrap: 0, rft: 1.0 } },
        { id: 'p2', sequence: 2, name: 'Strip coating', metrics: { ct: 0.63, mt: 0, ut: 0.60, st: 0.03, op: 1, scrap: 0, rft: 1.0 } },
      ],
    },
    {
      id: 'stg_2',
      name: 'Cell Build',
      startingInventory: 28,
      inventory: 28,
      processes: [
        { id: 'p3', sequence: 1, name: 'Mount cell on carrier', metrics: { ct: 1.2, mt: 0, ut: 1.1, st: 0.1, op: 1, scrap: 0, rft: 1.0 } },
      ],
    },
  ]);

  const [activeStageIdx, setActiveStageIdx] = useState(0);

  if (!isOpen) return null;

  const activeStage = stages[activeStageIdx] || stages[0];

  const handleAddStage = () => {
    const newStage = {
      id: `stg_${Date.now()}`,
      name: `New Stage ${stages.length + 1}`,
      startingInventory: 20,
      inventory: 20,
      processes: [
        { id: `p_${Date.now()}`, sequence: 1, name: 'New Process Step', metrics: { ct: 1.0, mt: 0, ut: 0.9, st: 0.1, op: 1, scrap: 0, rft: 1.0 } },
      ],
    };
    setStages([...stages, newStage]);
    setActiveStageIdx(stages.length);
  };

  const handleRemoveStage = (idx) => {
    if (stages.length <= 1) return;
    const newStages = stages.filter((_, i) => i !== idx);
    setStages(newStages);
    setActiveStageIdx(Math.max(0, idx - 1));
  };

  const handleAddProcess = () => {
    const newProc = {
      id: `p_${Date.now()}`,
      sequence: activeStage.processes.length + 1,
      name: `Process ${activeStage.processes.length + 1}`,
      metrics: { ct: 1.0, mt: 0, ut: 0.9, st: 0.1, op: 1, scrap: 0, rft: 1.0 },
    };
    const updatedStages = stages.map((stg, i) =>
      i === activeStageIdx
        ? { ...stg, processes: [...stg.processes, newProc] }
        : stg
    );
    setStages(updatedStages);
  };

  const handleUpdateProcess = (pIdx, field, val) => {
    const updatedStages = stages.map((stg, i) => {
      if (i === activeStageIdx) {
        const updatedProcs = stg.processes.map((proc, j) => {
          if (j === pIdx) {
            if (field === 'name') return { ...proc, name: val };
            return { ...proc, metrics: { ...proc.metrics, [field]: parseFloat(val) || 0 } };
          }
          return proc;
        });
        return { ...stg, processes: updatedProcs };
      }
      return stg;
    });
    setStages(updatedStages);
  };

  const handleGenerate = async () => {
    const model = {
      id: Date.now().toString(),
      project: { id: 'manual', name: projectName, product: productName },
      nodes: [],
      connections: [],
      stages: stages,
      metadata: { created_via: 'manual_wizard' },
    };

    if (isAuthenticated) {
      try {
        await createProject({
          name: projectName,
          sourceType: 'MANUAL',
          initialModel: model
        });
      } catch {
        setVsmModel(model);
      }
    } else {
      setVsmModel(model);
    }
    onClose();
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
        width: '100%', maxWidth: '820px', backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', maxHeight: '90vh',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#FAFBFD',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700, color: 'var(--vsm-navy)' }}>
            <Sparkles size={18} color="var(--vsm-blue)" />
            <span>Create VSM Manually — Step Wizard</span>
          </div>

          <button onClick={onClose} style={{ padding: '4px', background: 'none', border: 'none', color: 'var(--secondary-text)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div style={{ padding: '12px 20px', background: '#F8FAFC', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '16px' }}>
          {['1. Project', '2. Subassemblies', '3. Process Table', '4. Review & Generate'].map((sName, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: (step === i + 1) ? 700 : 500, color: (step === i + 1) ? 'var(--vsm-navy)' : 'var(--secondary-text)' }}>
              <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: (step === i + 1) ? 'var(--vsm-navy)' : '#E2E8F0', color: (step === i + 1) ? '#FFFFFF' : 'var(--secondary-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>
                {i + 1}
              </span>
              <span>{sName}</span>
            </div>
          ))}
        </div>

        {/* Wizard Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* STEP 1: PROJECT */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: '6px' }}>Project Name</label>
                <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: '6px' }}>Product Line</label>
                <input type="text" value={productName} onChange={e => setProductName(e.target.value)} style={{ width: '100%' }} />
              </div>
            </div>
          )}

          {/* STEP 2: STAGES */}
          {step === 2 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>Subassembly Stages ({stages.length})</span>
                <button onClick={handleAddStage} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: 'var(--hover-bg)', border: '1px solid var(--vsm-blue)', color: 'var(--vsm-blue)', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '12px' }}>
                  <Plus size={14} /> Add Subassembly Stage
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {stages.map((stg, i) => (
                  <div key={stg.id} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '12px', background: '#FFFFFF' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--hover-bg)', color: 'var(--vsm-navy)', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {i + 1}
                    </div>

                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                      <input
                        type="text"
                        value={stg.name}
                        onChange={e => {
                          const val = e.target.value;
                          setStages(stages.map((s, idx) => idx === i ? { ...s, name: val } : s));
                        }}
                        placeholder="Stage Name (e.g. Fibre Prep)"
                      />
                      <input
                        type="number"
                        value={stg.startingInventory}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setStages(stages.map((s, idx) => idx === i ? { ...s, startingInventory: val, inventory: val } : s));
                        }}
                        placeholder="Starting Inventory"
                      />
                    </div>

                    <button onClick={() => handleRemoveStage(i)} disabled={stages.length <= 1} style={{ padding: '6px', color: 'var(--error)', background: 'none', border: 'none', cursor: stages.length > 1 ? 'pointer' : 'not-allowed', opacity: stages.length > 1 ? 1 : 0.4 }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: SPREADSHEET PROCESS TABLE */}
          {step === 3 && (
            <div>
              {/* Stage Sub Tabs */}
              <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', marginBottom: '16px' }}>
                {stages.map((stg, i) => (
                  <button
                    key={stg.id}
                    onClick={() => setActiveStageIdx(i)}
                    style={{
                      padding: '5px 12px', borderRadius: 'var(--radius-md)', fontSize: '12.5px', fontWeight: activeStageIdx === i ? 700 : 500,
                      color: activeStageIdx === i ? '#FFFFFF' : 'var(--text)',
                      background: activeStageIdx === i ? 'var(--vsm-navy)' : '#F1F5F9',
                    }}
                  >
                    {stg.name} ({stg.processes.length})
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)' }}>
                  Processes for {activeStage.name}
                </span>
                <button onClick={handleAddProcess} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', background: 'var(--vsm-blue)', color: '#FFFFFF', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: 600 }}>
                  <Plus size={14} /> Add Process Row
                </button>
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#FAFBFD', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', fontSize: '10px', color: 'var(--secondary-text)' }}>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Seq</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Process Name</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>C/T</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>M/T</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>U/T</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>S/T</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Op</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Scrap</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>RFT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeStage.processes.map((p, pIdx) => (
                      <tr key={p.id || pIdx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '6px 8px', color: 'var(--secondary-text)', fontWeight: 600 }}>{pIdx + 1}</td>
                        <td style={{ padding: '6px 8px' }}>
                          <input type="text" value={p.name} onChange={e => handleUpdateProcess(pIdx, 'name', e.target.value)} style={{ width: '100%', padding: '4px' }} />
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <input type="number" step="0.01" value={p.metrics.ct} onChange={e => handleUpdateProcess(pIdx, 'ct', e.target.value)} style={{ width: '60px', textAlign: 'right', padding: '4px' }} />
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <input type="number" step="0.01" value={p.metrics.mt} onChange={e => handleUpdateProcess(pIdx, 'mt', e.target.value)} style={{ width: '60px', textAlign: 'right', padding: '4px' }} />
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <input type="number" step="0.01" value={p.metrics.ut} onChange={e => handleUpdateProcess(pIdx, 'ut', e.target.value)} style={{ width: '60px', textAlign: 'right', padding: '4px' }} />
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <input type="number" step="0.01" value={p.metrics.st} onChange={e => handleUpdateProcess(pIdx, 'st', e.target.value)} style={{ width: '60px', textAlign: 'right', padding: '4px' }} />
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <input type="number" value={p.metrics.op} onChange={e => handleUpdateProcess(pIdx, 'op', e.target.value)} style={{ width: '45px', textAlign: 'right', padding: '4px' }} />
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <input type="number" step="0.01" value={p.metrics.scrap} onChange={e => handleUpdateProcess(pIdx, 'scrap', e.target.value)} style={{ width: '55px', textAlign: 'right', padding: '4px' }} />
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <input type="number" step="0.01" value={p.metrics.rft} onChange={e => handleUpdateProcess(pIdx, 'rft', e.target.value)} style={{ width: '55px', textAlign: 'right', padding: '4px' }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & GENERATE */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#166534', marginBottom: '6px' }}>Ready to Generate VSM!</div>
                <div style={{ fontSize: '12.5px', color: '#15803D' }}>
                  Project <strong>{projectName}</strong> ({productName}) with <strong>{stages.length} stages</strong> and <strong>{stages.reduce((a, b) => a + b.processes.length, 0)} total processes</strong>.
                </div>
              </div>

              {stages.map((stg, i) => (
                <div key={i} style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--vsm-navy)' }}>{stg.name} (Starting Inv: {stg.startingInventory})</div>
                  <div style={{ fontSize: '12px', color: 'var(--secondary-text)', marginTop: '2px' }}>
                    {stg.processes.map(p => p.name).join(' → ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-light)', background: '#FAFBFD', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', opacity: step === 1 ? 0.5 : 1 }}>
            <ChevronLeft size={14} /> Back
          </button>

          {step < 4 ? (
            <button onClick={() => setStep(s => Math.min(4, s + 1))} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 16px', borderRadius: 'var(--radius-md)', background: 'var(--vsm-navy)', color: '#FFFFFF', fontWeight: 600 }}>
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button onClick={handleGenerate} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 18px', borderRadius: 'var(--radius-md)', background: 'var(--vsm-blue)', color: '#FFFFFF', fontWeight: 700 }}>
              <Sparkles size={16} /> Generate VSM Canvas
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
