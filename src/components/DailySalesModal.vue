<template>
  <div class="modal-overlay" @click.stop="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>
          <Calendar class="header-icon" />
          Sales Report - {{ formatDate(dayData.date) }}
        </h2>
        <button class="close-btn" @click="$emit('close')">
          <X class="icon" />
        </button>
      </div>

      <div class="modal-body">
        <div class="summary-cards">
          <div class="stat-card primary">
            <div class="stat-icon-wrapper">
              <Banknote class="stat-icon" />
            </div>
            <div class="stat-info">
              <span class="stat-label">Total Revenue</span>
              <span class="stat-value">{{
                formatCurrency(dayData.total)
              }}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon-wrapper">
              <Receipt class="stat-icon" />
            </div>
            <div class="stat-info">
              <span class="stat-label">Transactions</span>
              <span class="stat-value">{{ dayData.sales.length }}</span>
            </div>
          </div>
        </div>

        <div class="details-grid">
          <div class="detail-section">
            <div class="payment-methods">
              <div
                v-for="(amount, method) in paymentBreakdown"
                :key="method"
                class="detail-row"
              >
                <div class="detail-row-info">
                  <component :is="getPaymentIcon(method)" class="icon-sm" />
                  <span class="detail-row-label">{{ method }}</span>
                </div>
                <span class="payment-amount">{{ formatCurrency(amount) }}</span>
              </div>
              <div class="detail-row" v-if="unverifiedItemsTotal > 0">
                <div class="detail-row-info">
                  <BadgeX class="icon-sm" />
                  <span class="detail-row-label">Unverified</span>
                </div>
                <span class="payment-amount">{{
                  formatCurrency(unverifiedItemsTotal)
                }}</span>
              </div>
              <div class="detail-row" v-if="verifiedItemsTotal > 0">
                <div class="detail-row-info">
                  <BadgeCheck class="icon-sm" />
                  <span class="detail-row-label">Verified</span>
                </div>
                <span class="payment-amount">{{
                  formatCurrency(verifiedItemsTotal)
                }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section items-section">
            <h3>Items Sold</h3>
            <div class="items-list">
              <div class="items-header">
                <span class="col-name">Item</span>
                <span class="col-qty text-right">Qty</span>
                <span class="col-total text-right">Total</span>
              </div>
              <div class="items-scroll">
                <div
                  v-for="item in aggregatedItems"
                  :key="item.id"
                  class="item-row"
                >
                  <span class="col-name">{{ item.name }}</span>
                  <span class="col-qty text-right">{{ item.quantity }}</span>
                  <span
                    :class="{
                      'text-amber-600': item.paymentStatus === 'unverified',
                      'text-emerald-600': item.paymentStatus === 'verified',
                    }"
                    class="col-total text-right"
                    >{{ formatCurrency(item.total) }}</span
                  >
                </div>
                <div v-if="aggregatedItems.length === 0" class="no-items">
                  No item details left.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import {
  X,
  Calendar,
  Banknote,
  Receipt,
  Smartphone,
  BadgeCheck,
  BadgeX,
} from "lucide-vue-next";
import { formatCurrency } from "../utils/currency";

const props = defineProps({
  dayData: {
    type: Object,
    required: true,
  },
});

defineEmits(["close"]);

function formatDate(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
}

function getPaymentIcon(method) {
  const normalizedMethod = method?.toLowerCase() || "";
  return normalizedMethod === "cash" ? Banknote : Smartphone;
}

const paymentBreakdown = computed(() => {
  const breakdown = {};
  props.dayData.sales.forEach((sale) => {
    const method = sale.paymentMethod || "Cash";
    const normalizedMethod = method.charAt(0).toUpperCase() + method.slice(1);
    if (!breakdown[normalizedMethod]) {
      breakdown[normalizedMethod] = 0;
    }
    breakdown[normalizedMethod] += sale.total;
  });
  return breakdown;
});

const unverifiedItemsTotal = computed(() => {
  let total = 0;
  props.dayData.sales.forEach((sale) => {
    sale.items.forEach((item) => {
      if (item.paymentStatus === "unverified") {
        total += item.quantity * item.price;
      }
    });
  });
  return total;
});

const verifiedItemsTotal = computed(() => {
  let total = 0;
  props.dayData.sales.forEach((sale) => {
    sale.items.forEach((item) => {
      if (item.paymentStatus === "verified") {
        total += item.quantity * item.price;
      }
    });
  });
  return total;
});

