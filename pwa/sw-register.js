// Study Planner - Service Worker Registration
// Loads and registers the service worker for background notifications

(function() {
    'use strict';

    const SW_KEY = 'studyPlanner_swRegistered';

    // Dynamically detect base path for GitHub Pages subfolder deployment
    function getBasePath() {
        const path = location.pathname;
        // Extract the base path (e.g., /Study-Planner/ from /Study-Planner/planner.html)
        const match = path.match(/^(\/[^/]+\/)/);
        let base = match ? match[1] : '/';
        // If app is served from a "public" subfolder, strip it (public/ is just an entry point)
        if (base === '/public/') base = '/';
        return base;
    }

    async function registerSW() {
        if (!('serviceWorker' in navigator)) {
            console.log('Service Worker not supported');
            return;
        }

        if (localStorage.getItem(SW_KEY)) {
            console.log('SW already registered');
            return;
        }

         const basePath = getBasePath();
         const swPath = basePath + 'pwa/sw.js';
        
        console.log('Attempting to register Service Worker at:', swPath);

        try {
            const registration = await navigator.serviceWorker.register(swPath);
            console.log('Service Worker registered at:', swPath, 'scope:', registration.scope);
            localStorage.setItem(SW_KEY, 'true');
            
            if (typeof Notifications !== 'undefined') {
                setTimeout(() => Notifications.triggerImmediateCheck?.(), 1000);
            }
        } catch (err) {
            console.error('Service Worker registration failed:', err.message);
            // Try root path as fallback
            if (basePath !== '/') {
                 try {
                     const fallbackReg = await navigator.serviceWorker.register('/pwa/sw.js');
                     console.log('Service Worker registered at root /pwa/sw.js');
                    localStorage.setItem(SW_KEY, 'true');
                } catch (fallbackErr) {
                    console.error('Fallback registration also failed:', fallbackErr.message);
                }
            }
        }
    }

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('SW controller changed');
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', registerSW);
    } else {
        registerSW();
    }
})();
