import { AppData, Transaction, Category } from '../types';
import { DEFAULT_CATEGORIES } from '../data/categories';

const STORAGE_KEY = 'decoricks-finance-data';

export const loadData = (): AppData => {
  try {
    // Try primary storage first
    let stored = localStorage.getItem(STORAGE_KEY);
    
    // If primary storage is empty, try backup storage
    if (!stored) {
      const backup = localStorage.getItem('decoricks-finance-backup');
      if (backup) {
        const backupData = JSON.parse(backup);
        stored = JSON.stringify({
          transactions: backupData.transactions || [],
          categories: backupData.categories || DEFAULT_CATEGORIES
        });
      }
    }
    
    // If still no data, try session storage
    if (!stored) {
      stored = sessionStorage.getItem('decoricks-finance-session');
    }
    
    if (stored) {
      const data = JSON.parse(stored);
      return {
        transactions: data.transactions || [],
        categories: data.categories || DEFAULT_CATEGORIES,
      };
    }
  } catch (error) {
    console.error('Error loading data:', error);
    
    // Try to recover from backup if main storage is corrupted
    try {
      const backup = localStorage.getItem('decoricks-finance-backup');
      if (backup) {
        const backupData = JSON.parse(backup);
        return {
          transactions: backupData.transactions || [],
          categories: backupData.categories || DEFAULT_CATEGORIES,
        };
      }
    } catch (backupError) {
      console.error('Error loading backup data:', backupError);
    }
  }
  
  return {
    transactions: [],
    categories: DEFAULT_CATEGORIES,
  };
};

export const saveData = (data: AppData): void => {
  try {
    // Validate data before saving
    if (!data || !Array.isArray(data.transactions) || !Array.isArray(data.categories)) {
      console.error('Invalid data structure for saving');
      return;
    }
    
    // Save to primary storage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    
    // Create backup with timestamp
    const backupData = {
      ...data,
      lastBackup: new Date().toISOString(),
      version: '1.0',
      dataIntegrity: true
    };
    localStorage.setItem('decoricks-finance-backup', JSON.stringify(backupData));
    
    // Save to session storage as additional backup
    sessionStorage.setItem('decoricks-finance-session', JSON.stringify(data));
    
    // Additional persistence layer for critical data
    try {
      const criticalData = {
        transactionCount: data.transactions.length,
        categoryCount: data.categories.length,
        lastSaved: new Date().toISOString(),
        checksum: JSON.stringify(data).length
      };
      localStorage.setItem('decoricks-finance-meta', JSON.stringify(criticalData));
    } catch (metaError) {
      console.warn('Could not save metadata:', metaError);
    }
    
  } catch (error) {
    console.error('Error saving data:', error);
    
    // Try alternative storage methods if primary fails
    try {
      sessionStorage.setItem('decoricks-finance-session', JSON.stringify(data));
      alert('Data saved to session storage as backup. Please export your data for safety.');
    } catch (sessionError) {
      console.error('Error saving to session storage:', sessionError);
      alert('Warning: Unable to save data. Please export your data as backup.');
    }
  }
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const exportToJSON = (data: AppData): void => {
  const dataStr = JSON.stringify(data, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `decoricks-finance-${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

export const exportToCSV = (transactions: Transaction[]): void => {
  const csvContent = [
    ['Date', 'Type', 'Category', 'Amount', 'Currency', 'Description'].join(','),
    ...transactions.map(t => [
      t.date,
      t.type,
      `"${t.category}"`,
      t.amount,
      t.currency,
      `"${t.description}"`
    ].join(','))
  ].join('\n');
  
  const dataUri = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(csvContent);
  const exportFileDefaultName = `decoricks-transactions-${new Date().toISOString().split('T')[0]}.csv`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};