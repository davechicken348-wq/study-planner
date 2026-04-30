// Study Planner - Service Worker
// Background notifications with persistent reminder storage

// Detect base path for GitHub Pages deployment
const BASE_PATH = location.pathname.replace(/\/[^/]*$/, '') || '/';
const CACHE_NAME = 'study-planner-v1';
const CHECK_INTERVAL = 60 * 1000;
const DB_NAME = 'study-planner-notifications';
const STORE_REMINDERS = 'reminders';
const STORE_SHOWN = 'shownIds';

let checkTimer = null;
let shownNotifications = new Set();
let dbPromise = null;

// Get or create DB connection (singleton)
function getDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 3);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_REMINDERS)) {
                db.createObjectStore(STORE_REMINDERS, { keyPath: 'type' });
            }
            if (!db.objectStoreNames.contains(STORE_SHOWN)) {
                db.createObjectStore(STORE_SHOWN, { keyPath: 'id' });
            }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
    });
    return dbPromise;
}
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            // Use dynamic base path for GitHub Pages subfolder deployment
             const resources = [
                 BASE_PATH + '/', 
                 BASE_PATH + '/public/index.html', 
                 BASE_PATH + '/public/planner.html', 
                 BASE_PATH + '/public/timetable.html', 
                 BASE_PATH + '/public/calendar.html',
                 BASE_PATH + '/favicon/favicon.svg', 
                 BASE_PATH + '/favicon/favicon-32x32.png', 
                 BASE_PATH + '/favicon/favicon-16x16.png', 
                 BASE_PATH + '/pwa/manifest.json',
                 BASE_PATH + '/css/core/style.css', 
                 BASE_PATH + '/css/core/responsive.css',
                 BASE_PATH + '/css/pages/planner.css', 
                 BASE_PATH + '/css/pages/timetable.css', 
                 BASE_PATH + '/css/pages/calendar.css',
                 BASE_PATH + '/js/core/app.js', 
                 BASE_PATH + '/js/core/storage.js', 
                 BASE_PATH + '/js/core/utils.js', 
                 BASE_PATH + '/js/core/nav-active.js', 
                 BASE_PATH + '/js/features/pomodoro.js', 
                 BASE_PATH + '/js/features/planner.js', 
                 BASE_PATH + '/js/features/timetable.js', 
                 BASE_PATH + '/js/features/calendar.js', 
                 BASE_PATH + '/js/features/notifications.js', 
                 BASE_PATH + '/js/features/slideshow.js'
             ];
            return cache.addAll(resources);
        }).catch(err => {
            console.error('[SW] Install cache addAll failed:', err);
            // Still skip waiting even if some resources fail
            self.skipWaiting();
        })
    );
    self.skipWaiting();
});

// Activate
self.addEventListener('activate', (e) => {
    e.waitUntil(
        (async () => {
            // Delete old caches
            const cacheKeys = await caches.keys();
            await Promise.all(
                cacheKeys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
            // Load shown notifications
            await loadShownFromDB();
            // Start periodic checking
            startPeriodicCheck();
            self.clients.claim();
        })()
    );
});

// When a client connects, request permission and do initial check
self.addEventListener('message', (e) => {
    if (e.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Listen for client connections
self.addEventListener('install', (e) => {
    self.skipWaiting();
});

// Fetch
self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;
    const url = new URL(e.request.url);
    if (url.origin !== self.location.origin) return;

    e.respondWith(
        caches.match(e.request).then(cached => {
            if (cached) return cached;
            return fetch(e.request).then(resp => {
                if (resp.status === 200) {
                    const copy = resp.clone();
                    caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
                }
                return resp;
            });
        }).catch(() => caches.match(BASE_PATH + '/index.html'))
    );
});

// Messages: also update persisted reminder data
self.addEventListener('message', (e) => {
    const { type, payload } = e.data || {};
    switch (type) {
        case 'UPDATE_REMINDERS':
            // Save data then immediately check
            saveReminderDataToDB(payload || { events: [], tasks: [], classes: [] }).then(() => {
                checkAndNotify();
            }).catch(err => {
                console.error('[SW] Failed to save reminders:', err);
            });
            break;
        case 'SHOW_NOTIFICATION':
            showNotification(payload?.title, payload?.body, payload?.icon);
            break;
        case 'SYNC_SHOWN_NOTIFICATIONS':
            if (payload?.ids) {
                shownNotifications = new Set(payload.ids);
                persistShownNotifications(payload.ids);
            }
            break;
        // TRIGGER_CHECK removed — SW auto-checks after UPDATE_REMINDERS
    }
});

// Periodic check
function startPeriodicCheck() {
    if (checkTimer) clearInterval(checkTimer);
    checkTimer = setInterval(checkAndNotify, CHECK_INTERVAL);
}

// Main check — reads reminderData from IndexedDB each time
async function checkAndNotify() {
    const data = await loadReminderDataFromDB();
    const now = new Date();

    // Events
    (data.events || []).forEach(ev => {
        if (!ev.startTime || !ev.date) return;
        const evTime = new Date(`${ev.date}T${ev.startTime}`);
        const diffMin = (evTime - now) / 60000;
        if (diffMin > 0 && diffMin <= 60) {
            const id = `evt_${ev.id}_hour`;
            if (!shownNotifications.has(id)) {
                showNotification('Upcoming Study Session', `${ev.title} at ${formatTime12h(ev.startTime)}${ev.course ? ` (${ev.course})` : ''}`);
                shownNotifications.add(id);
                persistAndBroadcast(id);
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
            const id = `task_${task.id}_${daysUntil}`;
            if (!shownNotifications.has(id)) {
                showNotification('Task Due Soon', `${task.title} is due ${daysUntil===0 ? 'today' : 'tomorrow'}${task.course ? ` (${task.course})` : ''}`);
                shownNotifications.add(id);
                persistAndBroadcast(id);
            }
        }
    });

    // Classes
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
                if (diff > 0 && diff <= 60) {
                    const id = `cls_${cls.id}_today`;
                    if (!shownNotifications.has(id)) {
                        showNotification('Class Starting Soon', `${cls.name} at ${formatTime12h(cls.startTime)}${cls.room ? ' in '+cls.room : ''}`);
                        shownNotifications.add(id);
                        persistAndBroadcast(id);
                    }
                }
            } else {
                const id = `cls_${cls.id}_tomorrow`;
                if (!shownNotifications.has(id)) {
                    showNotification('Class Tomorrow', `${cls.name} at ${formatTime12h(cls.startTime)}`);
                    shownNotifications.add(id);
                    persistAndBroadcast(id);
                }
            }
        }
    });
}

