<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Record Purchase Order</h2>
        <button class="close-btn" @click="$emit('close')">
          <X class="icon-sm" />
        </button>
      </div>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>Supplier (Optional)</label>
          <select v-model="formData.supplier_id">
            <option :value="null">No Supplier</option>
            <option v-for="supplier in suppliers" :key="supplier.id" :value="supplier.id">
              {{ supplier.name }}
            </option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Status</label>
          <select v-model="formData.status" required>
            <option value="pending">Pending</option>
            <option value="received">Received</option>
          </select>
        </div>

        <div class="form-group">
          <label>Date</label>
          <input v-model="formData.date" type="date" required />
        </div>

        <div class="form-group">
          <label>Total Amount</label>
          <input v-model.number="formData.total" type="number" step="0.01" required />
        </div>

        <div class="form-group">
          <label>Notes</label>
          <textarea v-model="formData.notes" rows="3" placeholder="e.g., Invoice #12345, Payment method, etc."></textarea>
        </div>

        <div class="form-helper">
          <p>💡 <strong>Tip:</strong> Mark as "Received" only when you've actually received and paid for the stock.</p>
        </div>

        <button type="submit" class="submit-btn">Save Purchase Order</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useSupplierStore } from '../stores/supplierStore'
import { X } from 'lucide-vue-next'

const emit = defineEmits(['close', 'save'])
const supplierStore = useSupplierStore()
const suppliers = computed(() => supplierStore.suppliers)

const formData = ref({
  supplier_id: null,
  total: '',
  status: 'received',
  notes: '',
  date: new Date().toISOString().split('T')[0]
})

onMounted(() => {
  supplierStore.fetchSuppliers()
})

function handleSubmit() {
  // Use the custom date for createdAt
  const dataToSubmit = {
    ...formData.value,
    createdAt: formData.value.date,
    received_at: formData.value.status === 'received' ? new Date().toISOString() : null
  }
  emit('save', dataToSubmit)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--bg-white);
  border-radius: var(--radius-xl);
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.3s ease;
  max-height: 90vh;
  overflow-y: auto;
}

@keyframes slideIn {
  from { transform: translateY(-50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h2 {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: 500;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: var(--font-size-xl);
  cursor: pointer;
  color: var(--text-secondary);
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: var(--spacing-md);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.form-helper {
  background: #edf2f7;
  border-left: 4px solid var(--primary-color);
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 4px;
}

.form-helper p {
  margin: 0;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.submit-btn {
  width: 100%;
  padding: var(--spacing-md);
  background: var(--primary-gradient);
  color: var(--text-white);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: var(--font-size-base);
  cursor: pointer;
  margin-top: var(--spacing-lg);
  transition: all 0.3s ease;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}
</style>
