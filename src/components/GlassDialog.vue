<template>
  <Transition name="fade">
    <div v-if="isOpen" class="glass-dialog-overlay" @click="handleBackdropClick">
      <div class="glass-dialog" @click.stop>
        <div class="dialog-header">
          <component :is="iconComponent" class="dialog-icon" :class="type" />
          <h3>{{ title }}</h3>
        </div>
        
        <div class="dialog-content">
          <p>{{ message }}</p>
        </div>

        <div class="dialog-actions">
          <button 
            v-if="type === 'confirm'" 
            class="btn-cancel" 
            @click="handleCancel"
          >
            Cancel
          </button>
          <button 
            class="btn-confirm" 
            :class="type"
            @click="handleConfirm"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import { useDialogStore } from '../stores/dialogStore'
import { AlertCircle, CheckCircle, Info, HelpCircle } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'

const store = useDialogStore()
const { isOpen, type, title, message, confirmText } = storeToRefs(store)

const iconComponent = computed(() => {
  switch (type.value) {
    case 'error': return AlertCircle
    case 'success': return CheckCircle
    case 'confirm': return HelpCircle
    default: return Info
  }
})

function handleConfirm() {
  store.handleConfirm()
}

function handleCancel() {
  store.cancel()
}

function handleBackdropClick() {
  if (type.value !== 'confirm') {
    store.cancel()
  }
}
</script>

<style scoped>
.glass-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.glass-dialog {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px;
  padding: 2rem;
  width: 90%;
  max-width: 400px;
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.1), 
    0 2px 4px -1px rgba(0, 0, 0, 0.06),
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    inset 0 0 20px rgba(255, 255, 255, 0.5);
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.dialog-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.dialog-icon {
  width: 48px;
  height: 48px;
  padding: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.dialog-icon.error { color: var(--danger-bg); background: rgba(239, 68, 68, 0.1); }
.dialog-icon.success { color: var(--success-text); background: rgba(16, 185, 129, 0.1); }
.dialog-icon.confirm { color: var(--primary-color); background: rgba(99, 102, 241, 0.1); }
.dialog-icon.info { color: var(--text-primary); background: rgba(107, 114, 128, 0.1); }

.dialog-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-primary);
  text-align: center;
}

.dialog-content {
  text-align: center;
  color: var(--text-secondary);
  margin-bottom: 2rem;
  line-height: 1.5;
}

.dialog-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

button {
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 1rem;
}

.btn-confirm {
  background: var(--primary-color);
  color: white;
  flex: 1;
  box-shadow: 0 4px 6px rgba(99, 102, 241, 0.2);
}

.btn-confirm.error { background: var(--danger-bg); box-shadow: 0 4px 6px rgba(239, 68, 68, 0.2); }
.btn-confirm.success { background: var(--success-text); box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2); }

.btn-confirm:hover {
  transform: translateY(-2px);
  filter: brightness(1.1);
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.5);
  color: var(--text-secondary);
  flex: 1;
  border: 1px solid rgba(0,0,0,0.05);
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.8);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
