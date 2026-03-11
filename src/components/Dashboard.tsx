import React from 'react';
import { useAppContext } from '../context/AppContext';
import { TrendingUp, TrendingDown, DollarSign, Package, PackageOpen, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export const Dashboard: React.FC = () => {
  const { currentUser, getBalancesForUser, getItemInventoryForUser, transactions, users, markItemReturned, settleMoney } = useAppContext();
  
  if (!currentUser) return null;

  const { owedToYou, youOwe, net } = getBalancesForUser(currentUser.id);
  const { itemsLent, itemsBorrowed } = getItemInventoryForUser(currentUser.id);
  
  // Calculate per-friend balances for "Settle Up" functionality
  const friendBalances: Record<string, number> = {};
  transactions.forEach(t => {
      if (t.status !== 'VALIDATED' || t.assetType !== 'MONEY' || !t.amount || t.isReturned) return;
      if (t.creatorId === currentUser.id) {
          friendBalances[t.counterpartyId] = (friendBalances[t.counterpartyId] || 0) + (t.type === 'LEND' ? t.amount : -t.amount);
      } else if (t.counterpartyId === currentUser.id) {
          friendBalances[t.creatorId] = (friendBalances[t.creatorId] || 0) + (t.type === 'LEND' ? -t.amount : t.amount);
      }
  });

  const friendsNeedingSettlement = Object.entries(friendBalances).filter(([_, bal]) => bal !== 0);

  // Get validated transactions involving current user
  const ledger = transactions.filter(t => 
    t.status === 'VALIDATED' && 
    (t.creatorId === currentUser.id || t.counterpartyId === currentUser.id)
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="animate-fade-in" style={{ display: 'grid', gap: '2rem' }}>
      
      {/* --- MONEY DASHBOARD --- */}
      <div>
        <h2 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Money Standing</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {/* Net Balance Card */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                <DollarSign color="var(--color-info)" size={24} />
              </div>
              <h3 style={{ color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>Net Balance</h3>
            </div>
            <p style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0, color: net >= 0 ? 'var(--color-primary)' : 'var(--color-danger)' }}>
              <span style={{ fontSize: '1.5rem', marginRight: '4px' }}>{net < 0 ? '-' : ''}$</span>{Math.abs(net).toFixed(2)}
              <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginLeft: '0.5rem', fontWeight: 500 }}>
                {net >= 0 ? (net === 0 ? 'Settled' : 'Owed to you') : 'You owe total'}
              </span>
            </p>
          </div>

          {/* You are Owed Card */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                <TrendingUp color="var(--color-primary)" size={24} />
              </div>
              <h3 style={{ color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>People Owe You</h3>
            </div>
            <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>${owedToYou.toFixed(2)}</p>
          </div>

          {/* You Owe Card */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                <TrendingDown color="var(--color-danger)" size={24} />
              </div>
              <h3 style={{ color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>You Owe</h3>
            </div>
            <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>${youOwe.toFixed(2)}</p>
          </div>
        </div>
        
        {/* Settle Up Section */}
        {friendsNeedingSettlement.length > 0 && (
          <div className="glass-panel" style={{ marginTop: '1rem', padding: '1.5rem' }}>
             <h3 style={{ margin: 0, marginBottom: '1rem', fontSize: '1.1rem' }}>Active Balances</h3>
             <div style={{ display: 'grid', gap: '0.75rem' }}>
                {friendsNeedingSettlement.map(([friendId, balance]) => {
                  const friend = users.find(u => u.id === friendId);
                  if (!friend) return null;
                  const isOwedToYou = balance > 0;
                  
                  return (
                    <div key={friendId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600 }}>{friend.name}</p>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: isOwedToYou ? 'var(--color-primary)' : 'var(--color-danger)' }}>
                           {isOwedToYou ? 'Owes you' : 'You owe'} ${Math.abs(balance).toFixed(2)}
                        </p>
                      </div>
                      <button 
                        className="btn btn-primary" 
                        style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }} 
                        onClick={() => {
                          if (window.confirm(`Mark all monetary debts with ${friend.name} as settled?`)) {
                            settleMoney(currentUser.id, friend.id);
                          }
                        }}
                      >
                        <CheckCircle2 size={16} /> Settle Up
                      </button>
                    </div>
                  );
                })}
             </div>
          </div>
        )}
      </div>

      {/* --- ITEM INVENTORY --- */}
      <div>
        <h2 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Package size={20} /> Item Inventory
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          
          <div className="glass-panel" style={{ padding: '1.5rem', borderTop: '4px solid var(--color-primary)' }}>
            <h3 style={{ margin: 0, marginBottom: '1rem', fontSize: '1.1rem' }}>Items Lent Out ({itemsLent.length})</h3>
            {itemsLent.length === 0 ? (
               <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>You haven't lent out any items.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {itemsLent.map(t => {
                  const friendId = t.creatorId === currentUser.id ? t.counterpartyId : t.creatorId;
                  const friend = users.find(u => u.id === friendId);
                  return (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600 }}>{t.itemName}</p>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>has it: {friend?.name}</p>
                      </div>
                      <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', border: '1px solid var(--border-light)' }} onClick={() => markItemReturned(t.id)}>
                        Mark Returned
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', borderTop: '4px solid var(--color-danger)' }}>
            <h3 style={{ margin: 0, marginBottom: '1rem', fontSize: '1.1rem' }}>Items You Borrowed ({itemsBorrowed.length})</h3>
            {itemsBorrowed.length === 0 ? (
               <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>You don't have any borrowed items.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {itemsBorrowed.map(t => {
                  const friendId = t.creatorId === currentUser.id ? t.counterpartyId : t.creatorId;
                  const friend = users.find(u => u.id === friendId);
                  return (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600 }}>{t.itemName}</p>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>owner: {friend?.name}</p>
                      </div>
                      <PackageOpen size={18} color="var(--text-muted)" />
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* --- LEDGER --- */}
      <div>
        <h2 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Ledger Activity</h2>
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          {ledger.length === 0 ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No validated transactions yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {ledger.map((t, i) => {
                const isCreator = t.creatorId === currentUser.id;
                const otherUserId = isCreator ? t.counterpartyId : t.creatorId;
                const otherUser = users.find(u => u.id === otherUserId);
                
                let amIOwedOrLender = false;
                if (isCreator && t.type === 'LEND') amIOwedOrLender = true;
                if (!isCreator && t.type === 'BORROW') amIOwedOrLender = true;

                return (
                  <div key={t.id} style={{ 
                    padding: '1rem 1.5rem', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    borderBottom: i < ledger.length - 1 ? '1px solid var(--border-light)' : 'none',
                    opacity: t.isReturned ? 0.6 : 1
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <img src={otherUser?.avatarUrl} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                      <div>
                        <p style={{ fontWeight: 600, margin: 0, textDecoration: t.isReturned ? 'line-through' : 'none' }}>
                          {t.assetType === 'ITEM' ? `Item: ${t.itemName}` : t.description}
                        </p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                          with {otherUser?.name} • {format(new Date(t.timestamp), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {t.assetType === 'MONEY' ? (
                        <>
                          <p style={{ 
                            fontWeight: 700, 
                            fontSize: '1.25rem', 
                            margin: 0,
                            color: t.isReturned ? 'var(--text-secondary)' : (amIOwedOrLender ? 'var(--color-primary)' : 'var(--text-primary)')
                          }}>
                            {amIOwedOrLender ? '+' : '-'}${t.amount?.toFixed(2)}
                          </p>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                            {t.isReturned ? 'Settled' : (amIOwedOrLender ? 'You lent' : 'You borrowed')}
                          </p>
                        </>
                      ) : (
                        <>
                           <p style={{ 
                            fontWeight: 700, 
                            fontSize: '1rem', 
                            margin: 0,
                            color: amIOwedOrLender ? 'var(--color-primary)' : 'var(--color-warning)'
                          }}>
                            {amIOwedOrLender ? 'You lent' : 'You borrowed'}
                          </p>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                            {t.isReturned ? 'Returned' : 'Active'}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
