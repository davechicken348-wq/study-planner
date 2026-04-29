// Study Planner - Notifications Module
// Main page coordinates reminders; Service Worker displays them in background

const Notifications = (function() {
    const CHECK_INTERVAL = 60 * 1000; // 60 seconds
    const REMINDER_WINDOW_MINUTES = 60;
    const STORAGE_KEY = 'studyPlanner_notificationsShown';
    const PERMISSION_REQUESTED_KEY = 'studyPlanner_permissionRequested';

    // Storage keys
    const KEYS = {
        events: 'studyPlanner_events',
        tasks: 'study_planner_tasks',
        classes: 'study_planner_timetable'
    };

    let checkInterval = null;
    let shownNotifications = new Set();
    let serviceWorkerReady = false;

    async function init() {
        loadShownNotifications();
        // Service worker registration handled by sw-register.js
        // Just wait for it to become ready
        if ('serviceWorker' in navigator) {
            try {
                const reg = await navigator.serviceWorker.ready;
                serviceWorkerReady = true;
                console.log('[Notifications] Service Worker ready');
                sendReminderDataToSW();
            } catch (err) {
                console.log('[Notifications] SW not available:', err.message);
            }
        } else {
            console.log('[Notifications] Service Worker not supported');
        }
        await requestPermission();
        startPeriodicCheck();
        triggerImmediateCheck();
    }

    // Register service worker
    async function registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.warn('Service Worker not supported');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            serviceWorkerReady = true;
            console.log('[Notifications] Service Worker registered');

            // Forward current reminder data to SW
            sendReminderDataToSW();
        } catch (err) {
            console.error('[Notifications] SW registration failed:', err);
        }
    }

    async function requestPermission() {
        const alreadyRequested = localStorage.getItem(PERMISSION_REQUESTED_KEY);
        if (alreadyRequested) return;

        if (!('Notification' in window)) return;

        const permission = await Notification.requestPermission();
        localStorage.setItem(PERMISSION_REQUESTED_KEY, 'true');

        if (permission === 'granted') {
            console.log('[Notifications] Permission granted');
        }
    }

    function loadShownNotifications() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                shownNotifications = new Set(parsed);
            }
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

    // Send reminder data to service worker for background checking
    async function sendReminderDataToSW() {
        if (!serviceWorkerReady) return;

        const data = loadAllData();
        const payload = {
            events: (data.events || []).filter(e => e.reminder),
            tasks: (data.tasks || []).filter(t => t.reminder),
            classes: (data.classes || []).filter(c => c.reminder)
        };

        // Save to IndexedDB so SW can read even if page is closed
        saveReminderDataToDB(payload);

        try {
            const reg = await navigator.serviceWorker.ready;
            reg.active?.postMessage({
                type: 'UPDATE_REMINDERS',
                payload: payload
            });
        } catch (err) {
            console.error('[Notifications] Failed to send data to SW:', err);
        }
    }

    // Save reminder data to IndexedDB for SW persistence
    async function saveReminderDataToDB(data) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('study-planner-data', 2);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('reminders')) {
                    db.createObjectStore('reminders', { keyPath: 'type' });
                }
            };
            request.onsuccess = (e) => {
                const db = e.target.result;
                const tx = db.transaction('reminders', 'readwrite');
                const store = tx.objectStore('reminders');
                store.put({ type: 'events', data: data.events || [] });
                store.put({ type: 'tasks', data: data.tasks || [] });
                store.put({ type: 'classes', data: data.classes || [] });
                resolve();
            };
            request.onerror = (e) => reject(e.target.error);
        });
    }

    // Show notification via service worker (preferred) or fallback
    async function showBrowserNotification(title, body, icon = '/favicon.png') {
        // Try service worker first (works in background)
        if (serviceWorkerReady) {
            try {
                const reg = await navigator.serviceWorker.ready;
                reg.active?.postMessage({
                    type: 'SHOW_NOTIFICATION',
                    payload: { title, body, icon }
                });
                return;
            } catch (err) {
                console.warn('[Notifications] SW show failed, falling back:', err);
            }
        }

        // Fallback to direct Notification API
        if (!('Notification' in window)) return;
        if (Notification.permission !== 'granted') return;

        const notification = new Notification(title, { body, icon });
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
        setTimeout(() => notification.close(), 10000);
    }

    // Main check: runs in page context
    function checkAll() {
        const data = loadAllData();
        const now = new Date();

        // Events
        (data.events || []).forEach(event => {
            if (!event.reminder || !event.startTime || !event.date) return;
            const eventTime = new Date(`${event.date}T${event.startTime}`);
            const minutesUntil = (eventTime - now) / 60000;

            if (minutesUntil > 0 && minutesUntil <= REMINDER_WINDOW_MINUTES) {
                const notifId = generateNotificationId('event', event.id, 'hour');
                if (!wasNotified(notifId)) {
                    showBrowserNotification(
                        'Upcoming Study Session',
                        `${event.title} starts at ${formatTime12h(event.startTime)}${event.course ? ` (${event.course})` : ''}`
                    );
                    markNotified(notifId);
                }
            }
        });

        // Tasks
        (data.tasks || []).forEach(task => {
            if (!task.reminder) return;
            const taskDate = new Date(task.date);
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const taskDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
            const daysUntil = Math.floor((taskDay - today) / (1000 * 60 * 60 * 24));

            if (daysUntil >= 0 && daysUntil <= 1) {
                const notifId = generateNotificationId('task', task.id, daysUntil);
                if (!wasNotified(notifId)) {
                    const dayLabel = daysUntil === 0 ? 'today' : 'tomorrow';
                    showBrowserNotification(
                        'Task Due Soon',
                        `${task.title} is due ${dayLabel}${task.course ? ` (${task.course})` : ''}`
                    );
                    markNotified(notifId);
                }
            }
        });

        // Classes
        (data.classes || []).forEach(cls => {
            if (!cls.reminder) return;
            const today = new Date();
            const dayOfWeek = today.getDay();
            const map = { monday:1, tuesday:2, wednesday:3, thursday:4, friday:5, saturday:6, sunday:0 };
            const classDayNum = map[cls.day?.toLowerCase()];
            if (classDayNum === undefined) return;

            const daysUntilClass = (classDayNum - dayOfWeek + 7) % 7;
            if (daysUntilClass <= 1) {
                const clsMin = parseTime(cls.startTime);
                const nowMin = today.getHours() * 60 + today.getMinutes();

                if (daysUntilClass === 0) {
                    const minutesUntil = clsMin - nowMin;
                    if (minutesUntil > 0 && minutesUntil <= REMINDER_WINDOW_MINUTES) {
                        const notifId = generateNotificationId('class', cls.id, 'today');
                        if (!wasNotified(notifId)) {
                            showBrowserNotification(
                                'Class Starting Soon',
                                `${cls.name} starts at ${formatTime12h(cls.startTime)} in ${cls.room || 'scheduled room'}`
                            );
                            markNotified(notifId);
                        }
                    }
                } else {
                    const notifId = generateNotificationId('class', cls.id, 'tomorrow');
                    if (!wasNotified(notifId)) {
                        showBrowserNotification(
                            'Class Tomorrow',
                            `${cls.name} is scheduled for tomorrow at ${formatTime12h(cls.startTime)}`
                        );
                        markNotified(notifId);
                    }
                }
            }
        });

        // Sync new shown IDs to service worker
        sendShownNotificationsToSW();
    }

    function sendShownNotificationsToSW() {
        if (!serviceWorkerReady) return;
        const reg = navigator.serviceWorker.controller;
        if (reg) {
            reg.postMessage({
                type: 'SYNC_SHOWN_NOTIFICATIONS',
                payload: { ids: [...shownNotifications] }
            });
        }
    }

    function triggerImmediateCheck() {
        checkAll();
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
         const period = h >= 12 ? 'PM' : 'AM';
         const hour12 = h % 12 || 12;
         return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
     }

    // Listen for messages from service worker about notifications it showed
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data?.type === 'NOTIFICATION_SHOWN') {
                const { id } = event.data.payload;
                if (id && !shownNotifications.has(id)) {
                    shownNotifications.add(id);
                    try {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify([...shownNotifications]));
                    } catch (e) {
                        console.error('Failed to save shown notif:', e);
                    }
                }
            }
        });
    }

    return { init, triggerImmediateCheck, startPeriodicCheck, stopPeriodicCheck };
 })();

 // Initialize on DOM ready
 document.addEventListener('DOMContentLoaded', () => Notifications.init());
