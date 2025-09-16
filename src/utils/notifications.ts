export interface NotificationSettings {
  weeklyReminders: boolean;
  monthlyReminders: boolean;
  transactionNotifications: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'reminder';
  timestamp: string;
  read: boolean;
}

const NOTIFICATION_SETTINGS_KEY = 'decoricks-notification-settings';
const NOTIFICATIONS_KEY = 'decoricks-notifications';

export const getNotificationSettings = (): NotificationSettings => {
  try {
    const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading notification settings:', error);
  }
  
  return {
    weeklyReminders: true,
    monthlyReminders: true,
    transactionNotifications: true
  };
};

export const saveNotificationSettings = (settings: NotificationSettings): void => {
  try {
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving notification settings:', error);
  }
};

export const getNotifications = (): AppNotification[] => {
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
  return [];
};

export const saveNotifications = (notifications: AppNotification[]): void => {
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.error('Error saving notifications:', error);
  }
};

export const addNotification = (
  title: string, 
  message: string, 
  type: 'success' | 'info' | 'warning' | 'reminder' = 'info'
): void => {
  const notifications = getNotifications();
  const newNotification: AppNotification = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    title,
    message,
    type,
    timestamp: new Date().toISOString(),
    read: false
  };
  
  notifications.unshift(newNotification);
  // Keep only last 50 notifications
  if (notifications.length > 50) {
    notifications.splice(50);
  }
  
  saveNotifications(notifications);
  
  // Show browser notification if permission granted
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body: message,
      icon: 'https://cdn.shopify.com/s/files/1/0689/8499/5993/files/Decoricks_Logo_D_sm_small.png',
      tag: newNotification.id
    });
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

export const scheduleReminders = (): void => {
  try {
    const settings = getNotificationSettings();
  
    // Clear existing reminders
    try {
      const existingReminders = JSON.parse(localStorage.getItem('decoricks-reminders') || '[]');
      existingReminders.forEach((id: number) => {
        clearTimeout(id);
        clearInterval(id);
      });
      localStorage.removeItem('decoricks-reminders');
    } catch (error) {
      console.error('Error clearing existing reminders:', error);
    }
  
    const reminderIds: number[] = [];
  
    if (settings.weeklyReminders) {
      // Schedule weekly reminder
      const now = new Date();
      const nextSunday = new Date(now);
      const daysUntilSunday = now.getDay() === 0 ? 7 : 7 - now.getDay();
      nextSunday.setDate(now.getDate() + daysUntilSunday);
      nextSunday.setHours(9, 0, 0, 0);
    
      const timeUntilSunday = nextSunday.getTime() - now.getTime();
    
      // Actual weekly reminder
      if (timeUntilSunday > 0) {
        const weeklyReminderId = window.setTimeout(() => {
          addNotification(
            'Weekly Finance Review',
            'Time to review your weekly income and expenses for Decoricks!',
            'reminder'
          );
        
          // Set up recurring weekly reminder
          const recurringId = window.setInterval(() => {
            addNotification(
              'Weekly Finance Review',
              'Time to review your weekly income and expenses for Decoricks!',
              'reminder'
            );
          }, 7 * 24 * 60 * 60 * 1000); // Every 7 days
        
          // Store recurring reminder ID
          try {
            const currentReminders = JSON.parse(localStorage.getItem('decoricks-reminders') || '[]');
            currentReminders.push(recurringId);
            localStorage.setItem('decoricks-reminders', JSON.stringify(currentReminders));
          } catch (error) {
            console.error('Error storing recurring reminder:', error);
          }
        }, timeUntilSunday);
        reminderIds.push(weeklyReminderId);
      }
    }
  
    if (settings.monthlyReminders) {
      // Schedule monthly reminder
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 10, 0, 0, 0);
      const timeUntilNextMonth = nextMonth.getTime() - now.getTime();
    
      // Actual monthly reminder
      if (timeUntilNextMonth > 0) {
        const monthlyReminderId = window.setTimeout(() => {
          addNotification(
            'Monthly Finance Summary',
            'Review your monthly financial performance and plan for the upcoming month!',
            'reminder'
          );
        
          // Set up recurring monthly reminder
          const recurringId = window.setInterval(() => {
            const now = new Date();
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 10, 0, 0, 0);
            const timeUntilNext = nextMonth.getTime() - now.getTime();
          
            if (timeUntilNext <= 24 * 60 * 60 * 1000) { // Within 24 hours of 1st
              addNotification(
                'Monthly Finance Summary',
                'Review your monthly financial performance and plan for the upcoming month!',
                'reminder'
              );
            }
          }, 24 * 60 * 60 * 1000); // Check daily
        
          // Store recurring reminder ID
          try {
            const currentReminders = JSON.parse(localStorage.getItem('decoricks-reminders') || '[]');
            currentReminders.push(recurringId);
            localStorage.setItem('decoricks-reminders', JSON.stringify(currentReminders));
          } catch (error) {
            console.error('Error storing recurring reminder:', error);
          }
        }, timeUntilNextMonth);
        reminderIds.push(monthlyReminderId);
      }
    }
  
    try {
      localStorage.setItem('decoricks-reminders', JSON.stringify(reminderIds));
    } catch (error) {
      console.error('Error saving reminder IDs:', error);
    }
  } catch (error) {
    console.error('Error scheduling reminders:', error);
  }
};

export const markNotificationAsRead = (id: string): void => {
  const notifications = getNotifications();
  const updated = notifications.map(n => 
    n.id === id ? { ...n, read: true } : n
  );
  saveNotifications(updated);
};

export const clearAllNotifications = (): void => {
  saveNotifications([]);
};