<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Record Borrowed Item</h2>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>
      
      <div class="info-alert">
        <AlertCircle class="icon-sm" />
        <p>Stock is insufficient. Record borrowing to proceed.</p>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>Product</label>
          <input type="text" :value="productName" disabled class="disabled-input" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Required Quantity</label>
            <input type="number" :value="deficit" disabled class="disabled-input" />
          </div>
          <div class="form-group">
            <label>Borrowing From *</label>
            <input 
              v-model="formData.borrowed_from" 
              type="text" 
              required 
              placeholder="e.g. Supplier X, Shop B"
              ref="borrowedFromInput"
            />
          </div>
        </div>

        <div class="form-group">
          <label>Reason / Notes</label>
          <textarea 
            v-model="formData.reason" 
            placeholder="e.g. Urgent customer order"
            rows="2"
          ></textarea>
        </div>

        <div class="actions">
          <button type="button" class="cancel-btn" @click="$emit('close')">
            Cancel Sale
          </button>
          <button type="submit" class="submit-btn" :disabled="!formData.borrowed_from">
            Confirm & Borrow
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { AlertCircle } from 'lucide-vue-next'

const props = defineProps({
  productName: String,
  deficit: Number
})

const emit = defineEmits(['close', 'confirm'])

const formData = ref({
  borrowed_from: '',
  reason: ''
})

const borrowedFromInput = ref(null)

function handleSubmit() {
  emit('confirm', {
    borrowed_from: formData.value.borrowed_from,
    reason: formData.value.reason
  })
}

onMounted(() => {
  if (borrowedFromInput.value) {
    borrowedFromInput.value.focus()
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--bg-white);
  border-radius: var(--radius-xl);
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h2 { margin: 0; color: var(--text-primary); }

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
}

.info-alert {
  background: var(--warning-bg); /* Use locally if var not defined or generic warning color */
  background-color: #fff7ed;
  color: #c2410c;
  padding: 0.75rem;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #fed7aa;
}

.form-group { margin-bottom: 1rem; }
.form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: var(--text-primary); }

.form-group input, 
.form-group textarea {
  width: 100%;
  padding: 0.6rem;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 1rem;
  background-color: var(--bg-white);
}

.disabled-input {
  background-color: var(--bg-hover);
  color: var(--text-secondary);
  cursor: not-allowed;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.cancel-btn {
  flex: 1;
  padding: 0.75rem;
  background: var(--bg-hover);
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-weight: 500;
  cursor: pointer;
}

.submit-btn {
  flex: 1;
  padding: 0.75rem;
  background: var(--primary-gradient);
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-white);
  font-weight: 500;
  cursor: pointer;
}

.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.icon-sm { width: 20px; height: 20px; }
</style>