function persistAndBroadcast(id) {
    persistShownNotification(id);
    broadcastShownChange(id);
}

function broadcastShownChange(id) {
    self.clients.matchAll().then(clients => {
        clients.forEach(c => c.postMessage({ type: 'NOTIFICATION_SHOWN', payload: { id } }));
    });
}

 function showNotification(title, body, icon = '/favicon/favicon.png') {
    const permission = Notification.permission;
    
    if (permission === 'denied') {
        console.warn('[SW] Notifications blocked. Enable via browser settings.');
        return;
    }
    
    if (permission === 'default') {
        console.log('[SW] Permission not requested yet — page will handle it');
        return;
    }
    
    // permission === 'granted'
    doShow(title, body, icon);
}

function doShow(title, body, icon) {
     self.registration.showNotification(title, {
         body, icon, badge: '/favicon/favicon-32x32.png',
         tag: 'study-planner', renotify: false, vibrate: [200,100,200]
    }).then(() => {
        console.log('[SW] Notification shown:', title);
    }).catch(err => {
        console.log('[SW] Notification show failed:', err.message);
    });
}

self.addEventListener('notificationclick', (e) => {
    e.notification.close();
    e.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
            for (const c of clients) {
                if (c.url?.includes('study-planner')) { c.focus(); return; }
            }
            if (clients[0]) clients[0].focus();
            else self.clients.openWindow('/');
        })
    );
});

async function saveReminderDataToDB(data) {
    try {
        const db = await getDB();
        const tx = db.transaction(STORE_REMINDERS, 'readwrite');
        const store = tx.objectStore(STORE_REMINDERS);
        store.put({ type: 'events', data: data.events || [] });
        store.put({ type: 'tasks', data: data.tasks || [] });
        store.put({ type: 'classes', data: data.classes || [] });
    } catch (err) { console.error('[SW] Failed to save reminders:', err); }
}

async function loadReminderDataFromDB() {
    try {
        const db = await getDB();
        const tx = db.transaction(STORE_REMINDERS, 'readonly');
        const store = tx.objectStore(STORE_REMINDERS);
        const req = store.getAll();
        const result = await new Promise(resolve => {
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve([]);
        });
        const events = result.find(r => r.type === 'events')?.data || [];
        const tasks = result.find(r => r.type === 'tasks')?.data || [];
        const classes = result.find(r => r.type === 'classes')?.data || [];
        return { events, tasks, classes };
    } catch (err) {
        return { events: [], tasks: [], classes: [] };
    }
}

async function loadShownFromDB() {
    try {
        const db = await getDB();
        shownNotifications = await new Promise((resolve) => {
            const tx = db.transaction(STORE_SHOWN, 'readonly');
            const store = tx.objectStore(STORE_SHOWN);
            const req = store.getAll();
            req.onsuccess = () => resolve(new Set(req.result.map(r => r.id)));
            req.onerror = () => resolve(new Set());
        });
    } catch (err) {
        shownNotifications = new Set();
    }
}

async function persistShownNotification(id) {
    try {
        const db = await getDB();
        const tx = db.transaction(STORE_SHOWN, 'readwrite');
        const store = tx.objectStore(STORE_SHOWN);
        store.put({ id, time: Date.now() });
    } catch (err) {}
}

async function persistShownNotifications(ids) {
    try {
        const db = await getDB();
        const tx = db.transaction(STORE_SHOWN, 'readwrite');
        const store = tx.objectStore(STORE_SHOWN);
        ids.forEach(id => store.put({ id, time: Date.now() }));
    } catch (err) {}
}

// Helpers
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

console.log('[SW] Study Planner service worker loaded');
