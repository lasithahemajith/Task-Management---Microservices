import React from 'react';

const STATUS_COLORS = {
  pending:     '#f59e0b',
  in_progress: '#3b82f6',
  completed:   '#10b981',
};

const STATUS_LABELS = {
  pending:     'Pending',
  in_progress: 'In Progress',
  completed:   'Completed',
};

export default function TaskCard({ task, onUpdate, onDelete }) {
  const color = STATUS_COLORS[task.status] || '#6b7280';

  return (
    <div style={{
      background: '#fff',
      border: `2px solid ${color}`,
      borderRadius: 10,
      padding: '16px',
      marginBottom: 12,
      boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>{task.title}</h3>
          {task.description && (
            <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>{task.description}</p>
          )}
          <span style={{
            display: 'inline-block',
            marginTop: 8,
            padding: '2px 10px',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600,
            background: color,
            color: '#fff',
          }}>
            {STATUS_LABELS[task.status] || task.status}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 12 }}>
          {task.status !== 'completed' && (
            <button
              onClick={() => onUpdate(task.id, {
                status: task.status === 'pending' ? 'in_progress' : 'completed',
              })}
              style={btnStyle('#3b82f6')}
              title="Advance status"
            >
              {task.status === 'pending' ? '▶' : '✓'}
            </button>
          )}
          <button
            onClick={() => onDelete(task.id)}
            style={btnStyle('#ef4444')}
            title="Delete task"
          >
            ✕
          </button>
        </div>
      </div>
      <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
        {new Date(task.created_at).toLocaleString()}
      </p>
    </div>
  );
}

function btnStyle(bg) {
  return {
    background: bg,
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '4px 10px',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 14,
  };
}
