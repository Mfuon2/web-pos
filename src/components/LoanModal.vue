<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Record Loan Items</h2>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="items-preview">
        <h3>Items to Loan</h3>
        <ul>
          <li v-for="item in items" :key="item.product_id">
            <strong>{{ item.name }}</strong> x {{ item.quantity }}
          </li>
        </ul>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>Borrower Name / Shop *</label>
          <input 
            v-model="formData.borrower_name" 
            type="text" 
            required 
            placeholder="e.g. Shop B, John Doe"
            ref="nameInput"
          />
        </div>

        <div class="form-group">
          <label>Contact Number</label>
          <div class="input-with-action">
            <input 
              v-model="formData.borrower_contact" 
              type="tel" 
              placeholder="Phone number"
            />
            <button 
              type="button" 
              class="icon-btn" 
              title="Pick from Contacts"
              v-if="isContactSupported"
              @click="pickContact"
            >
              <Contact class="icon-sm" /> Pick
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>Collateral Collected</label>
          <input 
            v-model="formData.collateral" 
            type="text" 
            placeholder="e.g. ID Card, Cash"
          />
        </div>

        <div class="form-group">
          <label>Collateral Description / Notes</label>
          <textarea 
            v-model="formData.collateral_description" 
            rows="2"
            placeholder="Details about condition or amount..."
          ></textarea>
        </div>

        <div class="actions">
          <button type="button" class="cancel-btn" @click="$emit('close')">
            Cancel
          </button>
          <button type="submit" class="submit-btn" :disabled="loading">
            {{ loading ? 'Recording...' : 'Confirm Loan' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Contact } from 'lucide-vue-next'

const props = defineProps({
  items: Array,
  loading: Boolean
})

const emit = defineEmits(['close', 'confirm'])

const formData = ref({
  borrower_name: '',
  borrower_contact: '',
  collateral: '',
  collateral_description: ''
})

const nameInput = ref(null)
const isContactSupported = ref('contacts' in navigator && 'ContactsManager' in window)

// Fallback check or just try/catch
async function pickContact() {
  try {
    const props = ['name', 'tel'];
    const opts = { multiple: false };
    
    // Check again just to be sure, although v-if handles it
    if (!('contacts' in navigator)) {
      alert('Contacts API not supported on this device.');
      return;
    }

    const contacts = await navigator.contacts.select(props, opts);
    
    if (contacts.length) {
      const contact = contacts[0];
      if (contact.name && contact.name.length) {
        // Simple name join
        formData.value.borrower_name = contact.name.join(' ');
      }
      if (contact.tel && contact.tel.length) {
        formData.value.borrower_contact = contact.tel[0];
      }
    }
  } catch (err) {
    console.error('Contact picker failed:', err);
    // Silent fail or alert if user initiated
  }
}

function handleSubmit() {
  emit('confirm', formData.value)
}

onMounted(() => {
  if (nameInput.value) nameInput.value.focus()
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

.items-preview {
  background: var(--bg-hover);
  padding: 1rem;
  border-radius: var(--radius-md);
  margin-bottom: 1.5rem;
}

.items-preview h3 { margin: 0 0 0.5rem 0; font-size: 1rem; color: var(--text-secondary); }
.items-preview ul { margin: 0; padding-left: 1.2rem; }
.items-preview li { color: var(--text-primary); margin-bottom: 0.25rem; }

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

.input-with-action {
  display: flex;
  gap: 0.5rem;
}

.icon-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 1rem;
  background: var(--bg-hover);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
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
