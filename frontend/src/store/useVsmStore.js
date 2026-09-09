import { create } from 'zustand';
import { temporal } from 'zundo';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';

function getProcessNodeType(process) {
  const name = (process?.name || '').toLowerCase();
  if (
    name.includes("inspection") ||
    name.includes("test") ||
    name.includes("quality") ||
    name.includes("vswr") ||
    name.includes("leak") ||
    name.includes("check")
  ) {
    return "qualityProcess";
  }
  return "process";
}

// Helper: Build a detailed subassembly diagram for a stage from stage.processes
export function generateSubassemblyDiagram(stage) {
  if (!stage) return { nodes: [], edges: [] };
  const processes = stage.processes || [];
  const nodes = [];
  const edges = [];

  const startX = 80;
  const startY = 160;
  const processGap = 260;

  const stgInv = stage.startingInventory !== undefined && stage.startingInventory !== null
    ? stage.startingInventory
    : (stage.starting_inventory !== undefined && stage.starting_inventory !== null
      ? stage.starting_inventory
      : (stage.inventory !== undefined && stage.inventory !== null 
        ? stage.inventory 
        : (processes[0]?.metrics?.inventory_after ?? 25)));

  // 1. Add Subassembly Input Inventory Box / Triangle
  const startInvId = `${stage.id}-inv-start`;
  nodes.push({
    id: startInvId,
    type: 'inventoryNode',
    position: { x: startX, y: startY + 15 },
    data: {
      quantity: stgInv,
      inventoryType: 'WIP',
      stageId: stage.id,
      label: `${stage.name} Inventory`,
    }
  });

  const processStartX = startX + 160;
  let prevNodeId = startInvId;

  processes.forEach((p, index) => {
    const currX = processStartX + index * processGap;

    const isQuality = getProcessNodeType(p) === 'qualityProcess';
    const stageLower = (stage.name || '').toLowerCase();
    const nodeType = isQuality
      ? 'quality'
      : (stageLower.includes('package') ? 'package_assembly' : (stageLower.includes('assembly') || stageLower.includes('build') ? 'assembly' : 'process'));

    const procNodeId = `${stage.id}-process-${p.sequence || index + 1}`;

    nodes.push({
      id: procNodeId,
      type: 'processNode',
      position: { x: currX, y: startY },
      data: {
        label: p.name,
        nodeType: nodeType,
        stageId: stage.id,
        processId: p.id || `p_${index + 1}`,
        sequence: p.sequence || index + 1,
        metrics: p.metrics || { ct: 0, mt: 0, ut: 0, st: 0, op: 1, scrap: 0, rft: 1 },
      },
    });

    if (index === 0) {
      // Connect subassembly input inventory box to the first process
      edges.push({
        id: `${stage.id}-edge-startInv-${procNodeId}`,
        source: startInvId,
        target: procNodeId,
        type: 'standard',
        data: { direction: 'forward' }
      });
    } else {
      let invQty = p.metrics?.inventory_after;
      if (invQty !== undefined && invQty !== null) {
        const invId = `${stage.id}-inv-${index}`;
        const invX = currX - processGap / 2;

        nodes.push({
          id: invId,
          type: 'inventoryNode',
          position: { x: invX, y: startY + 15 },
          data: { quantity: invQty, inventoryType: 'WIP', stageId: stage.id },
        });

        edges.push({
          id: `${stage.id}-edge-${prevNodeId}-inv`,
          source: prevNodeId,
          target: invId,
          type: 'standard',
          data: { direction: 'forward' }
        });

        edges.push({
          id: `${stage.id}-edge-inv-${procNodeId}`,
          source: invId,
          target: procNodeId,
          type: 'standard',
          data: { direction: 'forward' }
        });
      } else {
        edges.push({
          id: `${stage.id}-edge-${prevNodeId}-${procNodeId}`,
          source: prevNodeId,
          target: procNodeId,
          type: 'standard',
          data: { direction: 'forward' }
        });
      }
    }

    prevNodeId = procNodeId;
  });

  return { nodes, edges };
}

