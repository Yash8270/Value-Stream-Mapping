import React, { useCallback, useRef } from 'react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  MiniMap, 
  BackgroundVariant,
  useReactFlow
} from '@xyflow/react';
import useVsmStore from '../../store/useVsmStore';
import ProcessNode from '../nodes/ProcessNode';
import InventoryNode from '../nodes/InventoryNode';
import StandardEdge from '../edges/StandardEdge';
import CanvasHeader from '../layout/CanvasHeader';

const nodeTypes = {
  processNode: ProcessNode,
  inventoryNode: InventoryNode,
};

const edgeTypes = {
  standard: StandardEdge,
};

export default function VSMCanvas() {
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect, 
    setSelectedNode, 
    setSelectedEdge, 
    addNode,
    activeView,
    setActiveView
  } = useVsmStore();

  const reactFlowWrapper = useRef(null);
  const reactFlowInstance = useReactFlow();

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow/type');
      const label = event.dataTransfer.getData('application/reactflow/label');

      if (!type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const isTop = activeView === 'topHierarchy' || activeView === 'top';

      const newNode = {
        id: `node_${Date.now()}`,
        type: type === 'inventory' ? 'inventoryNode' : 'processNode',
        position,
        data: type !== 'inventory'
          ? { 
              label: label || 'New Element', 
              nodeType: type,
              stageId: !isTop ? activeView : undefined,
              metrics: { ct: 1.0, mt: 0.0, ut: 0.9, st: 0.1, op: 1, scrap: 0, rft: 1.0 }
            }
          : { quantity: 20, inventoryType: 'WIP', stageId: !isTop ? activeView : undefined },
      };

      addNode(newNode);
    },
    [reactFlowInstance, addNode, activeView]
  );

  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node.id);
  }, [setSelectedNode]);

  const onEdgeClick = useCallback((_, edge) => {
    setSelectedEdge(edge.id);
  }, [setSelectedEdge]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, [setSelectedNode, setSelectedEdge]);

  const onNodeDoubleClick = useCallback((_, node) => {
    const isTop = activeView === 'topHierarchy' || activeView === 'top';
    if (isTop && node.data?.stageId) {
      setActiveView(node.data.stageId);
    }
  }, [activeView, setActiveView]);

  return (
    <div ref={reactFlowWrapper} className="vsm-canvas-wrapper" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <CanvasHeader />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2.5}
        defaultEdgeOptions={{ type: 'standard', animated: false }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#CBD5E1" />
        <Controls showInteractive={false} position="bottom-right" />
        <MiniMap 
          nodeColor={(node) => {
            if (node.type === 'inventoryNode') return '#5B9BD5';
            const nt = node.data?.nodeType;
            if (nt === 'quality') return '#F5B700';
            if (nt === 'assembly') return '#4B72B5';
            if (nt === 'package_assembly') return '#8A6900';
            return '#16A9D8';
          }}
          position="bottom-left"
          style={{ width: 120, height: 80 }}
        />
      </ReactFlow>
    </div>
  );
}
