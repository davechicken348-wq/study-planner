# Notification System — Fix Summary

## Bugs Fixed

### 1. Service Worker Registered Twice
- **Problem**: `notifications.js` was calling `registerServiceWorker()` AND `sw-register.js` also registered
- **Fix**: Removed duplicate registration from `notifications.js`. Only `sw-register.js` handles registration now.

### 2. IndexedDB Schema Mismatch
- **Problem**: Page used DB name `'study-planner-data'` with one store; SW used `'study-planner-notifications'` with two stores → data not shared
- **Fix**: Both now use `'study-planner-notifications'` version 3 with:
  - `'reminders'` store (keyPath: `type`) — holds events/tasks/classes arrays
  - `'shownIds'` store (keyPath: `id`) — tracks which notifications already shown

### 3. Dead Code After Return
- **Problem**: Message listener placed after IIFE `return` statement → never executed
- **Fix**: Moved `setupMessageListener()` call inside `init()` before return

### 4. Permission Request Confusion
- **Problem**: SW tried to ask page for permission status via `CHECK_PERMISSION`/`PERMISSION_STATUS` messages; page also requested
- **Fix**: Simplified — page requests permission once on init; SW reads `Notification.permission` directly; no more permission-status messages

### 5. Data Sync Not Awaited
- **Problem**: `sendReminderDataToSW()` didn't await IndexedDB write before sending `UPDATE_REMINDERS` message → SW could read stale data
- **Fix**: Made `saveReminderDataToDB()` awaited; `sendReminderDataToSW()` now `await`s it

### 6. Duplicate Trigger Messages
- **Problem**: Both page and SW sent separate `TRIGGER_CHECK` messages causing redundant checks
- **Fix**: Removed `TRIGGER_CHECK` entirely. SW now automatically calls `checkAndNotify()` after processing `UPDATE_REMINDERS`

---

## Current Data Flow

```
User adds task → localStorage updated
    ↓
notifications.js: triggerImmediateCheck()
    ├─ checkAll() ← page-side check (if tab active, shows immediately)
    └─ sendReminderDataToSW()
         ├─ await saveReminderDataToDB(payload) → IndexedDB (reminders store)
         └─ postMessage(UPDATE_REMINDERS) → Service Worker
                ↓
         SW receives UPDATE_REMINDERS
                ↓
         saveReminderDataToDB(payload) → IndexedDB (same DB, redundancy ok)
                ↓
         checkAndNotify() → reads from IndexedDB, shows notification
```

---

## File Checklist

| File | Key Points |
|------|------------|
| `js/notifications.js` | Requests permission, checks reminders (page), syncs to IndexedDB, sends `UPDATE_REMINDERS` to SW |
| `sw.js` | Reads permission directly, loads reminder data from IndexedDB every 60s, shows notifications via SW API |
| `js/sw-register.js` | Registers SW with auto-detected path (root or subfolder) |
| `storage.js` | No changes needed — already saves tasks/events/classes with `reminder` boolean |

---

## Testing Checklist

1. **Clear old data**
   - Open DevTools → Application → Clear storage → Clear all
   - Or use incognito

2. **Serve via HTTP server** (service workers require it)
   ```bash
   python3 -m http.server 8000
   # Open http://localhost:8000
   ```

3. **Allow notifications** when browser prompts

4. **Add test item**
   - Task: due 2 minutes from now, with "Remind me" checked
   - Event: start time 2 minutes from now, with reminder checked
   - Class: today at time 2 minutes from now, with reminder checked

5. **Wait ≤60 seconds** for check interval (or reload page to trigger immediate check)

6. **Switch to another tab or minimize** → desktop notification should appear

7. **Verify no duplicate prompts** — permission should only be requested once

---

## GitHub Pages Deployment

`sw.js` **must be at your deployment root**. If using `/docs` folder, copy it there:

```bash
cp sw.js docs/
git add docs/sw.js
git commit -m "Deploy sw.js to GitHub Pages"
git push
```

`sw-register.js` automatically detects base path and tries:
- `/sw.js`
- `/Study-Planner/sw.js`
- `/study-planner/sw.js`

---

## Known Limitations

- **Browser must be open** (service worker runs only while browser is running)
- **Tab can be in background** — notifications still work
- **No true background push** without server; this is client-side polling every 60s
- **HTTPS or localhost required** for service workers

---

## Console Debugging

Look for these log prefixes:
- `[Notifications]` — from `notifications.js`
- `[SW]` — from service worker

Expected sequence on page load:
```
[Notifications] Service Worker ready
[Notifications] Permission granted (or status)
[SW] Study Planner service worker loaded
```

When adding a task:
```
[Notifications] 
[SW] Notification shown: Task Due Soon
```
