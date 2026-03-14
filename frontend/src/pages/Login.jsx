import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login as apiLogin } from '../api/auth.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiLogin(form.email, form.password);
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: '#1d4ed8' }}>DevTask</h1>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>Sign in to manage your tasks</p>
        {error && <div style={errorStyle}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="email" placeholder="Email" required
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            style={inputStyle}
          />
          <input
            type="password" placeholder="Password" required
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            style={inputStyle}
          />
          <button type="submit" disabled={loading} style={submitStyle}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p style={{ marginTop: 16, textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
          No account? <Link to="/register" style={{ color: '#1d4ed8' }}>Register</Link>
        </p>
      </div>
    </div>
  );
}

const containerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' };
const cardStyle      = { background: '#fff', padding: 40, borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', width: '100%', maxWidth: 400 };
const errorStyle     = { background: '#fee2e2', color: '#dc2626', padding: '8px 12px', borderRadius: 8, marginBottom: 16, fontSize: 14 };
const inputStyle     = { display: 'block', width: '100%', padding: '10px 12px', marginBottom: 12, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15 };
const submitStyle    = { width: '100%', padding: '12px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' };
