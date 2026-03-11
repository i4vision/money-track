import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Shield, Users, Link as LinkIcon, Eye, Trash2 } from 'lucide-react';

export const AdminCreator: React.FC = () => {
  const navigate = useNavigate();
  const { users, addUser, login, currentUser, switchUser, logout, deleteUser } = useAppContext();
  
  const [adminPassword, setAdminPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  // 1. Admin Login View
  if (!currentUser?.isAdmin) {
    return (
      <div className="app-container animate-fade-in" style={{ maxWidth: '400px', marginTop: '10vh' }}>
        <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <Shield size={48} color="var(--color-primary)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '2rem' }}>Admin Access</h2>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!login('admin', adminPassword)) {
              alert('Invalid admin password');
            }
          }}>
            <input
              type="password"
              placeholder="Master Password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-light)', outline: 'none' }}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Admin Dashboard View
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName) return;
    addUser(newUserName, newUserPassword || undefined, false);
    setNewUserName('');
    setNewUserPassword('');
  };

  const copyLink = (userId: string) => {
    const url = `${window.location.origin}/u/${userId}`;
    navigator.clipboard.writeText(url);
    alert('Unique Link Copied: ' + url);
  };

  return (
    <div className="app-container animate-fade-in">
      <header className="glass-header" style={{ padding: '1rem 1.5rem', borderRadius: 'var(--radius-xl)', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield color="var(--color-primary)" />
          <h1 className="text-gradient" style={{ margin: 0 }}>MoneyTrack Admin</h1>
        </div>
        <button className="btn btn-ghost" onClick={() => logout()}>Logout Base</button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* Create User Form */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users color="var(--color-primary)" size={24} />
            Create New User
          </h3>
          <form onSubmit={handleCreateUser} style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Name</label>
              <input 
                type="text" 
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-light)', outline: 'none' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Password (Optional)</label>
              <input 
                type="text" 
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="Leave blank for no password"
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-light)', outline: 'none' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Create User</button>
          </form>
        </div>

        {/* User List */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>All Users</h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {users.filter(u => !u.isAdmin).map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                   <img src={u.avatarUrl} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                   <div>
                     <p style={{ margin: 0, fontWeight: 600 }}>{u.name}</p>
                     <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                       {u.password ? `PW: ${u.password}` : 'No password'}
                     </p>
                   </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-ghost" style={{ padding: '0.5rem' }} onClick={() => copyLink(u.id)} title="Copy Unique Link">
                    <LinkIcon size={18} />
                  </button>
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '0.5rem' }} 
                    onClick={() => { switchUser(u.id); navigate(`/u/${u.id}`); }} 
                    title="View as User"
                  >
                    <Eye size={18} />
                  </button>
                  <button 
                    className="btn btn-ghost" 
                    style={{ padding: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)' }} 
                    onClick={() => { if (window.confirm(`Are you sure you want to delete ${u.name}?`)) deleteUser(u.id); }} 
                    title="Delete User"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            {users.filter(u => !u.isAdmin).length === 0 && (
              <p style={{ color: 'var(--text-secondary)' }}>No standard users created yet.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
