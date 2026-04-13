<template>
  <Teleport to="body">
    <div v-if="showDialog" class="update-overlay">
      <div class="update-dialog">
        <div class="update-icon">
          <RefreshCw class="icon-lg spinning" />
        </div>
        <h2>Update Available</h2>
        <p>A new version <strong>{{ version }}</strong> is available.</p>
        <p class="update-note">Click below to refresh and get the latest features.</p>
        <button @click="applyUpdate" class="update-btn">
          <RefreshCw class="icon-sm" />
          Update Now
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { RefreshCw } from 'lucide-vue-next'

const showDialog = ref(false)
const version = ref('')
let waitingWorker = null

function handleMessage(event) {
  if (event.data?.type === 'SW_UPDATED') {
    version.value = event.data.version || 'new'
    showDialog.value = true
  }
}

function handleControllerChange() {
  // When the service worker controlling the page changes, reload
  window.location.reload()
}

function applyUpdate() {
  if (waitingWorker) {
    // Tell the waiting service worker to skip waiting
    waitingWorker.postMessage({ type: 'SKIP_WAITING' })
  }
  // Reload the page to get the new version
  window.location.reload()
}

onMounted(() => {
  // Listen for messages from service worker
  navigator.serviceWorker?.addEventListener('message', handleMessage)
  
  // Listen for controller changes
  navigator.serviceWorker?.addEventListener('controllerchange', handleControllerChange)
  
  // Check for waiting service worker on mount
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.ready.then(registration => {
      if (registration.waiting) {
        waitingWorker = registration.waiting
        version.value = 'new'
        showDialog.value = true
      }
      
      // Listen for new service workers
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              waitingWorker = newWorker
              version.value = 'new'
              showDialog.value = true
            }
          })
        }
      })
    })
  }
})

onUnmounted(() => {
  navigator.serviceWorker?.removeEventListener('message', handleMessage)
  navigator.serviceWorker?.removeEventListener('controllerchange', handleControllerChange)
})
</script>

<style scoped>
.update-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.update-dialog {
  background: var(--bg-white, white);
  border-radius: 16px;
  padding: 2rem;
  max-width: 360px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.update-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.icon-lg {
  width: 32px;
  height: 32px;
  color: white;
}

.icon-sm {
  width: 18px;
  height: 18px;
}

.spinning {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.update-dialog h2 {
  margin: 0 0 0.5rem;
  color: #1a1a2e;
  font-size: 1.5rem;
}

.update-dialog p {
  margin: 0 0 0.5rem;
  color: #666;
  font-size: 1rem;
}

.update-dialog p strong {
  color: #667eea;
}

.update-note {
  font-size: 0.875rem;
  opacity: 0.8;
  margin-bottom: 1.5rem !important;
}

.update-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.update-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.update-btn:active {
  transform: translateY(0);
}
</style>