// Helper: Generate Top Hierarchy layout
export function generateTopHierarchyDiagram(stages) {
  const nodes = [
    { id: 'supplier',        type: 'processNode',   position: { x: 60,  y: 60  }, data: { label: 'Supplier',                    nodeType: 'supplier'          } },
    { id: 'customer',        type: 'processNode',   position: { x: 900, y: 60  }, data: { label: 'Customer',                    nodeType: 'customer'          } },
    { id: 'sales',           type: 'processNode',   position: { x: 700, y: 60  }, data: { label: 'Sales',                       nodeType: 'sales'             } },
    { id: 'purchasing',      type: 'processNode',   position: { x: 60,  y: 180 }, data: { label: 'Purchasing',                  nodeType: 'purchasing'        } },
    { id: 'prod_control',    type: 'processNode',   position: { x: 300, y: 180 }, data: { label: 'Production Control',          nodeType: 'production_control' } },
    { id: 'single_batch',    type: 'processNode',   position: { x: 300, y: 310 }, data: { label: 'Single Batch',                nodeType: 'single_batch'      } },
  ];

  const connections = [
    { id: 'e_sup_pur',  source: 'supplier',     target: 'purchasing',    type: 'standard', data: { direction: 'forward'  } },
    { id: 'e_pur_pc',   source: 'purchasing',   target: 'prod_control',  type: 'standard', data: { direction: 'forward'  } },
    { id: 'e_cust_sal', source: 'customer',     target: 'sales',         type: 'standard', data: { direction: 'two-way'  } },
    { id: 'e_sal_pc',   source: 'sales',        target: 'prod_control',  type: 'standard', data: { direction: 'forward'  } },
    { id: 'e_pc_sb',    source: 'prod_control', target: 'single_batch',  type: 'standard', data: { direction: 'forward'  } },
  ];

  const startX = 60;
  const startY = 460;
  const spacingX = 260;
  const spacingY = 160;

  let prevStageId = 'single_batch';

  (stages || []).forEach((stg, i) => {
    const rowIdx = Math.floor(i / 3);
    const colIdx = i % 3;
    const currX = startX + (colIdx * spacingX);
    const currY = startY + (rowIdx * spacingY);

    const firstProcMetrics = stg.processes && stg.processes[0] ? stg.processes[0].metrics : null;
    const stageLower = (stg.name || '').toLowerCase();
    const nodeType = stageLower.includes('package') ? 'package_assembly' : (stageLower.includes('assembly') || stageLower.includes('build') ? 'assembly' : 'process');

    nodes.push({
      id: stg.id,
      type: 'processNode',
      position: { x: currX, y: currY },
      data: { label: stg.name, nodeType, stageId: stg.id, metrics: firstProcMetrics, isStageBox: true },
    });

    const stgInv = stg.starting_inventory ?? stg.startingInventory ?? stg.inventory ?? (firstProcMetrics?.inventory_after ?? 25);
    const invId = `inv_top_${stg.id}`;
    nodes.push({
      id: invId,
      type: 'inventoryNode',
      position: { x: currX + 135, y: currY - 20 },
      data: { quantity: stgInv, inventoryType: 'WIP', stageId: stg.id }
    });

    connections.push({
      id: `e_${prevStageId}_${stg.id}`,
      source: prevStageId,
      target: stg.id,
      type: 'standard',
      data: { direction: 'forward' }
    });
    prevStageId = stg.id;
  });

  return { nodes, connections };
}

