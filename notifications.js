// Smart StudyPlanner Notification System
class NotificationManager {
  constructor() {
    this.permission = Notification.permission;
    this.checkInterval = null;
    this.settings = this.loadSettings();
    this.notificationQueue = [];
    this.activeNotifications = new Map();
  }

  loadSettings() {
    const defaults = {
      enabled: true,
      frequency: 'smart', // smart, hourly, twice-daily, daily
      quietHours: { start: 22, end: 7 }, // 10 PM to 7 AM
      priority: { high: true, medium: true, low: false },
      sound: true,
      vibrate: true,
      snoozeMinutes: 30,
      maxPerDay: 5,
      smartTiming: true // Notify at optimal study times
    };
    const saved = localStorage.getItem('notification_settings');
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  }

  saveSettings(settings) {
    this.settings = { ...this.settings, ...settings };
    localStorage.setItem('notification_settings', JSON.stringify(this.settings));
  }

  async requestPermission() {
    if (!('Notification' in window)) return false;
    if (this.permission === 'granted') return true;
    if (this.permission !== 'denied') {
      this.permission = await Notification.requestPermission();
      if (this.permission === 'granted') this.startSmartCheck();
      return this.permission === 'granted';
    }
    return false;
  }

  isQuietHours() {
    if (!this.settings.quietHours) return false;
    const hour = new Date().getHours();
    const { start, end } = this.settings.quietHours;
    return start > end ? (hour >= start || hour < end) : (hour >= start && hour < end);
  }

  canNotify() {
    if (!this.settings.enabled || this.permission !== 'granted') return false;
    if (this.isQuietHours()) return false;
    const today = new Date().toISOString().split('T')[0];
    const count = parseInt(localStorage.getItem(`notif_count_${today}`) || '0');
    return count < this.settings.maxPerDay;
  }

  incrementNotificationCount() {
    const today = new Date().toISOString().split('T')[0];
    const count = parseInt(localStorage.getItem(`notif_count_${today}`) || '0');
    localStorage.setItem(`notif_count_${today}`, (count + 1).toString());
  }

  showNotification(title, options = {}) {
    if (!this.canNotify()) return null;

    const defaultOptions = {
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      vibrate: this.settings.vibrate ? [200, 100, 200] : [],
      tag: options.tag || 'study-' + Date.now(),
      requireInteraction: options.priority === 'high',
      silent: !this.settings.sound,
      ...options
    };

    const notification = new Notification(title, defaultOptions);
    this.activeNotifications.set(defaultOptions.tag, notification);
    this.incrementNotificationCount();

    notification.onclick = () => {
      window.focus();
      notification.close();
      this.activeNotifications.delete(defaultOptions.tag);
      if (options.onClick) options.onClick();
      else if (options.url) window.location.href = options.url;
    };

    notification.onclose = () => this.activeNotifications.delete(defaultOptions.tag);
    
    // Auto-close after delay unless high priority
    if (options.priority !== 'high') {
      setTimeout(() => notification.close(), 8000);
    }

    return notification;
  }

  checkDueSessions() {
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const tomorrow = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
    
    const categorize = (session) => {
      if (session.completed || session.level > 5) return null;
      const nextReview = session.nextReview || session.date?.split('T')[0];
      if (!nextReview) return null;
      
      const daysDiff = Math.floor((new Date(nextReview) - new Date(today)) / 86400000);
      
      if (daysDiff < 0) return { ...session, priority: 'high', category: 'overdue', daysDiff };
      if (daysDiff === 0) return { ...session, priority: 'medium', category: 'today', daysDiff };
      if (daysDiff === 1) return { ...session, priority: 'low', category: 'tomorrow', daysDiff };
      return null;
    };

    const categorized = sessions.map(categorize).filter(Boolean);
    
    return {
      overdue: categorized.filter(s => s.category === 'overdue'),
      today: categorized.filter(s => s.category === 'today'),
      tomorrow: categorized.filter(s => s.category === 'tomorrow'),
      all: categorized
    };
  }

