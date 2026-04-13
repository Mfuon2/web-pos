<template>
  <div id="app">
    <Navbar />
    <router-view />
    <GlassDialog />
    <UpdateDialog />
    
    <!-- First-Time Setup Wizard -->
    <SetupWizard 
      v-if="showSetupWizard" 
      :show="showSetupWizard"
      @complete="showSetupWizard = false"
    />
    
    <!-- PWA Install Prompt -->
    <div v-if="showInstallPrompt" class="install-prompt">
      <div class="install-content">
        <span class="install-icon">📱</span>
        <div class="install-text">
          <h3>Install App</h3>
          <p>Add to home screen for offline access</p>
        </div>
        <div class="install-actions">
          <button @click="dismissInstall" class="dismiss-btn">Not now</button>
          <button @click="installPWA" class="install-btn">Install</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import Navbar from './components/Navbar.vue'
import GlassDialog from './components/GlassDialog.vue'
import SetupWizard from './components/SetupWizard.vue'
import UpdateDialog from './components/UpdateDialog.vue'
import { useSettingsStore } from './stores/settingsStore'
import { useAuthStore } from './stores/authStore'
import { useRouter } from 'vue-router'

const settingsStore = useSettingsStore()
const authStore = useAuthStore()
const router = useRouter()

const deferredPrompt = ref(null)
const showInstallPrompt = ref(false)
const showSetupWizard = ref(false)

let activityCheckInterval = null

// Throttle activity refresh to avoid excessive localStorage writes
let lastActivityRefresh = 0
const ACTIVITY_THROTTLE_MS = 60000 // Only refresh once per minute max

function handleUserActivity() {
  if (!authStore.isAuthenticated) return
  
  const now = Date.now()
  if (now - lastActivityRefresh > ACTIVITY_THROTTLE_MS) {
    authStore.refreshActivity()
    lastActivityRefresh = now
  }
}

function checkSession() {
  if (authStore.isAuthenticated && !authStore.checkSessionTimeout()) {
    // Session expired due to inactivity
    router.push('/login')
  }
}

onMounted(async () => {
  // Initialize settings from cache (branding persistence)
  settingsStore.initSettings()

  // Load settings on app mount if user is logged in
  if (authStore.isAuthenticated) {
    await settingsStore.fetchSettings()
    
    // Show setup wizard if no settings
    if (!settingsStore.hasSettings) {
      showSetupWizard.value = true
    }
  }
  
  // Track user activity to keep session alive
  // These events indicate the user is actively using the app
  const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove']
  activityEvents.forEach(event => {
    document.addEventListener(event, handleUserActivity, { passive: true })
  })
  
  // Check session validity periodically (every 5 minutes)
  activityCheckInterval = setInterval(checkSession, 5 * 60 * 1000)
  
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault()
    // Stash the event so it can be triggered later.
    deferredPrompt.value = e
    // Update UI to notify the user they can add to home screen
    showInstallPrompt.value = true
  })
})

onUnmounted(() => {
  // Clean up event listeners
  const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove']
  activityEvents.forEach(event => {
    document.removeEventListener(event, handleUserActivity)
  })
  
  if (activityCheckInterval) {
    clearInterval(activityCheckInterval)
  }
})

// Watch for authentication changes
watch(() => authStore.isAuthenticated, async (isAuthenticated) => {
  if (isAuthenticated) {
    await settingsStore.fetchSettings()
    
    if (!settingsStore.hasSettings) {
      showSetupWizard.value = true
    }
  }
})

async function installPWA() {
  if (!deferredPrompt.value) return
  
  // Show the install prompt
  deferredPrompt.value.prompt()
  
  // Wait for the user to respond to the prompt
  const { outcome } = await deferredPrompt.value.userChoice
  console.log(`User response to the install prompt: ${outcome}`)
  
  // We've used the prompt, and can't use it again, throw it away
  deferredPrompt.value = null
  showInstallPrompt.value = false
}

function dismissInstall() {
  showInstallPrompt.value = false
  deferredPrompt.value = null
}
</script>

<style>
#app {
  font-family: var(--font-family);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
  background: var(--bg-color);
}

.install-prompt {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-white);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  width: 90%;
  max-width: 400px;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { transform: translate(-50%, 100%); opacity: 0; }
  to { transform: translate(-50%, 0); opacity: 1; }
}

.install-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.install-icon {
  font-size: 2rem;
}

.install-text {
  flex: 1;
}

.install-text h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  color: var(--text-primary);
}

.install-text p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.install-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.install-btn {
  background: var(--primary-gradient);
  color: var(--text-white);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.dismiss-btn {
  background: transparent;
  color: var(--text-secondary);
  border: none;
  padding: 0.5rem;
  cursor: pointer;
}
</style>
