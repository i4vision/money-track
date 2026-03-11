import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Send, HandCoins, Package } from 'lucide-react';
import type { TransactionType, AssetType } from '../types';

export const TransactionForm: React.FC = () => {
  const { currentUser, users, addTransaction } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);

  const [assetType, setAssetType] = useState<AssetType>('MONEY');
  const [amount, setAmount] = useState('');
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TransactionType>('LEND');
  const [counterpartyId, setCounterpartyId] = useState('');

  if (!currentUser) return null;

  const friends = users.filter(u => u.id !== currentUser.id && !u.isAdmin);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !counterpartyId) return;
    if (assetType === 'MONEY' && !amount) return;
    if (assetType === 'ITEM' && !itemName) return;

    addTransaction({
      creatorId: currentUser.id,
      counterpartyId,
      assetType,
      amount: assetType === 'MONEY' ? parseFloat(amount) : undefined,
      itemName: assetType === 'ITEM' ? itemName : undefined,
      type,
      description
    });

    setIsOpen(false);
    setAmount('');
    setItemName('');
    setDescription('');
    setCounterpartyId('');
    setType('LEND');
  };

  if (!isOpen) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
        <button 
          className="btn btn-primary" 
          style={{ padding: '0.75rem 2rem', fontSize: '1rem', borderRadius: 'var(--radius-full)' }}
          onClick={() => setIsOpen(true)}
        >
          <HandCoins size={20} />
          Record New Log
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid var(--color-primary)' }}>
      <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Send color="var(--color-primary)" size={24} />
        New Transaction Request
      </h3>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
         <button 
           type="button"
           className={assetType === 'MONEY' ? 'btn btn-primary' : 'btn btn-ghost'}
           onClick={() => setAssetType('MONEY')}
           style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
         >
           <HandCoins size={18} /> Money
         </button>
         <button 
           type="button"
           className={assetType === 'ITEM' ? 'btn btn-primary' : 'btn btn-ghost'}
           onClick={() => setAssetType('ITEM')}
           style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
         >
           <Package size={18} /> Item
         </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Action</label>
            <select 
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-light)', outline: 'none' }}
              required
            >
              <option value="LEND">I am Lending to</option>
              <option value="BORROW">I am Borrowing from</option>
            </select>
          </div>
          
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Friend</label>
            <select 
              value={counterpartyId}
              onChange={(e) => setCounterpartyId(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-light)', outline: 'none' }}
              required
            >
              <option value="" disabled>Select a friend</option>
              {friends.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          {assetType === 'MONEY' ? (
            <div style={{ flex: '1 1 150px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Amount ($)</label>
              <input 
                type="number" 
                min="0.01" 
                step="0.01" 
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-light)', outline: 'none' }}
                required={assetType === 'MONEY'}
              />
            </div>
          ) : (
             <div style={{ flex: '1 1 150px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Item Name</label>
              <input 
                type="text" 
                placeholder="e.g. Cordless Drill"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-light)', outline: 'none' }}
                required={assetType === 'ITEM'}
              />
            </div>
          )}

          <div style={{ flex: '2 1 300px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              {assetType === 'MONEY' ? 'Description' : 'Condition / Notes'}
            </label>
            <input 
              type="text" 
              placeholder={assetType === 'MONEY' ? "e.g. Dinner at Luigi's" : "e.g. Good condition, has all bits"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-light)', outline: 'none' }}
              required
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
          <button type="button" className="btn btn-ghost" onClick={() => setIsOpen(false)}>Cancel</button>
          <button type="submit" className="btn btn-primary">Send Request</button>
        </div>
      </form>
    </div>
  );
};
