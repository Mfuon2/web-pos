<template>
  <div class="setup-overlay" v-if="show">
    <div class="setup-wizard">
      <div class="wizard-header">
        <h1>🎉 Welcome to Your POS System!</h1>
        <p>Let's set up your business in just a few steps</p>
      </div>

      <form @submit.prevent="handleSetup" class="setup-form">
        <div class="form-group">
          <label>Business Name *</label>
          <input 
            v-model="formData.business_name" 
            type="text" 
            placeholder="My Awesome Business"
            required
            autofocus
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Primary Color</label>
            <div class="color-input-wrapper">
              <input 
                v-model="formData.primary_color" 
                type="color"
                class="color-picker"
              />
              <input 
                v-model="formData.primary_color" 
                type="text"
                class="color-text"
                placeholder="#667eea"
              />
            </div>
          </div>

          <div class="form-group">
            <label>Secondary Color</label>
            <div class="color-input-wrapper">
              <input 
                v-model="formData.secondary_color" 
                type="color"
                class="color-picker"
              />
              <input 
                v-model="formData.secondary_color" 
                type="text"
                class="color-text"
                placeholder="#764ba2"
              />
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Currency Symbol</label>
            <input 
              v-model="formData.currency_symbol" 
              type="text" 
              placeholder="$"
              maxlength="3"
            />
          </div>

          <div class="form-group">
            <label>Currency Code</label>
            <input 
              v-model="formData.currency_code" 
              type="text" 
              placeholder="USD"
              maxlength="3"
            />
          </div>
        </div>

        <div class="form-group">
          <label>Business Email</label>
          <input 
            v-model="formData.email" 
            type="email" 
            placeholder="contact@business.com"
          />
        </div>

        <div class="form-actions">
          <button type="submit" class="setup-btn" :disabled="loading">
            {{ loading ? 'Setting up...' : 'Complete Setup' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSettingsStore } from '../stores/settingsStore'
import { useDialogStore } from '../stores/dialogStore'

const props = defineProps({
  show: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['complete'])

const settingsStore = useSettingsStore()
const dialogStore = useDialogStore()

const loading = ref(false)

const formData = ref({
  business_name: '',
  primary_color: '#667eea',
  secondary_color: '#764ba2',
  currency_symbol: '$',
  currency_code: 'USD',
  tax_rate: 0,
  email: ''
})

async function handleSetup() {
  if (!formData.value.business_name) {
    dialogStore.error('Please enter a business name')
    return
  }

  loading.value = true
  try {
    await settingsStore.updateSettings(formData.value)
    dialogStore.success('Setup completed successfully!')
    emit('complete')
  } catch (err) {
    dialogStore.error('Setup failed: ' + err.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.setup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.setup-wizard {
  background: var(--bg-white);
  border-radius: var(--radius-xl);
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.wizard-header {
  text-align: center;
  margin-bottom: 2rem;
}

.wizard-header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 1.75rem;
  color: var(--text-primary);
  font-weight: 500;
}

.wizard-header p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 1rem;
}

.setup-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.form-group input[type="text"],
.form-group input[type="email"] {
  padding: 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.color-input-wrapper {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.color-picker {
  width: 50px;
  height: 42px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.color-text {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-family: monospace;
}

.form-actions {
  margin-top: 1rem;
}

.setup-btn {
  width: 100%;
  padding: 1rem;
  background: var(--primary-gradient);
  color: var(--text-white);
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.setup-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.setup-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .setup-wizard {
    padding: 1.5rem;
  }

  .wizard-header h1 {
    font-size: 1.5rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
