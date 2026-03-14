import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTasks, createTask, updateTask, deleteTask, getNotifications } from '../api/tasks.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import TaskCard from '../components/TaskCard.jsx';

export default function Dashboard() {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks]               = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [newTask, setNewTask]           = useState({ title: '', description: '' });
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [activeTab, setActiveTab]       = useState('tasks');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, nRes] = await Promise.all([getTasks(), getNotifications()]);
      setTasks(tRes.tasks || []);
      setNotifications(nRes.notifications || []);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchData();
  }, [token, navigate, fetchData]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    try {
      await createTask(newTask);
      setNewTask({ title: '', description: '' });
      fetchData();
    } catch {
      setError('Failed to create task');
    }
  }

  async function handleUpdate(id, updates) {
    try {
      await updateTask(id, updates);
      fetchData();
    } catch {
      setError('Failed to update task');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this task?')) return;
    try {
      await deleteTask(id);
      fetchData();
    } catch {
      setError('Failed to delete task');
    }
  }

  const stats = {
    total:       tasks.length,
    pending:     tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed:   tasks.filter(t => t.status === 'completed').length,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* Header */}
      <header style={{ background: '#1d4ed8', color: '#fff', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>🗂 DevTask</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 14 }}>👤 {user?.name}</span>
          <button onClick={() => { logout(); navigate('/login'); }} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
            Sign out
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total',       value: stats.total,       color: '#6366f1' },
            { label: 'Pending',     value: stats.pending,     color: '#f59e0b' },
            { label: 'In Progress', value: stats.in_progress, color: '#3b82f6' },
            { label: 'Completed',   value: stats.completed,   color: '#10b981' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '20px 16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderTop: `4px solid ${s.color}` }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* New task form */}
        <form onSubmit={handleCreate} style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>+ Add New Task</h2>
          {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '8px 12px', borderRadius: 8, marginBottom: 12, fontSize: 14 }}>{error}</div>}
          <input
            type="text" placeholder="Task title *" required value={newTask.title}
            onChange={e => setNewTask({ ...newTask, title: e.target.value })}
            style={{ display: 'block', width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15, marginBottom: 10 }}
          />
          <textarea
            placeholder="Description (optional)" rows={2} value={newTask.description}
            onChange={e => setNewTask({ ...newTask, description: e.target.value })}
            style={{ display: 'block', width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15, marginBottom: 10, resize: 'vertical' }}
          />
          <button type="submit" style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer' }}>
            Create Task
          </button>
        </form>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['tasks', 'notifications'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
                background: activeTab === tab ? '#1d4ed8' : '#fff',
                color:      activeTab === tab ? '#fff'    : '#374151',
                boxShadow:  '0 1px 4px rgba(0,0,0,0.08)',
              }}
            >
              {tab === 'tasks' ? `📋 Tasks (${tasks.length})` : `🔔 Notifications (${notifications.length})`}
            </button>
          ))}
          <button onClick={fetchData} style={{ marginLeft: 'auto', background: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: '#6b7280', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            ↺ Refresh
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <p style={{ textAlign: 'center', color: '#6b7280' }}>Loading…</p>
        ) : activeTab === 'tasks' ? (
          tasks.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>No tasks yet. Create one above!</p>
          ) : (
            tasks.map(task => (
              <TaskCard key={task.id} task={task} onUpdate={handleUpdate} onDelete={handleDelete} />
            ))
          )
        ) : (
          notifications.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>No notifications yet.</p>
          ) : (
            notifications.map(n => (
              <div key={n.id} style={{ background: '#fff', borderRadius: 10, padding: '14px 16px', marginBottom: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #6366f1' }}>
                <p style={{ fontSize: 15 }}>{n.message}</p>
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{new Date(n.created_at).toLocaleString()}</p>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
