export interface LiveTrackingData {
  sessionStart: string;
  totalSessions: number;
  transactionsAdded: number;
  transactionsEdited: number;
  transactionsDeleted: number;
  exportsPerformed: number;
  importsPerformed: number;
  lastActivity: string;
  dailyUsage: Record<string, number>;
}

const LIVE_TRACKING_KEY = 'decoricks-live-tracking';

export const getLiveTrackingData = (): LiveTrackingData => {
  try {
    const stored = localStorage.getItem(LIVE_TRACKING_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading live tracking data:', error);
  }
  
  return {
    sessionStart: new Date().toISOString(),
    totalSessions: 1,
    transactionsAdded: 0,
    transactionsEdited: 0,
    transactionsDeleted: 0,
    exportsPerformed: 0,
    importsPerformed: 0,
    lastActivity: new Date().toISOString(),
    dailyUsage: {}
  };
};

export const saveLiveTrackingData = (data: LiveTrackingData): void => {
  try {
    localStorage.setItem(LIVE_TRACKING_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving live tracking data:', error);
  }
};

export const trackActivity = (activity: 'add' | 'edit' | 'delete' | 'export' | 'import'): void => {
  const data = getLiveTrackingData();
  const today = new Date().toISOString().split('T')[0];
  
  // Update activity counters
  switch (activity) {
    case 'add':
      data.transactionsAdded++;
      break;
    case 'edit':
      data.transactionsEdited++;
      break;
    case 'delete':
      data.transactionsDeleted++;
      break;
    case 'export':
      data.exportsPerformed++;
      break;
    case 'import':
      data.importsPerformed++;
      break;
  }
  
  // Update daily usage
  data.dailyUsage[today] = (data.dailyUsage[today] || 0) + 1;
  data.lastActivity = new Date().toISOString();
  
  saveLiveTrackingData(data);
};

export const initializeSession = (): void => {
  const data = getLiveTrackingData();
  const now = new Date().toISOString();
  
  // Check if this is a new session (more than 30 minutes since last activity)
  if (data.lastActivity) {
    const lastActivity = new Date(data.lastActivity);
    const timeDiff = new Date().getTime() - lastActivity.getTime();
    const thirtyMinutes = 30 * 60 * 1000;
    
    if (timeDiff > thirtyMinutes) {
      data.totalSessions++;
      data.sessionStart = now;
    }
  }
  
  data.lastActivity = now;
  saveLiveTrackingData(data);
};

export const getUsageStats = (): {
  totalTransactions: number;
  totalSessions: number;
  averageDaily: number;
  mostActiveDay: string;
} => {
  const data = getLiveTrackingData();
  const totalTransactions = data.transactionsAdded + data.transactionsEdited + data.transactionsDeleted;
  
  const dailyUsageValues = Object.values(data.dailyUsage);
  const averageDaily = dailyUsageValues.length > 0 
    ? dailyUsageValues.reduce((a, b) => a + b, 0) / dailyUsageValues.length 
    : 0;
  
  const mostActiveDay = Object.entries(data.dailyUsage)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'No data';
  
  return {
    totalTransactions,
    totalSessions: data.totalSessions,
    averageDaily: Math.round(averageDaily * 10) / 10,
    mostActiveDay
  };
};