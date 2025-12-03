<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo">
          <ShoppingBag class="logo-icon" />
        </div>
        <h1>{Business Name}</h1>
        <p>Sign in to your account</p>
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
              type="password" 
              placeholder="Enter password" 
              required 
            />
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
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { ShoppingBag, User, Lock } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

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
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-color);
  padding: 1rem;
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
  width: 64px;
  height: 64px;
  background: var(--primary-gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.logo-icon {
  width: 32px;
  height: 32px;
  color: var(--text-white);
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
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  transition: all 0.2s;
}

.input-wrapper input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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

/* Mobile Responsive */
@media (max-width: 768px) {
  .login-card {
    padding: var(--spacing-lg);
  }
  
  .login-header h1 {
    font-size: var(--font-size-xl);
  }
  
  .logo {
    width: 56px;
    height: 56px;
  }
  
  .logo-icon {
    width: 28px;
    height: 28px;
  }
}
</style>
