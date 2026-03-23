import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { usePwaStore } from './stores/pwaStore' // Import the PWA store
import './base.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize PWA Store
const pwaStore = usePwaStore()
pwaStore.init()

app.mount('#app')

// Re-enable Service worker for PWA with cleanup of legacy workers
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            // Targeted Cleanup: Unregister only legacy/conflicting service workers
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
                const scriptURL = registration.active?.scriptURL || registration.installing?.scriptURL || registration.waiting?.scriptURL;
                if (scriptURL && !scriptURL.endsWith('/service-worker.js')) {
                    console.log('[Cleanup] Unregistering rogue ServiceWorker:', scriptURL);
                    await registration.unregister();
                }
            }

            // Register our current service worker
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('ServiceWorker registration successful:', registration.scope);
        } catch (error) {
            console.error('ServiceWorker setup failed:', error);
        }
    });
}

