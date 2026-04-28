// Study Planner - Service Worker Registration
// Loads and registers the service worker for background notifications

(function() {
    'use strict';

    const SW_PATH = '/sw.js';
    const SW_KEY = 'studyPlanner_swRegistered';

    // Register service worker
    async function registerSW() {
        // Check if service worker is supported
        if (!('serviceWorker' in navigator)) {
            console.log('Service Worker not supported in this browser');
            return;
        }

        // Check if already registered
        if (localStorage.getItem(SW_KEY)) {
            console.log('Service Worker already registered');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.register(SW_PATH);
            console.log('Service Worker registered successfully:', registration.scope);

            localStorage.setItem(SW_KEY, 'true');

            // Notify Notifications module that SW is ready
            if (typeof Notifications !== 'undefined' && registration.active) {
                // Wait a moment for SW to activate
                setTimeout(() => {
                    if (typeof Notifications.triggerImmediateCheck === 'function') {
                        Notifications.triggerImmediateCheck();
                    }
                }, 1000);
            }
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Service Worker controller changed - page reload recommended');
            // Optionally reload page to get new SW
            // window.location.reload();
        });
    }

    // Register when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', registerSW);
    } else {
        registerSW();
    }
})();
