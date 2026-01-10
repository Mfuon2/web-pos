<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>{{ expense ? 'Edit Expense' : 'Record Expense' }}</h2>
        <button class="close-btn" @click="$emit('close')">
          <X class="icon" />
        </button>
      </div>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>Category</label>
          <select v-model="formData.category" required>
            <option value="Rent">Rent</option>
            <option value="Utilities">Utilities</option>
            <option value="Salaries">Salaries</option>
            <option value="Inventory">Inventory</option>
            <option value="Marketing">Marketing</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div class="form-group">
          <label>Date</label>
          <input v-model="formData.date" type="date" required />
        </div>
        <div class="form-group">
          <label>Amount</label>
          <input v-model.number="formData.amount" type="number" step="0.01" required />
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea v-model="formData.description" rows="3"></textarea>
        </div>
        <button type="submit" class="submit-btn">{{ expense ? 'Update Expense' : 'Save Expense' }}</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  expense: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])

const formData = ref({
  category: props.expense?.category || 'Other',
  amount: props.expense?.amount || '',
  description: props.expense?.description || '',
  date: props.expense?.createdAt ? new Date(props.expense.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
})

// Watch for changes to expense prop (for editing)
watch(() => props.expense, (newExpense) => {
  if (newExpense) {
    formData.value = {
      category: newExpense.category,
      amount: newExpense.amount,
      description: newExpense.description,
      date: newExpense.createdAt ? new Date(newExpense.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    }
  }
}, { immediate: true })

function handleSubmit() {
  const dataToSubmit = {
    category: formData.value.category,
    amount: formData.value.amount,
    description: formData.value.description,
    createdAt: formData.value.date // Use the custom date
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
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0.5rem;
}

.icon {
  width: 24px;
  height: 24px;
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
  padding: 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.submit-btn {
  width: 100%;
  padding: var(--spacing-md);
  background: var(--primary-gradient);
  color: var(--text-white);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: 500;
  cursor: pointer;
  margin-top: var(--spacing-lg);
  transition: all 0.3s ease;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}
</style>
