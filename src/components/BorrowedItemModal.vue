<template>
  <div class="modal-overlay">
    <div class="modal-content wide">
      <div class="modal-header">
        <h2>Record Borrowed Items</h2>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="info-alert" v-if="!isManualBorrow">
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
      <div class="info-alert" v-else>
        <AlertCircle class="icon-sm" />
        <p>
          Record all items in the current cart as borrowed.
          <span v-if="borrowedAt"
            >Date: <strong>{{ borrowedAt }}</strong
            >.</span
          >
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

        <div class="checkbox-group" v-if="isManualBorrow">
          <label class="custom-checkbox">
            <input type="checkbox" v-model="reduceStock" />
            <span class="checkmark"></span>
            Reduce inventory stock for these items
          </label>
        </div>

        <div class="actions">
          <button type="button" class="cancel-btn" @click="$emit('close')">
            Cancel Sale
          </button>
          <button
            type="submit"
            class="submit-btn"
            :disabled="!isFormValid || isSubmitting"
          >
            <span v-if="isSubmitting">Borrowing...</span>
            <span v-else>
              {{
                isManualBorrow
                  ? "Confirm Borrowed Items"
                  : "Confirm & Borrow All"
              }}
            </span>
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
  isManualBorrow: {
    type: Boolean,
    default: false,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
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

const reduceStock = ref(true);

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
    reduceStock.value,
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

.checkbox-group {
  margin-bottom: 1.5rem;
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
}

.custom-checkbox {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: relative;
  cursor: pointer;
  font-weight: 500;
  color: var(--text-primary);
  user-select: none;
  font-size: 0.95rem;
  margin: 0;
}

.custom-checkbox input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  height: 20px;
  width: 20px;
  background-color: var(--bg-white);
  border: 2px solid var(--border-color);
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.custom-checkbox:hover input ~ .checkmark {
  border-color: var(--primary-color);
}

.custom-checkbox input:checked ~ .checkmark {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.checkmark:after {
  content: "";
  display: none;
  width: 4px;
  height: 9px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  margin-bottom: 2px;
}

.custom-checkbox input:checked ~ .checkmark:after {
  display: block;
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

@media (max-width: 600px) {
  .form-row {
    grid-template-columns: 1fr;
  }
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
