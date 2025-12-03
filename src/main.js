import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './base.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')

// TEMPORARILY DISABLED: Service worker for PWA
// Unregister any existing service workers and clear caches
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            // Unregister all service workers
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
                await registration.unregister();
                console.log('ServiceWorker unregistered:', registration.scope);
            }

            // Clear all caches
            if (window.caches) {
                const keys = await window.caches.keys();
                for (const key of keys) {
                    await window.caches.delete(key);
                    console.log('Cache deleted:', key);
                }
            }

            console.log('All service workers unregistered and caches cleared.');
        } catch (error) {
            console.error('Error unregistering service workers:', error);
        }
    });
}

// Original service worker registration (commented out)
// if ('serviceWorker' in navigator) {
//     window.addEventListener('load', () => {
//         navigator.serviceWorker.register('/service-worker.js')
//             .then((registration) => {
//                 console.log('ServiceWorker registration successful:', registration.scope);
//             })
//             .catch((error) => {
//                 console.log('ServiceWorker registration failed:', error);
//             });
//     });
// }
