import React, { memo } from 'react';
import { getSmoothStepPath, EdgeLabelRenderer } from '@xyflow/react';

function StandardEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const direction = data?.direction || 'forward';
  const isTwoWay = direction === 'two-way';
  const label = data?.label;

  const edgeColor = isTwoWay ? 'var(--vsm-blue)' : 'var(--vsm-navy)';
  const strokeWidth = selected ? 3 : (isTwoWay ? 2.2 : 2);

  return (
    <>
      <defs>
        <marker
          id={`marker-end-${id}`}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={edgeColor} />
        </marker>

        {isTwoWay && (
          <marker
            id={`marker-start-${id}`}
            viewBox="0 0 10 10"
            refX="2"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 10 0 L 0 5 L 10 10 z" fill={edgeColor} />
          </marker>
        )}
      </defs>

      {/* Main Edge Path */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        stroke={edgeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={isTwoWay ? '6,4' : 'none'}
        markerEnd={`url(#marker-end-${id})`}
        markerStart={isTwoWay ? `url(#marker-start-${id})` : undefined}
        fill="none"
        style={{
          transition: 'stroke 0.15s, stroke-width 0.15s',
          filter: selected ? 'drop-shadow(0 0 4px rgba(47,111,173,0.4))' : 'none',
        }}
      />

      {/* Edge Label Renderer */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: '#FFFFFF',
              border: '1px solid var(--border)',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10.5px',
              fontWeight: 600,
              color: 'var(--vsm-navy)',
              pointerEvents: 'all',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default memo(StandardEdge);
