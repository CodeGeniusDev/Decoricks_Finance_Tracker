export interface AutoDownloadSettings {
  enabled: boolean;
  lastDownload: string;
  downloadInterval: number; // in milliseconds
  format: 'json' | 'csv';
}

const AUTO_DOWNLOAD_KEY = 'decoricks-auto-download-settings';
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export const getAutoDownloadSettings = (): AutoDownloadSettings => {
  try {
    const stored = localStorage.getItem(AUTO_DOWNLOAD_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading auto-download settings:', error);
  }
  
  return {
    enabled: true,
    lastDownload: '',
    downloadInterval: WEEK_IN_MS,
    format: 'json'
  };
};

export const saveAutoDownloadSettings = (settings: AutoDownloadSettings): void => {
  try {
    localStorage.setItem(AUTO_DOWNLOAD_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving auto-download settings:', error);
  }
};

export const shouldAutoDownload = (): boolean => {
  const settings = getAutoDownloadSettings();
  if (!settings.enabled) return false;
  
  if (!settings.lastDownload) return true;
  
  const lastDownload = new Date(settings.lastDownload);
  const now = new Date();
  const timeDiff = now.getTime() - lastDownload.getTime();
  
  return timeDiff >= settings.downloadInterval;
};

export const triggerAutoDownload = (data: any): void => {
  const settings = getAutoDownloadSettings();
  
  try {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `decoricks-finance-auto-backup-${timestamp}.${settings.format}`;
    
    let content: string;
    let mimeType: string;
    
    if (settings.format === 'json') {
      content = JSON.stringify(data, null, 2);
      mimeType = 'application/json';
    } else {
      // CSV format for transactions
      const csvContent = [
        ['Date', 'Type', 'Category', 'Amount', 'Currency', 'Description'].join(','),
        ...data.transactions.map((t: any) => [
          t.date,
          t.type,
          `"${t.category}"`,
          t.amount,
          t.currency,
          `"${t.description}"`
        ].join(','))
      ].join('\n');
      content = csvContent;
      mimeType = 'text/csv';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    // Update last download timestamp
    const updatedSettings = {
      ...settings,
      lastDownload: new Date().toISOString()
    };
    saveAutoDownloadSettings(updatedSettings);
    
    console.log(`Auto-download completed: ${filename}`);
    
  } catch (error) {
    console.error('Error during auto-download:', error);
  }
};

export const initializeAutoDownload = (data: any): void => {
  // Check immediately on app start
  if (shouldAutoDownload()) {
    setTimeout(() => {
      triggerAutoDownload(data);
    }, 5000); // Wait 5 seconds after app loads
  }
  
  // Set up periodic check every hour
  setInterval(() => {
    if (shouldAutoDownload()) {
      triggerAutoDownload(data);
    }
  }, 60 * 60 * 1000); // Check every hour
};

export const formatNextDownloadTime = (): string => {
  const settings = getAutoDownloadSettings();
  if (!settings.enabled) return 'Disabled';
  
  if (!settings.lastDownload) return 'Soon (first backup)';
  
  const lastDownload = new Date(settings.lastDownload);
  const nextDownload = new Date(lastDownload.getTime() + settings.downloadInterval);
  const now = new Date();
  
  if (nextDownload <= now) return 'Due now';
  
  const diffMs = nextDownload.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `In ${diffDays} days`;
  
  return nextDownload.toLocaleDateString();
};