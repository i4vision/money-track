export type User = {
  id: string;
  name: string;
  avatarUrl?: string;
  password?: string; // Standard users have a login password
  isAdmin?: boolean; // True for the admin account
};

export type TransactionType = 'LEND' | 'BORROW';
export type TransactionStatus = 'PENDING' | 'VALIDATED' | 'REJECTED';
export type AssetType = 'MONEY' | 'ITEM';

export type Transaction = {
  id: string;
  creatorId: string;
  counterpartyId: string;
  assetType: AssetType; // Differentiates between money and physical item
  amount?: number;      // Amount of money (made optional, only applies to MONEY)
  itemName?: string;    // Name of item (only applies to ITEM)
  isReturned?: boolean; // For ITEM transactions: has it been given back?
  type: TransactionType; // From my perspective, did I Lend or Borrow it?
  status: TransactionStatus;
  description: string;
  timestamp: string;
};
