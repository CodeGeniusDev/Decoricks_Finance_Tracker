import React, { useState, useEffect } from 'react';
import { AppData, Transaction, Category, DateRangeFilter } from './types';
import { loadData, saveData } from './utils/storage';
import { 
  getNotificationSettings, 
  saveNotificationSettings, 
  getNotifications, 
  addNotification, 
  requestNotificationPermission, 
  scheduleReminders, 
  markNotificationAsRead, 
  clearAllNotifications,
  NotificationSettings,
  AppNotification
} from './utils/notifications';
import { initializeAutoDownload, shouldAutoDownload, triggerAutoDownload, getAutoDownloadSettings, formatNextDownloadTime } from './utils/autoDownload';
import { initializeSession, trackActivity, getUsageStats } from './utils/liveTracking';
import Dashboard from './components/Dashboard';
import DateFilter from './components/DateFilter';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import ExportImport from './components/ExportImport';
import NotificationPanel from './components/NotificationPanel';
import { BarChart3, Plus, FileText, Settings, Bell, Home } from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<AppData>({ transactions: [], categories: [] });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'add' | 'transactions' | 'settings'>('dashboard');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>({ type: 'monthly' });
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    weeklyReminders: true,
    monthlyReminders: true,
    transactionNotifications: true
  });
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const loadedData = loadData();
    setData(loadedData);
    
    // Initialize live tracking
    initializeSession();
    
    // Initialize auto-download system
    initializeAutoDownload(loadedData);
    
    const settings = getNotificationSettings();
    setNotificationSettings(settings);
    
    const loadedNotifications = getNotifications();
    setNotifications(loadedNotifications);
    
    // Request notification permission and schedule reminders
    requestNotificationPermission().then(() => {
      scheduleReminders();
    });
    
    // Add welcome notification
    setTimeout(() => {
      addNotification(
        'Welcome to Decoricks Finance App',
        'Your home decor business finance tracker is ready! Start by adding your first transaction.',
        'info'
      );
      setNotifications(getNotifications());
    }, 1000);
    
    // Set up periodic notification refresh
    const notificationInterval = setInterval(() => {
      const currentNotifications = getNotifications();
      setNotifications(currentNotifications);
      
      // Check for auto-download every time notifications refresh
      if (shouldAutoDownload()) {
        triggerAutoDownload(data);
        addNotification(
          'Auto-Backup Completed',
          'Your financial data has been automatically downloaded as a backup file.',
          'success'
        );
      }
    }, 2000);
    
    return () => {
      clearInterval(notificationInterval);
    };
  }, []);

  // Real-time notification updates
  useEffect(() => {
    const handleStorageChange = () => {
      setNotifications(getNotifications());
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleSaveData = (newData: AppData) => {
    setData(newData);
    saveData(newData);
    
    // Force data persistence with multiple storage methods
    try {
      // Primary storage
      localStorage.setItem('decoricks-finance-data', JSON.stringify(newData));
      // Backup storage
      localStorage.setItem('decoricks-finance-backup', JSON.stringify({
        ...newData,
        lastBackup: new Date().toISOString()
      }));
      // Session storage as additional backup
      sessionStorage.setItem('decoricks-finance-session', JSON.stringify(newData));
    } catch (error) {
      console.error('Error in data persistence:', error);
    }
  };

  const handleSaveTransaction = (transaction: Transaction) => {
    const isEditing = !!editingTransaction;
    const newTransactions = editingTransaction
      ? data.transactions.map(t => t.id === transaction.id ? transaction : t)
      : [...data.transactions, transaction];
    
    const newData = { ...data, transactions: newTransactions };
    handleSaveData(newData);
    
    // Track activity
    trackActivity(isEditing ? 'edit' : 'add');
    
    // Add notification for transaction events
    if (notificationSettings.transactionNotifications) {
      if (editingTransaction) {
        addNotification(
          'Transaction Updated',
          `${transaction.type === 'income' ? 'Income' : 'Expense'} of ${transaction.currency} ${transaction.amount.toLocaleString()} in "${transaction.category}" updated successfully.`,
          'success'
        );
      } else {
        addNotification(
          'Transaction Added',
          `New ${transaction.type} of ${transaction.currency} ${transaction.amount.toLocaleString()} recorded in "${transaction.category}".`,
          'success'
        );
      }
      // Force immediate notification update
      setTimeout(() => {
        setNotifications(getNotifications());
      }, 100);
    }
    
    if (editingTransaction) {
      setEditingTransaction(null);
      setActiveTab('transactions');
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setActiveTab('add');
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      const newTransactions = data.transactions.filter(t => t.id !== id);
      const newData = { ...data, transactions: newTransactions };
      handleSaveData(newData);
      
      // Track activity
      trackActivity('delete');
      
      if (notificationSettings.transactionNotifications) {
        addNotification(
          'Transaction Deleted',
          'Transaction has been removed from your financial records.',
          'warning'
        );
        setTimeout(() => {
          setNotifications(getNotifications());
        }, 100);
      }
    }
  };

  const handleAddCategory = (category: Category) => {
    const newData = { ...data, categories: [...data.categories, category] };
    handleSaveData(newData);
    
    if (notificationSettings.transactionNotifications) {
      addNotification(
        'Category Added',
        `Custom ${category.type} category "${category.name}" created successfully.`,
        'info'
      );
      setTimeout(() => {
        setNotifications(getNotifications());
      }, 100);
    }
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
    setActiveTab('transactions');
  };

  const handleImport = (importedData: AppData) => {
    handleSaveData(importedData);
    
    // Track activity
    trackActivity('import');
    
    if (notificationSettings.transactionNotifications) {
      addNotification(
        'Data Imported',
        `Backup restored: ${importedData.transactions.length} transactions and ${importedData.categories.length} categories imported.`,
        'success'
      );
      setTimeout(() => {
        setNotifications(getNotifications());
      }, 100);
    }
  };
  
  const handleExport = (type: 'json' | 'csv') => {
    // Track activity
    trackActivity('export');
    
    if (notificationSettings.transactionNotifications) {
      addNotification(
        'Data Exported',
        `Financial data exported as ${type.toUpperCase()} file. Download should start automatically.`,
        'success'
      );
      setTimeout(() => {
        setNotifications(getNotifications());
      }, 100);
    }
  };
  
  const handleNotificationSettingsChange = (newSettings: NotificationSettings) => {
    setNotificationSettings(newSettings);
    saveNotificationSettings(newSettings);
    
    // Clear existing reminders and set new ones
    scheduleReminders();
    
    addNotification(
      'Settings Updated',
      `Notification preferences updated: Weekly reminders ${newSettings.weeklyReminders ? 'enabled' : 'disabled'}, Monthly reminders ${newSettings.monthlyReminders ? 'enabled' : 'disabled'}, Transaction notifications ${newSettings.transactionNotifications ? 'enabled' : 'disabled'}.`,
      'info'
    );
    
    // Force immediate notification update
    setTimeout(() => {
      setNotifications(getNotifications());
    }, 100);
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;
  const usageStats = getUsageStats();
  const autoDownloadSettings = getAutoDownloadSettings();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'add', label: editingTransaction ? 'Edit' : 'Add Transaction', icon: Plus },
    { id: 'transactions', label: 'Transactions', icon: FileText },
    { id: 'settings', label: 'Backup', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <img 
                src="https://cdn.shopify.com/s/files/1/0689/8499/5993/files/Decoricks_Logo_D_sm_small.png" 
                alt="Decoricks Logo" 
                className="h-10 w-10 rounded-lg shadow-sm"
              />
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Decoricks Finance App</h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Home Decor Business Tracker</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-xs sm:text-sm text-gray-500 hidden md:block">
                {data.transactions.length} transactions recorded
              </div>
              <div className="text-xs text-gray-400 hidden lg:block">
                Next backup: {formatNextDownloadTime()}
              </div>
              <button
                onClick={() => setShowNotifications(true)}
                className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1 sm:gap-2 mb-4 sm:mb-6 bg-white p-2 rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#806351] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Date Filter for Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="mb-4 sm:mb-6">
            <DateFilter filter={dateFilter} onChange={setDateFilter} />
          </div>
        )}

        {/* Tab Content */}
        <div>
          {activeTab === 'dashboard' && (
            <Dashboard transactions={data.transactions} dateFilter={dateFilter} />
          )}
          
          {activeTab === 'add' && (
            <TransactionForm
              categories={data.categories}
              editingTransaction={editingTransaction}
              onSave={handleSaveTransaction}
              onAddCategory={handleAddCategory}
              onCancel={editingTransaction ? handleCancelEdit : undefined}
            />
          )}
          
          {activeTab === 'transactions' && (
            <TransactionList
              transactions={data.transactions}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
            />
          )}
          
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <ExportImport 
                data={data} 
                onImport={handleImport} 
                onExport={handleExport}
              />
              
              {/* Notification Settings */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={notificationSettings.weeklyReminders}
                      onChange={(e) => handleNotificationSettingsChange({
                        ...notificationSettings,
                        weeklyReminders: e.target.checked
                      })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Weekly finance review reminders</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={notificationSettings.monthlyReminders}
                      onChange={(e) => handleNotificationSettingsChange({
                        ...notificationSettings,
                        monthlyReminders: e.target.checked
                      })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Monthly finance summary reminders</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={notificationSettings.transactionNotifications}
                      onChange={(e) => handleNotificationSettingsChange({
                        ...notificationSettings,
                        transactionNotifications: e.target.checked
                      })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Transaction notifications</span>
                  </label>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <img 
                      src="https://cdn.shopify.com/s/files/1/0689/8499/5993/files/Decoricks_Logo_D_sm_small.png" 
                      alt="Decoricks Logo" 
                      className="h-8 w-8 rounded-lg"
                    />
                    <div>
                      <p className="text-sm font-medium text-[#806351]">Decoricks Finance</p>
                      <p className="text-xs text-[#6b5444]">Notifications powered by your business</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Notification Panel */}
      <NotificationPanel
        notifications={notifications}
        onMarkAsRead={(id) => {
          markNotificationAsRead(id);
          setNotifications(getNotifications());
        }}
        onClearAll={() => {
          clearAllNotifications();
          setNotifications([]);
        }}
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
};

export default App;