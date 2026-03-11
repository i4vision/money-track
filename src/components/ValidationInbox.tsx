import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Check, X, Bell } from 'lucide-react';
import { format } from 'date-fns';

export const ValidationInbox: React.FC = () => {
  const { currentUser, transactions, users, updateTransactionStatus } = useAppContext();

  if (!currentUser) return null;

  // I need to validate transactions where I am the counterparty and status is PENDING
  const pendingRequests = transactions.filter(t => 
    t.status === 'PENDING' && t.counterpartyId === currentUser.id
  );

  if (pendingRequests.length === 0) return null;

  return (
    <div className="animate-fade-in" style={{ marginBottom: '2rem' }}>
      <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Bell color="var(--color-warning)" size={24} />
        Validation Inbox
        <span className="badge badge-pending" style={{ marginLeft: '0.5rem' }}>{pendingRequests.length}</span>
      </h2>
      
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {pendingRequests.map(t => {
          const creator = users.find(u => u.id === t.creatorId);
          const verb = t.type === 'LEND' ? 'lent you' : 'wants to borrow';
          const preVerb = t.type === 'LEND' ? 'says they' : '';

          return (
            <div key={t.id} className="glass-panel" style={{ padding: '1.5rem', flex: '1 1 300px', borderLeft: '4px solid var(--color-warning)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                 <img src={creator?.avatarUrl} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                 <div>
                   {t.assetType === 'MONEY' ? (
                     <p style={{ margin: 0, fontWeight: 600 }}>{creator?.name} {preVerb} {verb} <span style={{ color: 'var(--text-primary)', fontSize: '1.2rem' }}>${t.amount?.toFixed(2)}</span></p>
                   ) : (
                     <p style={{ margin: 0, fontWeight: 600 }}>{creator?.name} {preVerb} {verb} <span style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>item: {t.itemName}</span></p>
                   )}
                   <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>"{t.description}" • {format(new Date(t.timestamp), 'MMM d')}</p>
                 </div>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                  onClick={() => updateTransactionStatus(t.id, 'VALIDATED')}
                >
                  <Check size={18} /> Approve
                </button>
                <button 
                  className="btn btn-ghost" 
                  style={{ flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)' }}
                  onClick={() => updateTransactionStatus(t.id, 'REJECTED')}
                >
                  <X size={18} /> Reject
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
