import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePwaStore = defineStore('pwa', () => {
    const deferredPrompt = ref(null)
    const canInstall = ref(false)
    const isInstalled = ref(false)

    /**
     * Initialize the PWA event listeners
     */
    function init() {
        // Check for early captured prompt
        if (window.deferredPWAInstallPrompt) {
            deferredPrompt.value = window.deferredPWAInstallPrompt
            canInstall.value = true
            console.log('[PWA Store] Using early captured prompt')
        }

        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault()
            // Stash the event so it can be triggered later.
            deferredPrompt.value = e
            // Update UI notify the user they can install the PWA
            canInstall.value = true
            console.log('[PWA Store] beforeinstallprompt event fired')
        })

        window.addEventListener('appinstalled', (event) => {
            // Clear the deferredPrompt so it can be garbage collected
            deferredPrompt.value = null
            canInstall.value = false
            isInstalled.value = true
            console.log('[PWA] App was installed')
        })

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
            isInstalled.value = true
        }
    }

    /**
     * Trigger the installation prompt
     */
    async function installApp() {
        if (!deferredPrompt.value) {
            console.warn('[PWA] No installation prompt available')
            return false
        }

        // Show the install prompt
        deferredPrompt.value.prompt()

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.value.userChoice
        console.log(`[PWA] User response to the install prompt: ${outcome}`)

        // We've used the prompt, and can't use it again, throw it away
        deferredPrompt.value = null
        canInstall.value = false
        
        return outcome === 'accepted'
    }

    return {
        deferredPrompt,
        canInstall,
        isInstalled,
        init,
        installApp
    }
})
