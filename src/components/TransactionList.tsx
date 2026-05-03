"use client"
import React, { useState } from 'react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/dateUtils';
import { CreditCard as Edit, Trash2, Search } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

const TYPE_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  income: { bg: 'bg-green-100', text: 'text-green-800', label: 'INCOME' },
  expense: { bg: 'bg-red-100', text: 'text-red-800', label: 'EXPENSE' },
  reinvestment: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'REINVESTMENT' },
};

const TYPE_AMOUNT: Record<string, string> = {
  income: 'text-green-600',
  expense: 'text-red-600',
  reinvestment: 'text-amber-600',
};

const TYPE_SIGN: Record<string, string> = {
  income: '+',
  expense: '-',
  reinvestment: '~',
};

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onEdit,
  onDelete
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense' | 'reinvestment'>('all');
  const [categoryFilter, setCategoryFilter] = useState('');

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    const matchesCategory = !categoryFilter || transaction.category === categoryFilter;
    return matchesSearch && matchesType && matchesCategory;
  });

  const sortedTransactions = filteredTransactions.sort((a, b) => {
    try {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } catch {
      return 0;
    }
  });

  const uniqueCategories = [...new Set(transactions.map(t => t.category))];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Transaction History</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#806351] focus:border-transparent transition-colors"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#806351] focus:border-transparent transition-colors"
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="reinvestment">Reinvestment</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#806351] focus:border-transparent transition-colors"
          >
            <option value="">All Categories</option>
            {uniqueCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="divide-y divide-gray-200 max-h-[32rem] overflow-y-auto">
        {sortedTransactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No transactions found. Add your first transaction to get started!
          </div>
        ) : (
          sortedTransactions.map((transaction) => {
            const badge = TYPE_BADGE[transaction.type] ?? TYPE_BADGE.expense;
            const amountColor = TYPE_AMOUNT[transaction.type] ?? 'text-gray-900';
            const sign = TYPE_SIGN[transaction.type] ?? '';

            return (
              <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                      <span className="font-medium text-gray-900 text-sm sm:text-base">{transaction.category}</span>
                      <span className="text-sm text-gray-500">{transaction.date}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className={`text-lg font-semibold ${amountColor}`}>
                          {sign}{formatCurrency(transaction.amount, transaction.currency)}
                        </span>
                        <p className="text-sm text-gray-600 mt-1">{transaction.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:ml-4 self-end sm:self-center">
                    <button
                      onClick={() => onEdit(transaction)}
                      className="p-2 text-gray-400 hover:text-[#806351] hover:bg-[#f5f3f1] rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(transaction.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TransactionList;
