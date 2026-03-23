<template>
  <div class="login-container">
    <div class="login-card">
      <header class="login-header">
        <div class="logo">
          <img 
            src="/icons/icon-512x512.png" 
            alt="RetailMaster POS - Modern Retail Management System" 
            title="RetailMaster POS"
            class="logo-img" 
          />
        </div>
        <h1>RetailMaster POS</h1>
        <p>Advanced Retail Management & Inventory System</p>
      </header>

      <!-- PWA Install Prompt -->
      <div v-if="pwaStore.canInstall && !pwaStore.isInstalled" class="pwa-install-banner">
        <div class="pwa-info">
          <Download class="pwa-icon" />
          <div class="pwa-text">
            <strong>Install POS App</strong>
            <span>Access offline and faster</span>
          </div>
        </div>
        <button @click="handleInstall" class="install-btn">
          Install
        </button>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label>Username</label>
          <div class="input-wrapper">
            <User class="input-icon" />
            <input 
              v-model="username" 
              type="text" 
              placeholder="Enter username" 
              required 
              autofocus
            />
          </div>
        </div>

        <div class="form-group">
          <label>Password</label>
          <div class="input-wrapper">
            <Lock class="input-icon" />
            <input 
              v-model="password" 
              :type="showPassword ? 'text' : 'password'" 
              placeholder="Enter password" 
              required 
            />
            <button 
              type="button" 
              class="toggle-password" 
              @click="showPassword = !showPassword"
              tabindex="-1"
            >
              <Eye v-if="!showPassword" class="eye-icon" />
              <EyeOff v-else class="eye-icon" />
            </button>
          </div>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" class="login-btn" :disabled="loading">
          <span v-if="loading">Signing in...</span>
          <span v-else>Sign In</span>
        </button>
      </form>
    </div>

    <footer class="login-footer">
      <p>Version {{ appVersion }}</p>
      <p>Developed by qesuite tech solutions</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useSettingsStore } from '../stores/settingsStore'
import { usePwaStore } from '../stores/pwaStore'
import { ShoppingBag, User, Lock, Eye, EyeOff, Download } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const pwaStore = usePwaStore()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const showPassword = ref(false)
const appVersion = import.meta.env.VITE_APP_VERSION || '0.0.19'

const businessName = computed(() => settingsStore.businessName)

onMounted(() => {
  // If we can install, and we are not yet installed, try to show the prompt
  // Note: Modern browsers will likely block this without a gesture,
  // but we try it anyway as some might allow it under certain conditions
  // Or the early capture might have satisfy the gesture if matched with a click
  if (pwaStore.canInstall && !pwaStore.isInstalled) {
    console.log('[Login] Attempting to trigger PWA install prompt on mount')
    // We don't call it immediately to allow the page to settle
    setTimeout(async () => {
      try {
        console.log('[Login] Triggering PWA install prompt')
        await pwaStore.installApp()
      } catch (e) {
        console.warn('[Login] PWA install auto-prompt blocked or failed:', e)
      }
    }, 1500)
  }
})

async function handleLogin() {
  loading.value = true
  error.value = ''
  
  try {
    await authStore.login(username.value, password.value)
    router.push('/')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function handleInstall() {
  await pwaStore.installApp()
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg-color);
  padding: 1rem;
  gap: 2rem;
  overflow-y: auto; /* Allow scrolling if keyboard/footer pushes content */
}

.login-card {
  background: var(--bg-white);
  width: 100%;
  max-width: 400px;
  padding: var(--spacing-xl);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  width: 150px;
  height: 150px;
  background: var(--bg-white);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25rem;
  padding: 0.5rem;
  box-shadow: var(--shadow-sm);
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.login-header h1 {
  font-size: var(--font-size-2xl);
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.login-header p {
  color: var(--text-secondary);
}

/* PWA Install Banner */
.pwa-install-banner {
  background: var(--primary-light);
  border: 1px solid var(--primary-color);
  border-radius: var(--radius-md);
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  animation: slideIn 0.3s ease-out;
}

.pwa-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.pwa-icon {
  width: 24px;
  height: 24px;
  color: var(--primary-color);
}

.pwa-text {
  display: flex;
  flex-direction: column;
}

.pwa-text strong {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.pwa-text span {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.install-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.install-btn:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.input-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: var(--text-secondary);
}

.input-wrapper input {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg) var(--spacing-md) 2.5rem;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  transition: all 0.2s;
}

.input-wrapper input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.toggle-password {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: color 0.2s;
}

.toggle-password:hover {
  color: var(--primary-color);
}

.eye-icon {
  width: 18px;
  height: 18px;
}

.error-message {
  background: var(--danger-light);
  color: var(--danger-bg);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  text-align: center;
}

.login-btn {
  background: var(--primary-gradient);
  color: var(--text-white);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: var(--font-size-base);
  transition: all 0.3s;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .login-container {
    padding: 0.25rem;
    align-items: center;
  }

  .login-card {
    padding: 1rem;
    max-width: 320px;
    border-radius: var(--radius-lg);
  }
  
  .login-header {
    margin-bottom: 0.75rem;
  }

  .login-header h1 {
    font-size: 1.1rem;
    margin-bottom: 0.15rem;
  }

  .login-header p {
    font-size: 0.8rem;
  }
  
  .logo {
    width: 150px;
    height: 150px;
    margin-bottom: 0.75rem;
  }
  
  .logo-img {
    width: 100%;
    height: 100%;
  }

  .pwa-install-banner {
    padding: 0.5rem;
    margin-bottom: 0.75rem;
    gap: 0.4rem;
  }

  .pwa-icon {
    width: 16px;
    height: 16px;
  }

  .pwa-text strong {
    font-size: 0.7rem;
  }

  .pwa-text span {
    display: none; /* Hide subtitle on mobile to save space */
  }

  .login-form {
    gap: 0.75rem;
  }

  .form-group label {
    font-size: 0.7rem;
    margin-bottom: 2px;
  }

  .input-wrapper input {
    padding: 0.5rem 0.6rem 0.5rem 2rem;
    font-size: 16px; /* 16px to prevent zoom on iOS */
  }

  .input-icon {
    left: 0.6rem;
    width: 14px;
    height: 14px;
  }

  .login-btn {
    padding: 0.6rem;
    font-size: 0.9rem;
    margin-top: 0.25rem;
  }
}

/* Very Small Devices */
@media (max-height: 700px) and (max-width: 768px) {
  .logo {
    width: 150px;
    height: 150px;
    margin-bottom: 0.5rem;
  }
  .login-header h1 {
    font-size: 1rem;
  }
  .login-card {
    padding: 0.85rem;
  }
}

.login-footer {
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.75rem;
  opacity: 0.8;
  padding-bottom: 1rem;
}

.login-footer p {
  margin: 0.25rem 0;
}
</style>
