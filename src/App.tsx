import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAppContext } from './context/AppContext';
import { AdminCreator } from './components/AdminCreator';
import { LoginGate } from './components/LoginGate';
import { Dashboard } from './components/Dashboard';
import { TransactionForm } from './components/TransactionForm';
import { ValidationInbox } from './components/ValidationInbox';
import { LogOut } from 'lucide-react';

function ProtectedLayout() {
  const { currentUser, users, switchUser, logout } = useAppContext();

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="app-container animate-fade-in">
      <header 
        className="glass-header" 
        style={{ 
          padding: '1rem 1.5rem', 
          borderRadius: 'var(--radius-xl)', 
          marginBottom: '2rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}
      >
        <h1 className="text-gradient" style={{ margin: 0 }}>MoneyTrack</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img 
            src={currentUser.avatarUrl} 
            alt={currentUser.name} 
            style={{ width: '40px', height: '40px', borderRadius: '50%' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {currentUser.isAdmin ? (
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Viewing as </span>
                <select 
                  value={currentUser.id} 
                  onChange={(e) => switchUser(e.target.value)}
                  style={{ 
                    display: 'block',
                    padding: '0.25rem 0.5rem', 
                    borderRadius: 'var(--radius-sm)', 
                    background: 'var(--bg-surface)', 
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                >
                  <option value="admin">Admin Dashboard</option>
                  <option disabled>──────────</option>
                  {users.filter(u => !u.isAdmin).map(u => (
                     <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <span style={{ fontWeight: 500 }}>{currentUser.name}</span>
            )}
            
            <button 
              onClick={() => logout()} 
              className="btn btn-ghost" 
              style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Render child routes */}
        <Outlet />
      </main>
    </div>
  );
}

// User Dashboard View
function UserView() {
  const { currentUser } = useAppContext();
  
  if (currentUser?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <ValidationInbox />
      <TransactionForm />
      <Dashboard />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root: Admin Page */}
        <Route path="/" element={<AdminCreator />} />
        
        {/* User Unique URL */}
        <Route path="/u/:userId" element={
          <LoginGate>
            <ProtectedLayout />
          </LoginGate>
        }>
          <Route index element={<UserView />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