const useVsmStore = create(
  temporal(
    (set, get) => ({
      // Active View State: 'topHierarchy' or stageId (e.g. 'fibre_prep')
      activeView: 'topHierarchy',
      selectedStageId: null,
      
      // Store Layout Separation
      topHierarchyLayout: { nodes: [], edges: [] },
      stageLayouts: {}, // Record<stageId, { nodes: [], edges: [] }>

      // Currently active React Flow elements for rendered canvas
      nodes: [],
      edges: [],
      
      // Manufacturing Data Model
      stages: [],
      project: null,
      vsmId: null,

      // UI Selection State
      selectedNodeId: null,
      selectedEdgeId: null,
      saveStatus: 'idle',

      // Set active view ('topHierarchy' or stageId)
      setActiveView: (viewId) => {
        const { activeView, nodes, edges, topHierarchyLayout, stageLayouts, stages } = get();
        if (activeView === viewId) return;

        // 1. Save current node positions back to layout storage
        let newTopLayout = topHierarchyLayout || { nodes: [], edges: [] };
        let newStageLayouts = { ...(stageLayouts || {}) };

        if (activeView === 'topHierarchy') {
          newTopLayout = { nodes, edges };
        } else {
          newStageLayouts[activeView] = { nodes, edges };
        }

        // 2. Load target layout
        let targetNodes = [];
        let targetEdges = [];
        let targetStageId = null;

        if (viewId === 'topHierarchy') {
          targetNodes = newTopLayout.nodes || [];
          targetEdges = newTopLayout.edges || [];
        } else {
          targetStageId = viewId;
          if (!newStageLayouts[viewId]) {
            const stg = (stages || []).find(s => s.id === viewId);
            if (stg) {
              newStageLayouts[viewId] = generateSubassemblyDiagram(stg);
            }
          }
          if (newStageLayouts[viewId]) {
            targetNodes = newStageLayouts[viewId].nodes || [];
            targetEdges = newStageLayouts[viewId].edges || [];
          }
        }

        set({
          activeView: viewId,
          selectedStageId: targetStageId,
          topHierarchyLayout: newTopLayout,
          stageLayouts: newStageLayouts,
          nodes: targetNodes,
          edges: targetEdges,
          selectedNodeId: null,
          selectedEdgeId: null,
        });
      },

      // React Flow handlers
      onNodesChange: (changes) => {
        set({ nodes: applyNodeChanges(changes, get().nodes || []), saveStatus: 'unsaved' });
      },
      onEdgesChange: (changes) => {
        set({ edges: applyEdgeChanges(changes, get().edges || []), saveStatus: 'unsaved' });
      },
      onConnect: (connection) => {
        set({
          edges: addEdge({ ...connection, type: 'standard', data: { direction: 'forward' } }, get().edges || []),
          saveStatus: 'unsaved',
        });
      },

      // Node ops
      addNode: (node) => set({ nodes: [...(get().nodes || []), node], saveStatus: 'unsaved' }),

      updateNodeData: (id, data) => {
        const currentNodes = get().nodes || [];
        const updatedNodes = currentNodes.map(n => n.id === id ? { ...n, data: { ...n.data, ...data } } : n);
        set({ nodes: updatedNodes, saveStatus: 'unsaved' });

        const targetNode = updatedNodes.find(n => n.id === id);
        if (!targetNode) return;

        const { activeView, stages } = get();
        const currentStages = stages || [];

        if (targetNode.type === 'inventoryNode' && data.quantity !== undefined) {
          const qty = Number(data.quantity);
          if (activeView !== 'topHierarchy') {
            set({
              stages: currentStages.map(s => s.id === activeView ? { ...s, startingInventory: qty, inventory: qty } : s)
            });
          } else if (targetNode.data?.stageId) {
            set({
              stages: currentStages.map(s => s.id === targetNode.data.stageId ? { ...s, startingInventory: qty, inventory: qty } : s)
            });
          }
        }

        if (targetNode.type === 'processNode' && data.metrics) {
          if (activeView !== 'topHierarchy') {
            set({
              stages: currentStages.map(s => {
                if (s.id === activeView) {
                  return {
                    ...s,
                    processes: (s.processes || []).map(p => {
                      if (p.name === targetNode.data.label || p.id === targetNode.data.processId || p.sequence === targetNode.data.sequence) {
                        return { ...p, metrics: { ...p.metrics, ...data.metrics } };
                      }
                      return p;
                    })
                  };
                }
                return s;
              })
            });
          }
        }
      },

      deleteNode: (id) =>
        set({
          nodes: (get().nodes || []).filter(n => n.id !== id),
          edges: (get().edges || []).filter(e => e.source !== id && e.target !== id),
          selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
          saveStatus: 'unsaved',
        }),

      duplicateNode: (id) => {
        const node = (get().nodes || []).find(n => n.id === id);
        if (node) {
          const newNode = {
            ...node,
            id: `${node.id}_copy_${Date.now()}`,
            position: { x: node.position.x + 60, y: node.position.y + 40 },
            selected: true,
          };
          set({
            nodes: [...(get().nodes || []).map(n => ({ ...n, selected: false })), newNode],
            selectedNodeId: newNode.id,
            saveStatus: 'unsaved',
          });
        }
      },

      // Edge ops
      updateEdgeData: (id, data) =>
        set({
          edges: (get().edges || []).map(e => e.id === id ? { ...e, data: { ...e.data, ...data } } : e),
          saveStatus: 'unsaved',
        }),

      deleteEdge: (id) =>
        set({
          edges: (get().edges || []).filter(e => e.id !== id),
          selectedEdgeId: get().selectedEdgeId === id ? null : get().selectedEdgeId,
          saveStatus: 'unsaved',
        }),

      // Stage/process ops
      updateStage: (stageId, data) =>
        set({
          stages: (get().stages || []).map(s => s.id === stageId ? { ...s, ...data } : s),
          saveStatus: 'unsaved',
        }),

      updateProcess: (stageId, processId, data) =>
        set({
          stages: (get().stages || []).map(s =>
            s.id === stageId
              ? { ...s, processes: (s.processes || []).map(p => p.id === processId ? { ...p, ...data } : p) }
              : s
          ),
          saveStatus: 'unsaved',
        }),

      // Bulk Set VSM Model
      setVsmModel: (model) => {
        if (!model) return;

        const stages = model.stages || [];
        const rawNodes = model.nodes || [];
        const rawConnections = model.connections || model.edges || [];

        let topHierarchyLayout = { nodes: [], edges: [] };

        if (rawNodes.length > 0) {
          const formattedNodes = rawNodes.map(n => ({
            id: n.id,
            type: n.type || (n.data?.quantity !== undefined ? 'inventoryNode' : 'processNode'),
            position: n.position || { x: 100, y: 100 },
            data: n.data || { label: n.label || 'Node', nodeType: 'process' },
          }));
          const formattedEdges = rawConnections.map(c => ({
            id: c.id || `e_${c.source}_${c.target}`,
            source: c.source,
            target: c.target,
            type: c.type || 'standard',
            data: c.data || { direction: c.direction || 'forward' }
          }));
          topHierarchyLayout = { nodes: formattedNodes, edges: formattedEdges };
        } else {
          const generatedTop = generateTopHierarchyDiagram(stages);
          topHierarchyLayout = { nodes: generatedTop.nodes, edges: generatedTop.connections };
        }

        const stageLayouts = {};
        stages.forEach(stg => {
          stageLayouts[stg.id] = generateSubassemblyDiagram(stg);
        });

        set({
          activeView: 'topHierarchy',
          selectedStageId: null,
          topHierarchyLayout,
          stageLayouts,
          nodes: topHierarchyLayout.nodes,
          edges: topHierarchyLayout.edges,
          stages,
          project: model.project || null,
          vsmId: model.id,
          saveStatus: 'saved',
          selectedNodeId: null,
          selectedEdgeId: null,
        });
      },

      setNodesAndEdges: (nodes, edges) =>
        set({ nodes, edges, saveStatus: 'unsaved' }),

      // Selection
      setSelectedNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
      setSelectedEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
      setSaveStatus: (status) => set({ saveStatus: status }),

      deleteSelected: () => {
        const { selectedNodeId, selectedEdgeId, deleteNode, deleteEdge } = get();
        if (selectedNodeId) deleteNode(selectedNodeId);
        if (selectedEdgeId) deleteEdge(selectedEdgeId);
      },
    }),
    {
      partialize: (state) => {
        if (!state) return {};
        return {
          topHierarchyLayout: state.topHierarchyLayout,
          stageLayouts: state.stageLayouts,
          stages: state.stages,
          activeView: state.activeView,
        };
      },
    }
  )
);

export default useVsmStore;