const aggregatedItems = computed(() => {
  const itemsMap = new Map();

  props.dayData.sales.forEach((sale) => {
    if (sale.items && Array.isArray(sale.items)) {
      sale.items.forEach((item) => {
        const id = item.id || item.product_id;
        const name =
          item.productName || item.product_name || item.name || "Unknown Item";
        const price = item.price || 0;
        const qty = item.quantity || 1;
        const total = price * qty;
        const paymentStatus = item.paymentStatus || "unverified";

        // Use name as fallback key if id is missing
        const key = id || name;

        if (itemsMap.has(key)) {
          const existing = itemsMap.get(key);
          existing.quantity += qty;
          existing.total += total;
        } else {
          itemsMap.set(key, {
            id: key,
            name,
            quantity: qty,
            total,
            paymentStatus,
          });
        }
      });
    }
  });

  return Array.from(itemsMap.values()).sort((a, b) => b.total - a.total);
});
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
  max-width: 650px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideIn {
  from {
    transform: translateY(20px) scale(0.95);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
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
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: var(--bg-hover, #f1f5f9);
  color: var(--danger-bg, #ef4444);
}

.icon {
  width: 20px;
  height: 20px;
}

.modal-body {
  overflow-y: auto;
  flex: 1;
  padding-right: 0.5rem;
}

.modal-body::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-track {
  background: transparent;
}

.modal-body::-webkit-scrollbar-thumb {
  background-color: var(--border-color, #cbd5e1);
  border-radius: 10px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: var(--bg-hover, #f8fafc);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: var(--radius-lg, 12px);
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-card.primary {
  background: rgba(99, 102, 241, 0.05); /* primary-color with opacity */
  border-color: rgba(99, 102, 241, 0.2);
}

.stat-card.primary .stat-icon-wrapper {
  background: rgba(99, 102, 241, 0.1);
  color: var(--primary-color, #6366f1);
}

.stat-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--bg-white, #ffffff);
  color: var(--text-secondary, #64748b);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  width: 24px;
  height: 24px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--text-secondary, #64748b);
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: var(--font-size-lg, 1.125rem);
  font-weight: 600;
  color: var(--text-primary, #1e293b);
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 640px) {
  .details-grid {
    grid-template-columns: 2fr 3fr;
  }
}

.detail-section {
  background: var(--bg-white, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: var(--radius-lg, 12px);
  padding: 1.25rem;
}

.detail-section h3 {
  margin: 0 0 1rem 0;
  font-size: var(--font-size-base, 1rem);
  color: var(--text-primary, #1e293b);
  font-weight: 500;
}

.payment-methods {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--bg-hover, #f8fafc);
  border-radius: var(--radius-md, 8px);
}

.detail-row-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary, #64748b);
  font-size: var(--font-size-sm, 0.875rem);
}

.icon-sm {
  width: 16px;
  height: 16px;
}

.detail-row-label {
  text-transform: capitalize;
}

.payment-amount {
  font-weight: 500;
  color: var(--text-primary, #1e293b);
}

.items-section {
  display: flex;
  flex-direction: column;
}

.items-list {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.items-header {
  display: flex;
  padding: 0.5rem 0;
  color: var(--text-secondary, #64748b);
  font-size: var(--font-size-xs, 0.75rem);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid var(--border-color, #e2e8f0);
  margin-bottom: 0.5rem;
}

.col-name {
  flex: 2;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-qty {
  flex: 1;
  max-width: 60px;
}

.col-total {
  flex: 1;
  max-width: 80px;
}

.text-right {
  text-align: right;
}

.text-amber-600 {
  color: #d97706;
}

.text-emerald-600 {
  color: #059669;
}

.items-scroll {
  max-height: 250px;
  overflow-y: auto;
}

.items-scroll::-webkit-scrollbar {
  width: 4px;
}

.items-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.items-scroll::-webkit-scrollbar-thumb {
  background-color: var(--border-color, #e2e8f0);
  border-radius: 4px;
}

.item-row {
  display: flex;
  padding: 0.75rem 0;
  border-bottom: 1px dashed var(--border-color, #e2e8f0);
  font-size: var(--font-size-sm, 0.875rem);
}

.item-row:last-child {
  border-bottom: none;
}

.item-row .col-name {
  font-weight: 500;
  color: var(--text-primary, #1e293b);
}

.item-row .col-qty {
  color: var(--text-secondary, #64748b);
}

.item-row .col-total {
  font-weight: 500;
}

.no-items {
  padding: 1rem 0;
  text-align: center;
  color: var(--text-secondary, #64748b);
  font-style: italic;
  font-size: var(--font-size-sm, 0.875rem);
}
</style>
