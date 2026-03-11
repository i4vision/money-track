import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Lock } from 'lucide-react';

interface LoginGateProps {
  children: React.ReactNode;
}

export const LoginGate: React.FC<LoginGateProps> = ({ children }) => {
  const { userId } = useParams<{ userId: string }>();
  const { users, currentUser, login } = useAppContext();
  
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  // If we don't have a valid ID in the URL, go back to root
  if (!userId) return <Navigate to="/" replace />;

  const targetUser = users.find(u => u.id === userId);

  // If the user doesn't exist, go back to root
  if (!targetUser) return <Navigate to="/" replace />;

  // Admin bypassing: if current user is admin, allow viewing
  if (currentUser?.isAdmin) {
    // Note: if the admin uses the switcher, currentUser will CHANGE to this targetUser.
    // If they just navigated here, they must switch context. We'll handle context matching below.
  }

  // If we are fully authenticated as the target user, render children!
  if (currentUser?.id === userId) {
    return <>{children}</>;
  }

  // If the user doesn't require a password, auto-login them
  if (!targetUser.password && !currentUser?.isAdmin) {
    if (login(userId)) {
      return <>{children}</>;
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(userId, password)) {
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <div className="app-container animate-fade-in" style={{ maxWidth: '400px', marginTop: '10vh' }}>
      <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
        <img src={targetUser.avatarUrl} alt="" style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '1rem' }} />
        <h2 style={{ marginBottom: '0.5rem' }}>Welcome back, {targetUser.name}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
          <Lock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
          This account is protected
        </p>
        
        <form onSubmit={handleLogin}>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              marginBottom: '1rem', 
              borderRadius: 'var(--radius-md)', 
              background: 'rgba(0,0,0,0.2)', 
              border: `1px solid ${error ? 'var(--color-danger)' : 'var(--border-light)'}`, 
              outline: 'none' 
            }}
            required
          />
          {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginTop: '-0.5rem', marginBottom: '1rem', textAlign: 'left' }}>Incorrect password</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
            Unlock Profile
          </button>
        </form>
      </div>
    </div>
  );
};
