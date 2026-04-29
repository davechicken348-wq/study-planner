// Study Planner - Notifications Module
// Handles browser notifications for events, tasks, and classes

const Notifications = (function() {
    const CHECK_INTERVAL = 60 * 1000;
    const REMINDER_WINDOW_MINUTES = 60;
    const STORAGE_KEY = 'studyPlanner_notificationsShown';
    const PERMISSION_REQUESTED_KEY = 'studyPlanner_permissionRequested';

    const KEYS = {
        events: 'studyPlanner_events',
        tasks: 'study_planner_tasks',
        classes: 'study_planner_timetable'
    };

    let checkInterval = null;
    let shownNotifications = new Set();
    let serviceWorkerReady = false;

    // Setup message listener for SW communication
    function setupMessageListener() {
        if (!('serviceWorker' in navigator)) return;
        navigator.serviceWorker.addEventListener('message', (event) => {
            const { type, payload } = event.data || {};
            if (type === 'NOTIFICATION_SHOWN') {
                const { id } = payload || {};
                if (id && !shownNotifications.has(id)) {
                    shownNotifications.add(id);
                    try {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify([...shownNotifications]));
                    } catch (e) {
                        console.error('[Notifications] Failed to save shown ID:', e);
                    }
                }
            }
            // PERMISSION_STATUS no longer needed — SW reads permission directly
        });
    }

    async function init() {
        loadShownNotifications();
        setupMessageListener(); // defined inline above

        if ('serviceWorker' in navigator) {
            try {
                const reg = await navigator.serviceWorker.ready;
                serviceWorkerReady = true;
                console.log('[Notifications] Service Worker ready');
                sendReminderDataToSW();
            } catch (err) {
                console.log('[Notifications] SW unavailable:', err.message);
            }
        } else {
            console.log('[Notifications] Service Worker not supported');
        }

        await requestPermission();
        startPeriodicCheck();
        triggerImmediateCheck();
    }

    async function requestPermission() {
        const already = localStorage.getItem(PERMISSION_REQUESTED_KEY);
        if (already) {
            // Already requested before — check current status
            if (Notification.permission === 'denied') {
                console.warn('[Notifications] Permission previously denied. User must enable via browser settings.');
                return 'denied';
            }
            return Notification.permission;
        }

        if (!('Notification' in window)) {
            console.warn('[Notifications] Notifications not supported');
            return 'unsupported';
        }

        const permission = await Notification.requestPermission();
        localStorage.setItem(PERMISSION_REQUESTED_KEY, 'true');

        if (permission === 'granted') {
            console.log('[Notifications] Permission granted');
        } else if (permission === 'denied') {
            console.warn('[Notifications] Permission denied by user');
        }

        return permission;
    }

    function loadShownNotifications() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            shownNotifications = stored ? new Set(JSON.parse(stored)) : new Set();
        } catch (e) {
            shownNotifications = new Set();
        }
    }

    function saveShownNotifications() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify([...shownNotifications]));
        } catch (e) {
            console.error('[Notifications] Save failed:', e);
        }
    }

    function generateNotificationId(type, itemId, reminderTime) {
        return `${type}_${itemId}_${reminderTime}`;
    }

    function wasNotified(id) {
        return shownNotifications.has(id);
    }

    function markNotified(id) {
        shownNotifications.add(id);
        saveShownNotifications();
    }

    async function sendReminderDataToSW() {
        if (!serviceWorkerReady) return;

        const data = loadAllData();
        const payload = {
            events: (data.events || []).filter(e => e.reminder),
            tasks: (data.tasks || []).filter(t => t.reminder),
            classes: (data.classes || []).filter(c => c.reminder)
        };

        // Save to IndexedDB first, then notify SW (SW will auto-check)
        await saveReminderDataToDB(payload);

        try {
            const reg = await navigator.serviceWorker.ready;
            reg.active?.postMessage({ type: 'UPDATE_REMINDERS', payload });
        } catch (err) {
            console.error('[Notifications] Failed to send data to SW:', err);
        }
    }

    async function saveReminderDataToDB(data) {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open('study-planner-notifications', 3);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                // Create both stores to match SW schema (version 3)
                if (!db.objectStoreNames.contains('reminders')) {
                    db.createObjectStore('reminders', { keyPath: 'type' });
                }
                if (!db.objectStoreNames.contains('shownIds')) {
                    db.createObjectStore('shownIds', { keyPath: 'id' });
                }
            };
            req.onsuccess = (e) => {
                const db = e.target.result;
                const tx = db.transaction('reminders', 'readwrite');
                const store = tx.objectStore('reminders');
                store.put({ type: 'events', data: data.events || [] });
                store.put({ type: 'tasks', data: data.tasks || [] });
                store.put({ type: 'classes', data: data.classes || [] });
                resolve();
            };
            req.onerror = (e) => reject(e.target.error);
        });
    }

    async function showBrowserNotification(title, body, icon = '/favicon.png') {
        if (serviceWorkerReady) {
            try {
                const reg = await navigator.serviceWorker.ready;
                reg.active?.postMessage({ type: 'SHOW_NOTIFICATION', payload: { title, body, icon } });
                return;
            } catch (err) {
                console.warn('[Notifications] SW show failed, falling back:', err);
            }
        }

        if (!('Notification' in window) || Notification.permission !== 'granted') return;

        const notification = new Notification(title, { body, icon });
        notification.onclick = () => { window.focus(); notification.close(); };
        setTimeout(() => notification.close(), 10000);
    }

    function checkAll() {
        const data = loadAllData();
        const now = new Date();

        (data.events || []).forEach(ev => {
            if (!ev.reminder || !ev.startTime || !ev.date) return;
            const evTime = new Date(`${ev.date}T${ev.startTime}`);
            const diffMin = (evTime - now) / 60000;
            if (diffMin > 0 && diffMin <= REMINDER_WINDOW_MINUTES) {
                const id = `evt_${ev.id}_hour`;
                if (!wasNotified(id)) {
                    showBrowserNotification('Upcoming Study Session', `${ev.title} at ${formatTime12h(ev.startTime)}${ev.course ? ` (${ev.course})` : ''}`);
                    markNotified(id);
                }
            }
        });

        (data.tasks || []).forEach(task => {
            if (!task.reminder) return;
            const taskDate = new Date(task.date);
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const taskDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
            const daysUntil = Math.floor((taskDay - today) / (1000 * 60 * 60 * 24));
            if (daysUntil >= 0 && daysUntil <= 1) {
                const id = `task_${task.id}_${daysUntil}`;
                if (!wasNotified(id)) {
                    const label = daysUntil === 0 ? 'today' : 'tomorrow';
                    showBrowserNotification('Task Due Soon', `${task.title} is due ${label}${task.course ? ` (${task.course})` : ''}`);
                    markNotified(id);
                }
            }
        });

        (data.classes || []).forEach(cls => {
            if (!cls.reminder || !cls.day || !cls.startTime) return;
            const today = new Date();
            const dow = today.getDay();
            const map = {monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6,sunday:0};
            const cDow = map[cls.day.toLowerCase()];
            if (cDow === undefined) return;

            const daysUntil = (cDow - dow + 7) % 7;
            if (daysUntil <= 1) {
                const clsMin = parseTime(cls.startTime);
                const nowMin = today.getHours() * 60 + today.getMinutes();
                if (daysUntil === 0) {
                    const diff = clsMin - nowMin;
                    if (diff > 0 && diff <= REMINDER_WINDOW_MINUTES) {
                        const id = `cls_${cls.id}_today`;
                        if (!wasNotified(id)) {
                            showBrowserNotification('Class Starting Soon', `${cls.name} at ${formatTime12h(cls.startTime)}${cls.room ? ' in '+cls.room : ''}`);
                            markNotified(id);
                        }
                    }
                } else {
                    const id = `cls_${cls.id}_tomorrow`;
                    if (!wasNotified(id)) {
                        showBrowserNotification('Class Tomorrow', `${cls.name} at ${formatTime12h(cls.startTime)}`);
                        markNotified(id);
                    }
                }
            }
        });

        sendShownNotificationsToSW();
    }

    function sendShownNotificationsToSW() {
        if (!serviceWorkerReady) return;
        const reg = navigator.serviceWorker.controller;
        if (reg) {
            reg.postMessage({ type: 'SYNC_SHOWN_NOTIFICATIONS', payload: { ids: [...shownNotifications] } });
        }
    }

    function triggerImmediateCheck() {
        // Always run page-side check (shows notifications if tab active)
        checkAll();

        // Also sync reminder data to service worker (which auto-triggers check)
        if (serviceWorkerReady) {
            sendReminderDataToSW().catch(err => {
                console.error('[Notifications] Failed to sync data to SW:', err);
            });
        }
    }

    function startPeriodicCheck() {
        if (checkInterval) clearInterval(checkInterval);
        checkInterval = setInterval(checkAll, CHECK_INTERVAL);
    }

    function stopPeriodicCheck() {
        if (checkInterval) clearInterval(checkInterval);
    }

    function loadAllData() {
        try {
            return {
                events: JSON.parse(localStorage.getItem(KEYS.events) || '[]'),
                tasks: JSON.parse(localStorage.getItem(KEYS.tasks) || '[]'),
                classes: JSON.parse(localStorage.getItem(KEYS.classes) || '[]')
            };
        } catch (e) {
            return { events: [], tasks: [], classes: [] };
        }
    }

    function parseTime(t) {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    }

    function formatTime12h(t) {
        const [h, m] = t.split(':').map(Number);
        const p = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${m.toString().padStart(2,'0')} ${p}`;
    }

    return { init, triggerImmediateCheck, startPeriodicCheck, stopPeriodicCheck };
})();

document.addEventListener('DOMContentLoaded', () => Notifications.init());
