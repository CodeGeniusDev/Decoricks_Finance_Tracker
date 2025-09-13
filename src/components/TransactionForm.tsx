import React, { useState, useEffect } from 'react';
import { Transaction, Category } from '../types';
import { generateId } from '../utils/storage';
import { Plus, X } from 'lucide-react';

interface TransactionFormProps {
  categories: Category[];
  editingTransaction?: Transaction | null;
  onSave: (transaction: Transaction) => void;
  onAddCategory: (category: Category) => void;
  onCancel?: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  categories,
  editingTransaction,
  onSave,
  onAddCategory,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    currency: 'PKR' as 'PKR' | 'USD',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        type: editingTransaction.type,
        amount: editingTransaction.amount.toString(),
        currency: editingTransaction.currency,
        category: editingTransaction.category,
        description: editingTransaction.description,
        date: editingTransaction.date
      });
    }
  }, [editingTransaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.category || !formData.date) return;

    const transaction: Transaction = {
      id: editingTransaction?.id || generateId(),
      type: formData.type,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      category: formData.category,
      description: formData.description,
      date: formData.date,
      createdAt: editingTransaction?.createdAt || new Date().toISOString()
    };

    onSave(transaction);
    
    if (!editingTransaction) {
      setFormData({
        type: 'expense',
        amount: '',
        currency: 'PKR',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
    }
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const newCategory: Category = {
      id: generateId(),
      name: newCategoryName.trim(),
      type: formData.type,
      isDefault: false
    };
    
    onAddCategory(newCategory);
    setFormData({ ...formData, category: newCategory.name });
    setNewCategoryName('');
    setShowAddCategory(false);
  };

  const filteredCategories = categories.filter(cat => cat.type === formData.type);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
        </h2>
        {editingTransaction && onCancel && (
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense', category: '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#806351] focus:border-transparent transition-colors"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#806351] focus:border-transparent transition-colors"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#806351] focus:border-transparent transition-colors"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value as 'PKR' | 'USD' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#806351] focus:border-transparent transition-colors"
            >
              <option value="PKR">PKR</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <button
              type="button"
              onClick={() => setShowAddCategory(true)}
              className="text-sm text-[#806351] hover:text-[#6b5444] flex items-center gap-1 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Custom
            </button>
          </div>
          
          {showAddCategory ? (
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#806351] focus:border-transparent transition-colors"
                autoFocus
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-4 py-2 bg-[#806351] text-white rounded-lg hover:bg-[#6b5444] transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddCategory(false);
                  setNewCategoryName('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : null}
          
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#806351] focus:border-transparent transition-colors"
            required
          >
            <option value="">Select a category</option>
            {filteredCategories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name} {!cat.isDefault && '(Custom)'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#806351] focus:border-transparent transition-colors resize-none"
            placeholder="Add transaction details..."
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#806351] text-white py-3 rounded-lg hover:bg-[#6b5444] transition-colors font-medium"
        >
          {editingTransaction ? 'Update Transaction' : 'Add Transaction'}
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;