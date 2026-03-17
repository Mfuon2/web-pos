<template>
  <div class="modal-overlay" @click.stop="handleClose">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>
          <Trash2 class="header-icon danger" />
          Delete Sale Item
        </h2>
        <button class="close-btn" @click="handleClose" :disabled="isDeleting">
          <X class="icon" />
        </button>
      </div>

      <div class="modal-body">
        <div class="alert-box">
          <AlertCircle class="alert-icon" />
          <p>Are you sure you want to delete this item from the sale? This action cannot be undone.</p>
        </div>

        <div class="product-info-card">
          <h3 class="product-name">{{ productName }}</h3>
          <div class="product-meta">
            <span class="meta-label">Quantity:</span>
            <span class="meta-value">{{ item.quantity }}</span>
          </div>
          <div class="product-meta mt-1">
            <span class="meta-label">Total Amount:</span>
            <span class="meta-value">{{ formatCurrency(item.price * item.quantity) }}</span>
          </div>
        </div>

        <div class="form-group checkbox-group">
          <label class="checkbox-container">
            <input 
              type="checkbox" 
              v-model="revertStock" 
              :disabled="isDeleting"
            />
            <span class="checkmark"></span>
            <span class="checkbox-label">Revert stock count (add {{ item.quantity }} items back to inventory)</span>
          </label>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </div>

      <div class="modal-footer">
        <button class="cancel-btn" @click="handleClose" :disabled="isDeleting">Cancel</button>
        <button class="delete-btn" @click="deleteItem" :disabled="isDeleting">
          {{ isDeleting ? 'Deleting...' : 'Delete Item' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Trash2, AlertCircle, X } from 'lucide-vue-next';
import { formatCurrency } from '../utils/currency';
import { apiDelete } from '../utils/api';

const props = defineProps({
  saleId: { type: [Number, String], required: true },
  item: { type: Object, required: true }
});

const emit = defineEmits(['close', 'deleted']);

const revertStock = ref(true);
const isDeleting = ref(false);
const error = ref(null);

const productName = computed(() => {
  return props.item.productName || props.item.product_name || props.item.name || "Unknown Item";
});

function handleClose() {
  if (!isDeleting.value) {
    emit('close');
  }
}

async function deleteItem() {
  error.value = null;
  isDeleting.value = true;
  
  try {
    const itemId = props.item.id || props.item.product_id;
    const response = await apiDelete(`/api/sales/${props.saleId}/items/${itemId}?revertStock=${revertStock.value}`);
    
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Failed to delete item");
    }
    
    emit('deleted');
  } catch (err) {
    error.value = err.message || "An error occurred while deleting";
    console.error("Error deleting sale item:", err);
  } finally {
    isDeleting.value = false;
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

.header-icon.danger {
  width: 24px;
  height: 24px;
  color: #ef4444;
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

.alert-box {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-md, 8px);
  padding: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.alert-icon {
  color: #ef4444;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.alert-box p {
  margin: 0;
  color: #b91c1c;
  font-size: var(--font-size-sm, 0.875rem);
  line-height: 1.4;
}

.product-info-card {
  background: var(--bg-hover, #f8fafc);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: var(--radius-md, 8px);
  padding: 1rem;
}

.product-name {
  margin: 0 0 0.75rem 0;
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

.product-meta.mt-1 {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px dashed var(--border-color, #cbd5e1);
}

.meta-label {
  color: var(--text-secondary, #64748b);
}

.meta-value {
  color: var(--text-primary, #1e293b);
  font-weight: 500;
}

.form-group {
  margin-top: 0.5rem;
}

.checkbox-container {
  display: flex;
  align-items: flex-start;
  position: relative;
  cursor: pointer;
  font-size: var(--font-size-sm, 0.875rem);
  user-select: none;
  color: var(--text-primary, #1e293b);
}

.checkbox-container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: relative;
  top: 2px;
  left: 0;
  height: 18px;
  width: 18px;
  background-color: var(--bg-white, #ffffff);
  border: 1px solid var(--border-color, #cbd5e1);
  border-radius: 4px;
  margin-right: 0.75rem;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.checkbox-container:hover input ~ .checkmark {
  border-color: var(--primary-color, #6366f1);
}

.checkbox-container input:checked ~ .checkmark {
  background-color: var(--primary-color, #6366f1);
  border-color: var(--primary-color, #6366f1);
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.checkbox-container input:checked ~ .checkmark:after {
  display: block;
}

.checkbox-container .checkmark:after {
  left: 6px;
  top: 2px;
  width: 4px;
  height: 9px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-label {
  line-height: 1.4;
  padding-top: 2px;
}

.checkbox-container input:disabled ~ .checkmark {
  background-color: var(--bg-hover, #f1f5f9);
  border-color: var(--border-color, #e2e8f0);
  cursor: not-allowed;
}

.checkbox-container input:disabled ~ .checkbox-label {
  color: var(--text-secondary, #94a3b8);
  cursor: not-allowed;
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

.delete-btn {
  padding: 0.625rem 1.25rem;
  background: #ef4444;
  border: none;
  border-radius: var(--radius-md, 8px);
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

.delete-btn:hover:not(:disabled) {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.delete-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
