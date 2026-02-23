<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content wide">
      <div class="modal-header">
        <h2>Record Borrowed Items</h2>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="info-alert">
        <AlertCircle class="icon-sm" />
        <p>
          {{
            items.length > 1
              ? "Multiple items have insufficient stock."
              : "Item has insufficient stock."
          }}
          <span v-if="borrowedAt"
            >Borrow date will be recorded as <strong>{{ borrowedAt }}</strong
            >.</span
          >
          Otherwise, record borrowings to proceed.
        </p>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="items-container">
          <div
            v-for="(item, index) in borrowingData"
            :key="item.product_id"
            class="borrow-item-row"
          >
            <div class="item-header">
              <h3>{{ item.name }}</h3>
              <span class="deficit-badge">Need: {{ item.quantity }}</span>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Borrowing From *</label>
                <input
                  v-model="item.borrowed_from"
                  type="text"
                  required
                  placeholder="e.g. Supplier X, Shop B"
                  :ref="
                    (el) => {
                      if (index === 0) firstInput = el;
                    }
                  "
                />
              </div>
              <div class="form-group">
                <label>Reason / Notes</label>
                <input
                  v-model="item.reason"
                  type="text"
                  placeholder="e.g. Urgent customer order"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="actions">
          <button type="button" class="cancel-btn" @click="$emit('close')">
            Cancel Sale
          </button>
          <button type="submit" class="submit-btn" :disabled="!isFormValid">
            Confirm & Borrow All
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { AlertCircle } from "lucide-vue-next";

const props = defineProps({
  items: {
    type: Array, // Array of { product: {id, name}, deficit: number }
    required: true,
  },
  borrowedAt: {
    type: String, // Value indicating the selected saleDate value
    required: false,
  },
});

const emit = defineEmits(["close", "confirm"]);

const borrowingData = ref(
  props.items.map((item) => ({
    product_id: item.product.id,
    name: item.product.name,
    quantity: item.deficit,
    borrowed_from: "",
    reason: "",
  })),
);

const firstInput = ref(null);

const isFormValid = computed(() => {
  return borrowingData.value.every(
    (item) => item.borrowed_from.trim().length > 0,
  );
});

function handleSubmit() {
  emit(
    "confirm",
    borrowingData.value.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      borrowed_from: item.borrowed_from,
      reason: item.reason,
      borrowed_at: props.borrowedAt,
    })),
  );
}

onMounted(() => {
  if (firstInput.value) {
    firstInput.value.focus();
  }
});
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
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
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
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
}

.info-alert {
  background: var(
    --warning-bg
  ); /* Use locally if var not defined or generic warning color */
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

.form-group {
  margin-bottom: 1rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-primary);
}

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

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-content.wide {
  max-width: 700px;
}

.items-container {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 2rem;
  padding-right: 0.5rem;
}

.borrow-item-row {
  background: var(--bg-hover);
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  margin-bottom: 1rem;
  border: 1px solid var(--border-color);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.item-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.deficit-badge {
  background: var(--warning-bg);
  background-color: #ffedd5;
  color: #9a3412;
  padding: 0.25rem 0.75rem;
  border-radius: 99px;
  font-size: 0.85rem;
  font-weight: 600;
}

.icon-sm {
  width: 20px;
  height: 20px;
}
</style>
