import { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  // Income categories
  { id: '1', name: 'Sales (orders)', type: 'income', isDefault: true },
  { id: '2', name: 'Custom Orders', type: 'income', isDefault: true },
  { id: '3', name: 'Other Income', type: 'income', isDefault: true },
  
  // Expense categories
  { id: '4', name: 'Decor Material', type: 'expense', isDefault: true },
  { id: '5', name: 'Ads/Marketing', type: 'expense', isDefault: true },
  { id: '6', name: 'Packaging', type: 'expense', isDefault: true },
  { id: '7', name: 'Delivery/Courier Charges', type: 'expense', isDefault: true },
  { id: '8', name: 'Maintenance', type: 'expense', isDefault: true },
  { id: '9', name: 'Inventory/Stock Purchase', type: 'expense', isDefault: true },
];