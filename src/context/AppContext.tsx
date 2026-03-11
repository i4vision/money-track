import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, Transaction, TransactionStatus } from '../types';

interface AppContextType {
  users: User[];
  currentUser: User | null;
  transactions: Transaction[];
  login: (userId: string, password?: string) => boolean;
  logout: () => void;
  addUser: (name: string, password?: string, isAdmin?: boolean) => User;
  deleteUser: (userId: string) => void;
  switchUser: (userId: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp' | 'status'>) => void;
  updateTransactionStatus: (id: string, status: TransactionStatus) => void;
  markItemReturned: (id: string) => void;
  settleMoney: (userId: string, friendId: string) => void;
  getBalancesForUser: (userId: string) => { owedToYou: number, youOwe: number, net: number };
  getItemInventoryForUser: (userId: string) => { itemsLent: Transaction[], itemsBorrowed: Transaction[] };
}

// App Context wraps the application to provide global state

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedId = localStorage.getItem('moneytrack_session');
    // We strictly hold just the ID here until data loads
    return savedId ? ({ id: savedId } as User) : null;
  });

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, txRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/transactions')
        ]);
        const fetchedUsers = await usersRes.json();
        const fetchedTx = await txRes.json();
        setUsers(fetchedUsers);
        setTransactions(fetchedTx);

        // Hydrate currentUser if we had a saved session ID
        if (currentUser && !currentUser.name) {
           const fullUser = fetchedUsers.find((u: User) => u.id === currentUser.id);
           if (fullUser) setCurrentUser(fullUser);
        }
      } catch (err) {
        console.error('Failed to load data from backend', err);
      } finally {
        setIsInitializing(false);
      }
    };
    fetchData();
  }, []); // Run once on mount

  // Persist only the active session locally
  useEffect(() => {
    if (currentUser?.name) { // only if fully hydrated
      localStorage.setItem('moneytrack_session', currentUser.id);
    } else if (currentUser === null) {
      localStorage.removeItem('moneytrack_session');
    }
  }, [currentUser]);

  const login = (userId: string, password?: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return false;
    
    // Simple password check (if a password is set, it must match)
    if (user.password && user.password !== password) {
      return false;
    }
    
    setCurrentUser(user);
    return true;
  };

  const logout = () => setCurrentUser(null);

  const addUser = (name: string, password?: string, isAdmin?: boolean) => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      password,
      isAdmin: isAdmin || false,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
    };
    
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    }).then(res => res.json())
      .then(user => setUsers(prev => [...prev, user]))
      .catch(err => console.error(err));

    return newUser;
  };

  const deleteUser = (userId: string) => {
    fetch(`/api/users/${userId}`, {
      method: 'DELETE'
    }).then(() => {
      setUsers(prev => prev.filter(u => u.id !== userId));
      setTransactions(prev => prev.filter(t => t.creatorId !== userId && t.counterpartyId !== userId));
    }).catch(err => console.error(err));
  };

  const switchUser = (userId: string) => {
    // Only Admin can freely switch without auth
    if (!currentUser?.isAdmin) return;
    const user = users.find(u => u.id === userId);
    if (user) setCurrentUser(user);
  };

  const addTransaction = (t: Omit<Transaction, 'id' | 'timestamp' | 'status'>) => {
    const newTx: Transaction = {
      ...t,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      status: 'PENDING',
    };
    
    fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTx)
    }).then(res => res.json())
      .then(tx => setTransactions(prev => [tx, ...prev]))
      .catch(err => console.error(err));
  };

  const updateTransactionStatus = (id: string, status: TransactionStatus) => {
    fetch(`/api/transactions/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).then(() => {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    }).catch(err => console.error(err));
  };

  const markItemReturned = (id: string) => {
    fetch(`/api/transactions/${id}/return`, {
      method: 'PATCH'
    }).then(() => {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, isReturned: true } : t));
    }).catch(err => console.error(err));
  };
  
  const settleMoney = (userId: string, friendId: string) => {
    fetch(`/api/transactions/settle/${userId}/${friendId}`, {
      method: 'PATCH'
    }).then(() => {
      // Optimistically update local state
      setTransactions(prev => prev.map(t => {
        if (t.assetType === 'MONEY' && t.status === 'VALIDATED' && !t.isReturned &&
            ((t.creatorId === userId && t.counterpartyId === friendId) || 
             (t.creatorId === friendId && t.counterpartyId === userId))) {
          return { ...t, isReturned: true };
        }
        return t;
      }));
    }).catch(err => console.error(err));
  };

  const getBalancesForUser = (userId: string) => {
    let owedToYou = 0;
    let youOwe = 0;

    transactions.forEach(t => {
      // Exclude settled/returned transactions from net balance computation
      if (t.status !== 'VALIDATED' || t.assetType !== 'MONEY' || !t.amount || t.isReturned) return;

      if (t.creatorId === userId) {
        if (t.type === 'LEND') owedToYou += t.amount;
        if (t.type === 'BORROW') youOwe += t.amount;
      } else if (t.counterpartyId === userId) {
        if (t.type === 'LEND') youOwe += t.amount;
        if (t.type === 'BORROW') owedToYou += t.amount;
      }
    });

    return {
      owedToYou,
      youOwe,
      net: owedToYou - youOwe,
    };
  };

  const getItemInventoryForUser = (userId: string) => {
    const itemsLent: Transaction[] = [];
    const itemsBorrowed: Transaction[] = [];

    transactions.forEach(t => {
      // Only validated item transactions that are NOT returned yet
      if (t.status !== 'VALIDATED' || t.assetType !== 'ITEM' || t.isReturned) return;

      const isCreator = t.creatorId === userId;
      const isCounterparty = t.counterpartyId === userId;
      
      if (!isCreator && !isCounterparty) return;

      let amILending = false;
      if (isCreator && t.type === 'LEND') amILending = true;
      if (isCounterparty && t.type === 'LEND') amILending = false; // They lent to me
      if (isCreator && t.type === 'BORROW') amILending = false; // I borrowed from them
      if (isCounterparty && t.type === 'BORROW') amILending = true; // They borrowed from me

      if (amILending) {
        itemsLent.push(t);
      } else {
        itemsBorrowed.push(t);
      }
    });

    return { itemsLent, itemsBorrowed };
  };

  return (
    <AppContext.Provider value={{ 
      users, 
      currentUser, 
      transactions,
      login,
      logout,
      addUser,
      deleteUser,
      switchUser, 
      addTransaction, 
      updateTransactionStatus, 
      markItemReturned,
      settleMoney,
      getBalancesForUser,
      getItemInventoryForUser
    }}>
      {isInitializing ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <h2 className="text-gradient animate-pulse">Loading...</h2>
        </div>
      ) : (
        children
      )}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