  notifyDueSessions() {
    const { overdue, today, tomorrow } = this.checkDueSessions();
    const snoozed = this.getSnoozedSessions();
    
    // Filter out snoozed sessions
    const activeOverdue = overdue.filter(s => !snoozed.includes(s.id));
    const activeToday = today.filter(s => !snoozed.includes(s.id));

    // Priority: Overdue > Today > Tomorrow
    if (activeOverdue.length > 0 && this.settings.priority.high) {
      this.showNotification('⚠️ Overdue Study Sessions!', {
        body: `${activeOverdue.length} session${activeOverdue.length > 1 ? 's' : ''} overdue\n📖 ${activeOverdue[0].subject}${activeOverdue.length > 1 ? ` +${activeOverdue.length - 1} more` : ''}`,
        priority: 'high',
        tag: 'overdue-sessions',
        url: '/dashboard.html',
        actions: [{ action: 'view', title: 'View Now' }, { action: 'snooze', title: 'Snooze 30m' }]
      });
    } else if (activeToday.length > 0 && this.settings.priority.medium) {
      this.showNotification('📚 Study Sessions Due Today', {
        body: `${activeToday.length} session${activeToday.length > 1 ? 's' : ''} waiting\n📖 ${activeToday[0].subject}${activeToday.length > 1 ? ` +${activeToday.length - 1} more` : ''}`,
        priority: 'medium',
        tag: 'today-sessions',
        url: '/dashboard.html'
      });
    } else if (tomorrow.length > 0 && this.settings.priority.low) {
      this.showNotification('📅 Upcoming Sessions Tomorrow', {
        body: `${tomorrow.length} session${tomorrow.length > 1 ? 's' : ''} due tomorrow\nStay prepared!`,
        priority: 'low',
        tag: 'tomorrow-sessions',
        url: '/dashboard.html'
      });
    }
  }

  getOptimalNotificationTimes() {
    // Smart times: 9 AM, 2 PM, 7 PM (typical study times)
    return [9, 14, 19];
  }

  shouldNotifyNow() {
    if (!this.settings.smartTiming) return true;
    
    const hour = new Date().getHours();
    const optimalTimes = this.getOptimalNotificationTimes();
    
    // Notify if within 30 minutes of optimal time
    return optimalTimes.some(time => Math.abs(hour - time) < 0.5);
  }

  startSmartCheck() {
    this.checkAndNotify();
    
    const interval = this.settings.frequency === 'smart' ? 30 * 60 * 1000 : // 30 min
                     this.settings.frequency === 'hourly' ? 60 * 60 * 1000 : // 1 hour
                     this.settings.frequency === 'twice-daily' ? 12 * 60 * 60 * 1000 : // 12 hours
                     24 * 60 * 60 * 1000; // daily
    
    this.checkInterval = setInterval(() => this.checkAndNotify(), interval);
  }

  checkAndNotify() {
    if (!this.canNotify()) return;
    
    const lastCheck = localStorage.getItem('lastNotificationCheck');
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Smart timing check
    if (this.settings.smartTiming && !this.shouldNotifyNow()) return;
    
    // Frequency-based throttling
    if (lastCheck) {
      const lastTime = new Date(lastCheck).getTime();
      const minInterval = this.settings.frequency === 'smart' ? 2 * 60 * 60 * 1000 : // 2 hours
                         this.settings.frequency === 'hourly' ? 60 * 60 * 1000 : // 1 hour
                         this.settings.frequency === 'twice-daily' ? 12 * 60 * 60 * 1000 : // 12 hours
                         24 * 60 * 60 * 1000; // daily
      
      if (now.getTime() - lastTime < minInterval) return;
    }

    const { all } = this.checkDueSessions();
    if (all.length > 0) {
      this.notifyDueSessions();
      localStorage.setItem('lastNotificationCheck', now.toISOString());
    }
  }

  snoozeSession(sessionId, minutes = null) {
    const snoozeTime = minutes || this.settings.snoozeMinutes;
    const snoozed = this.getSnoozedSessions();
    const snoozeUntil = new Date(Date.now() + snoozeTime * 60000).toISOString();
    
    snoozed[sessionId] = snoozeUntil;
    localStorage.setItem('snoozed_sessions', JSON.stringify(snoozed));
  }

  getSnoozedSessions() {
    const snoozed = JSON.parse(localStorage.getItem('snoozed_sessions') || '{}');
    const now = new Date().toISOString();
    
    // Clean expired snoozes
    Object.keys(snoozed).forEach(id => {
      if (snoozed[id] < now) delete snoozed[id];
    });
    
    localStorage.setItem('snoozed_sessions', JSON.stringify(snoozed));
    return Object.keys(snoozed);
  }

  stopDailyCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  closeAll() {
    this.activeNotifications.forEach(n => n.close());
    this.activeNotifications.clear();
  }

  getStatus() {
    const { all } = this.checkDueSessions();
    return {
      supported: 'Notification' in window,
      permission: this.permission,
      enabled: this.settings.enabled && this.permission === 'granted',
      settings: this.settings,
      dueSessions: all.length,
      activeNotifications: this.activeNotifications.size,
      isQuietHours: this.isQuietHours()
    };
  }

  testNotification() {
    this.showNotification('🎉 Test Notification', {
      body: 'Your notifications are working perfectly!',
      priority: 'medium',
      tag: 'test-notification'
    });
  }
}

const notificationManager = new NotificationManager();

if (notificationManager.permission === 'granted') {
  notificationManager.startSmartCheck();
}
