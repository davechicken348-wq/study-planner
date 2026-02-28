# 🔔 Browser Notification System - Integration Guide

## Files Created
1. `notifications.js` - Core notification manager
2. `notification-ui.js` - UI components for dashboard
3. Updated `sw.js` - Service Worker notification handling
4. Updated `styles.css` - Notification styles

## How to Integrate

### Step 1: Add Scripts to Dashboard
Add these script tags to `dashboard.html` before closing `</body>`:

```html
<script src="notifications.js" defer></script>
<script src="notification-ui.js" defer></script>
```

### Step 2: That's It!
The system will automatically:
- Show a banner asking for notification permission (first visit only)
- Check for due sessions when dashboard loads
- Send browser notifications for due/overdue sessions
- Check every hour for new due sessions

## Features

### ✅ What It Does
- **Permission Request**: Friendly banner on first dashboard visit
- **Due Session Alerts**: Shows banner when sessions are due
- **Browser Notifications**: Sends push notifications (if permitted)
- **Hourly Checks**: Automatically checks for due sessions
- **One Per Day**: Only notifies once per day (not annoying)
- **100% Private**: All data stays in localStorage

### 🎯 User Experience
1. User visits dashboard
2. Sees friendly banner: "Stay on track with reminders"
3. Clicks "Enable" → Browser asks for permission
4. Gets notified when sessions are due
5. Can dismiss banner if not interested

### 📱 Notification Types

**In-App Banner** (always shown):
```
📚 Sessions Due Today
3 sessions waiting for review
[View Sessions →]
```

**Browser Notification** (if permitted):
```
📚 Study Reminder
3 sessions due today
📖 Biology Chapter 5 +2 more
```

**Overdue Alert**:
```
⚠️ Overdue Sessions!
You have 2 overdue sessions waiting
```

## API Usage

### Manual Control
```javascript
// Request permission
await notificationManager.requestPermission();

// Check due sessions
const { dueToday, overdue, total } = notificationManager.checkDueSessions();

// Send notification
notificationManager.showNotification('Title', {
  body: 'Message',
  url: '/dashboard.html'
});

// Start/stop checking
notificationManager.startDailyCheck();
notificationManager.stopDailyCheck();

// Get status
const status = notificationManager.getStatus();
// { supported: true, permission: 'granted', enabled: true }
```

## Settings Integration (Optional)

Add to settings modal:
```html
<div class="setting-group">
  <label class="setting-label">
    <i class="fas fa-bell"></i> Notifications
  </label>
  <div class="setting-toggle">
    <input type="checkbox" id="notificationsToggle">
    <label for="notificationsToggle">Enable study reminders</label>
  </div>
</div>
```

## Browser Support
- ✅ Chrome 50+
- ✅ Firefox 44+
- ✅ Safari 16+
- ✅ Edge 79+
- ❌ iOS Safari (limited)

## Privacy
- ✅ No data sent to servers
- ✅ No tracking
- ✅ All data in localStorage
- ✅ User controls permission
- ✅ Can be dismissed permanently

## Testing

### Test Notification
```javascript
// In browser console
notificationManager.showNotification('Test', {
  body: 'This is a test notification'
});
```

### Test Due Sessions
```javascript
// Create a due session
const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
sessions.push({
  id: Date.now(),
  subject: 'Test Subject',
  date: new Date().toISOString().split('T')[0],
  nextReview: new Date().toISOString().split('T')[0],
  completed: false
});
localStorage.setItem('sessions', JSON.stringify(sessions));

// Reload dashboard to see banner
location.reload();
```

## Troubleshooting

### Notifications Not Showing
1. Check permission: `Notification.permission`
2. Check browser support: `'Notification' in window`
3. Check if blocked in browser settings
4. Clear localStorage: `localStorage.removeItem('lastNotificationCheck')`

### Banner Not Appearing
1. Check if dismissed: `localStorage.getItem('notificationBannerDismissed')`
2. Clear: `localStorage.removeItem('notificationBannerDismissed')`
3. Reload dashboard

### Reset Everything
```javascript
localStorage.removeItem('notificationBannerDismissed');
localStorage.removeItem('lastNotificationCheck');
location.reload();
```

## Future Enhancements
- [ ] Custom notification times (morning/evening)
- [ ] Notification sound options
- [ ] Weekly summary notifications
- [ ] Streak reminder notifications
- [ ] Achievement unlock notifications
