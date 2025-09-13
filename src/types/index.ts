export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  currency: 'PKR' | 'USD';
  category: string;
  description: string;
  date: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  isDefault: boolean;
}

export interface AppData {
  transactions: Transaction[];
  categories: Category[];
}

export interface DateRangeFilter {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  startDate?: string;
  endDate?: string;
}