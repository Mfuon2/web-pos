<template>
  <div class="modal-overlay" @click.stop="handleClose">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>
          <Edit class="header-icon" />
          Edit Sale Item
        </h2>
        <button class="close-btn" @click="handleClose" :disabled="isSaving">
          <X class="icon" />
        </button>
      </div>

      <div class="modal-body">
        <div class="product-info-card">
          <h3 class="product-name">{{ productName }}</h3>
          <div class="product-meta">
            <span class="meta-label">Current Total:</span>
            <span class="meta-value">{{ formatCurrency(item.price * item.quantity) }}</span>
          </div>
        </div>

        <div class="form-group">
          <label>Price</label>
          <div class="input-wrapper">
            <input 
              type="number" 
              v-model.number="editForm.price" 
              min="0" 
              step="0.01"
              :disabled="isSaving"
              class="form-input"
            />
          </div>
        </div>

        <div class="form-group">
          <label>Quantity</label>
          <div class="input-wrapper">
            <input 
              type="number" 
              v-model.number="editForm.quantity" 
              min="1" 
              step="1"
              :disabled="isSaving"
              class="form-input"
            />
          </div>
        </div>
        
        <div class="summary-box">
          <div class="summary-row">
            <span>New Total:</span>
            <span class="new-total-amount">{{ formatCurrency(editForm.price * editForm.quantity) }}</span>
          </div>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </div>

      <div class="modal-footer">
        <button class="cancel-btn" @click="handleClose" :disabled="isSaving">Cancel</button>
        <button class="save-btn" @click="saveChanges" :disabled="isSaving">
          {{ isSaving ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Edit, X } from 'lucide-vue-next';
import { formatCurrency } from '../utils/currency';
import { apiPatch } from '../utils/api';

const props = defineProps({
  saleId: { type: [Number, String], required: true },
  item: { type: Object, required: true }
});

const emit = defineEmits(['close', 'updated']);

const editForm = ref({
  price: props.item.price || 0,
  quantity: props.item.quantity || 1
});

const isSaving = ref(false);
const error = ref(null);

const productName = computed(() => {
  return props.item.productName || props.item.product_name || props.item.name || "Unknown Item";
});

function handleClose() {
  if (!isSaving.value) {
    emit('close');
  }
}

async function saveChanges() {
  if (editForm.value.price < 0 || editForm.value.quantity < 1) {
    error.value = "Invalid price or quantity. Ensure quantity is at least 1 and price is not negative.";
    return;
  }
  
  error.value = null;
  isSaving.value = true;
  
  try {
    const itemId = props.item.id || props.item.product_id;
    const response = await apiPatch(`/api/sales/${props.saleId}/items/${itemId}`, {
      price: editForm.value.price,
      quantity: editForm.value.quantity
    });
    
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Failed to update item");
    }
    
    emit('updated');
  } catch (err) {
    error.value = err.message || "An error occurred while saving";
    console.error("Error updating sale item:", err);
  } finally {
    isSaving.value = false;
  }
}
</script>

<style scoped>
.modal-overlay {
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

.modal-content {
  background: var(--bg-white, #ffffff);
  border-radius: var(--radius-xl, 16px);
  padding: 2rem;
  width: 90%;
  max-width: 450px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideIn {
  from { transform: translateY(20px) scale(0.95); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

.modal-header h2 {
  margin: 0;
  font-size: var(--font-size-xl, 1.25rem);
  font-weight: 600;
  color: var(--text-primary, #1e293b);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-icon {
  width: 24px;
  height: 24px;
  color: var(--primary-color, #6366f1);
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary, #64748b);
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover:not(:disabled) {
  background-color: var(--bg-hover, #f1f5f9);
  color: var(--danger-bg, #ef4444);
}

.close-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.product-info-card {
  background: var(--bg-hover, #f8fafc);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: var(--radius-md, 8px);
  padding: 1rem;
}

.product-name {
  margin: 0 0 0.5rem 0;
  color: var(--text-primary, #1e293b);
  font-size: var(--font-size-lg, 1.125rem);
  font-weight: 500;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-sm, 0.875rem);
}

.meta-label {
  color: var(--text-secondary, #64748b);
}

.meta-value {
  color: var(--text-primary, #1e293b);
  font-weight: 500;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--text-secondary, #64748b);
  font-weight: 500;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: var(--radius-md, 8px);
  font-size: var(--font-size-base, 1rem);
  color: var(--text-primary, #1e293b);
  transition: all 0.2s;
  background: var(--bg-white, #ffffff);
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color, #6366f1);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-input:disabled {
  background: var(--bg-hover, #f1f5f9);
  color: var(--text-secondary, #94a3b8);
  cursor: not-allowed;
}

.summary-box {
  background: rgba(99, 102, 241, 0.05);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: var(--radius-md, 8px);
  padding: 1rem;
  margin-top: 0.5rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: var(--primary-color, #4f46e5);
}

.new-total-amount {
  font-size: var(--font-size-lg, 1.125rem);
}

.error-message {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-radius: var(--radius-md, 8px);
  border: 1px solid rgba(239, 68, 68, 0.2);
  font-size: var(--font-size-sm, 0.875rem);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color, #e2e8f0);
}

.cancel-btn {
  padding: 0.625rem 1.25rem;
  background: transparent;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: var(--radius-md, 8px);
  color: var(--text-secondary, #64748b);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover:not(:disabled) {
  background: var(--bg-hover, #f1f5f9);
  color: var(--text-primary, #1e293b);
}

.cancel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.save-btn {
  padding: 0.625rem 1.25rem;
  background: var(--primary-gradient, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
  border: none;
  border-radius: var(--radius-md, 8px);
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.save-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
