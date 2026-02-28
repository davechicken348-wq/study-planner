# 🔔 Smart Notification System - Complete Guide

## Overview
The enhanced notification system is a foolproof, intelligent reminder system that respects user preferences and optimizes notification timing.

## Key Features

### 1. **Smart Timing** 🧠
- Notifies at optimal study times: 9 AM, 2 PM, 7 PM
- Avoids notification fatigue
- Learns from your study patterns

### 2. **Priority Levels** 🎯
- **High (🔴)**: Overdue sessions - Requires interaction
- **Medium (🟡)**: Due today - Standard notification
- **Low (🟢)**: Due tomorrow - Gentle reminder

### 3. **Quiet Hours** 🌙
- Set custom quiet hours (default: 10 PM - 7 AM)
- No notifications during sleep/rest time
- Respects your schedule

### 4. **Frequency Control** ⏰
- **Smart**: Notifies at optimal times (recommended)
- **Hourly**: Every hour check
- **Twice Daily**: Morning and evening
- **Daily**: Once per day

### 5. **Snooze Function** ⏸️
- Snooze individual or all sessions
- Customizable snooze duration (5-120 minutes)
- Temporary pause without dismissing

### 6. **Daily Limits** 🚫
- Max notifications per day (default: 5)
- Prevents notification spam
- Configurable 1-20 per day

### 7. **Session Categorization** 📊
- Automatically categorizes sessions:
  - Overdue (past due date)
  - Today (due today)
  - Tomorrow (due tomorrow)
- Smart filtering based on priority settings

### 8. **Active Notification Management** 📱
- Tracks all active notifications
- Close all with one action
- Prevents duplicate notifications

## Settings Configuration

### Access Settings
Click the bell icon (🔔) at bottom-right of dashboard

### Available Settings

#### Enable/Disable
Toggle notifications on/off without losing settings

#### Frequency Options
```
Smart (Recommended)    → Notifies at 9 AM, 2 PM, 7 PM
Hourly                 → Checks every hour
Twice Daily            → Morning (9 AM) & Evening (7 PM)
Daily                  → Once per day (9 AM)
```

#### Quiet Hours
```
Start: 22 (10 PM)
End: 7 (7 AM)
```
No notifications between these hours

#### Priority Filters
```
☑ High (Overdue)       → Always notify
☑ Medium (Due Today)   → Standard notify
☐ Low (Tomorrow)       → Optional
```

#### Snooze Duration
```
Default: 30 minutes
Range: 5-120 minutes
```

#### Max Per Day
```
Default: 5 notifications
Range: 1-20 notifications
```

#### Smart Timing
```
☑ Enabled → Only notify at optimal times
☐ Disabled → Notify anytime (respects frequency)
```

#### Sound & Vibration
```
☑ Sound → Play notification sound
☑ Vibrate → Vibrate on mobile devices
```

## How It Works

### 1. Permission Request
- Shows banner on first visit
- One-click enable
- Test notification on enable

### 2. Session Checking
```javascript
Every check interval:
  1. Check if quiet hours → Skip
  2. Check daily limit → Skip if exceeded
  3. Check smart timing → Skip if not optimal time
  4. Get due sessions
  5. Filter by priority settings
  6. Remove snoozed sessions
  7. Send notification if any due
```

### 3. Notification Display
```
Overdue (High Priority):
  ⚠️ Overdue Study Sessions!
  3 sessions overdue
  📖 Mathematics +2 more
  [Requires interaction]

Due Today (Medium Priority):
  📚 Study Sessions Due Today
  2 sessions waiting
  📖 Physics +1 more
  [Auto-close after 8s]

Tomorrow (Low Priority):
  📅 Upcoming Sessions Tomorrow
  4 sessions due tomorrow
  Stay prepared!
  [Auto-close after 8s]
```

### 4. User Actions
- **Click notification** → Opens dashboard
- **Snooze** → Postpone for X minutes
- **Dismiss** → Close notification
- **View Sessions** → Scroll to session list

## API Reference

### NotificationManager Methods

#### `requestPermission()`
```javascript
const granted = await notificationManager.requestPermission();
// Returns: true if granted, false otherwise
```

#### `showNotification(title, options)`
```javascript
notificationManager.showNotification('Study Time!', {
  body: 'Mathematics session due now',
  priority: 'high',
  url: '/dashboard.html',
  tag: 'math-session'
});
```

#### `checkDueSessions()`
```javascript
const { overdue, today, tomorrow, all } = notificationManager.checkDueSessions();
// Returns categorized sessions with priority levels
```

#### `snoozeSession(sessionId, minutes)`
```javascript
notificationManager.snoozeSession('session-123', 30);
// Snooze specific session for 30 minutes
```

#### `saveSettings(settings)`
```javascript
notificationManager.saveSettings({
  enabled: true,
  frequency: 'smart',
  quietHours: { start: 22, end: 7 }
});
```

#### `getStatus()`
```javascript
const status = notificationManager.getStatus();
// Returns: { supported, permission, enabled, settings, dueSessions, activeNotifications, isQuietHours }
```

#### `testNotification()`
```javascript
notificationManager.testNotification();
// Sends test notification
```

#### `closeAll()`
```javascript
notificationManager.closeAll();
// Closes all active notifications
```

## Best Practices

### For Users
1. **Enable on first visit** - Don't miss important reviews
2. **Set quiet hours** - Match your sleep schedule
3. **Use smart timing** - Get notified when you're most likely to study
4. **Adjust priorities** - Only get notifications you care about
5. **Snooze, don't dismiss** - Temporarily postpone without losing track

### For Developers
1. **Always check permission** before showing notifications
2. **Respect quiet hours** - Don't disturb users
3. **Limit frequency** - Prevent notification fatigue
4. **Categorize properly** - Use correct priority levels
5. **Test thoroughly** - Use `testNotification()` method

## Troubleshooting

### Notifications Not Showing
1. Check browser permission: Settings → Site Settings → Notifications
2. Verify enabled in app: Click bell icon → Check "Enable Notifications"
3. Check quiet hours: Might be in quiet period
4. Check daily limit: May have reached max per day
5. Check priority filters: Session priority might be disabled

### Too Many Notifications
1. Reduce frequency: Settings → Change to "Daily"
2. Lower daily limit: Settings → Set to 2-3
3. Enable quiet hours: Settings → Set longer quiet period
4. Disable low priority: Settings → Uncheck "Low (Tomorrow)"

### Wrong Timing
1. Enable smart timing: Settings → Check "Smart Timing"
2. Adjust quiet hours: Settings → Match your schedule
3. Change frequency: Settings → Try "Twice Daily"

## Privacy & Security
- ✅ All data stored locally (localStorage)
- ✅ No external servers
- ✅ No tracking or analytics
- ✅ No personal data collection
- ✅ Full user control

## Browser Compatibility
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS 14+, Android 10+)

## Future Enhancements
- [ ] Custom notification sounds
- [ ] Notification history
- [ ] Study streak reminders
- [ ] Achievement notifications
- [ ] Weekly summary notifications
- [ ] Smart scheduling suggestions
- [ ] Integration with calendar apps

## Support
For issues or questions, check:
1. Browser console for errors
2. Notification permission in browser settings
3. App settings (bell icon)
4. Test notification feature

---

**Version:** 2.0.0  
**Last Updated:** 2024  
**Status:** Production Ready ✅
