<template>
  <div class="sales-container">
    <div class="header">
      <h1>
        <Receipt class="header-icon" />
        Sales History
      </h1>
      <button 
        v-if="isAdmin" 
        class="export-btn" 
        @click="openExportModal"
      >
        <Download class="icon-sm" />
        Export
      </button>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      Loading sales...
    </div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else-if="salesByDate.length === 0" class="empty-state">
      <Receipt class="empty-icon" />
      <h3>No Sales Yet</h3>
      <p>Sales made from the POS Terminal will appear here</p>
    </div>

    <div v-else class="sales-timeline">
      <div
        v-for="dailySales in salesByDate"
        :key="dailySales.date"
        class="day-group"
      >
        <div class="day-header" @click="toggleDay(dailySales.date)">
          <div class="day-info">
            <ChevronRight
              class="toggle-icon"
              :class="{ rotated: expandedDays.includes(dailySales.date) }"
            />
            <h2>{{ formatDate(dailySales.date) }}</h2>
            <span class="sales-count-badge">{{ dailySales.sales.length }}</span>
          </div>
          <div class="day-actions">
            <div class="day-total">
              {{ formatCurrency(dailySales.total) }}
            </div>
            <button
              class="action-btn"
              @click.stop="openDailySalesModal(dailySales)"
              title="View Day Summary"
            >
              <Eye class="icon-sm" />
            </button>
          </div>
        </div>

        <transition name="slide">
          <div v-if="expandedDays.includes(dailySales.date)" class="sales-list">
            <div
              v-for="(sale, index) in dailySales.sales"
              :key="sale.id"
              class="sale-card"
              :class="{ expanded: expandedSale === sale.id }"
              @click.stop="toggleSale(sale.id)"
            >
              <div class="sale-summary">
                <div class="sale-main-info">
                  <span class="sale-id"
                    >#{{ dailySales.sales.length - index }}</span
                  >
                  <span class="sale-time">
                    {{ formatTime(sale.createdAt) }}
                    <span class="item-count">
                      ({{ sale.items ? sale.items.length : 0 }} items)
                    </span>
                  </span>
                </div>

                <div class="sale-meta">
                  <div class="payment-badge">
                    <component
                      :is="getPaymentIcon(sale.paymentMethod || 'cash')"
                      class="icon-xs"
                    />
                    {{ sale.paymentMethod || "Cash" }}
                  </div>
                  <span class="sale-amount">{{
                    formatCurrency(sale.total)
                  }}</span>
                  <ChevronDown
                    class="expand-icon"
                    :class="{ rotated: expandedSale === sale.id }"
                  />
                </div>
              </div>

              <transition name="slide">
                <div
                  v-if="expandedSale === sale.id"
                  class="sale-details-panel"
                  @click.stop
                >
                  <div class="items-table-header">
                    <span>Item</span>
                    <span class="text-right">Qty</span>
                    <span class="text-right">Price</span>
                    <span class="text-right">Total</span>
                  </div>
                  <div class="items-list">
                    <div
                      v-for="item in sale.items"
                      :key="item.id || item.product_id"
                      class="item-row"
                    >
                      <div class="item-name">
                        <div class="item-name-badge">
                          <div class="item-primary-info">
                            {{
                              item.productName ||
                              item.product_name ||
                              item.name ||
                              "Unknown Item"
                            }}
                          </div>
                          <span
                            v-if="!isAdmin"
                            class="verification-badge"
                            :class="item.paymentStatus || 'unverified'"
                          >
                            {{
                              item.paymentStatus === "verified"
                                ? "Verified"
                                : "Unverified"
                            }}
                          </span>
                        </div>

                        <div class="item-verification-info" v-if="isAdmin">
                          <span
                            class="verification-badge"
                            :class="item.paymentStatus || 'unverified'"
                          >
                            {{
                              item.paymentStatus === "verified"
                                ? "Verified"
                                : "Unverified"
                            }}
                          </span>
                          <span
                            v-if="
                              item.paymentStatus === 'verified' &&
                              item.verifiedAt
                            "
                            class="item-verify-date"
                          >
                            {{ formatDate(item.verifiedAt) }}
                          </span>
                          <button
                            v-if="
                              (item.paymentStatus === 'unverified' ||
                                !item.paymentStatus) &&
                              isAdmin
                            "
                            class="verify-btn-sm"
                            @click="verifyItem(sale.id, item)"
                            :disabled="item.isVerifying"
                          >
                            {{ item.isVerifying ? "Verifying..." : "Verify" }}
                          </button>
                        </div>
                      </div>
                      <div class="item-qty text-right">{{ item.quantity }}</div>
                      <div class="item-price text-right">
                        {{ formatCurrency(item.price) }}
                      </div>
                      <div class="item-subtotal text-right">
                        {{ formatCurrency(item.price * item.quantity) }}
                      </div>
                    </div>
                    <div
                      v-if="!sale.items || sale.items.length === 0"
                      class="no-items"
                    >
                      No items recorded for this sale.
                    </div>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- Modals -->
    <DailySalesModal
      v-if="isDailySalesModalOpen"
      :day-data="selectedDayData"
      @close="closeDailySalesModal"
    />
    <ExportSalesModal
      v-if="isExportModalOpen"
      :sales="sales"
      :is-admin="isAdmin"
      @close="closeExportModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import {
  Receipt,
  ChevronDown,
  ChevronRight,
  Banknote,
  Smartphone,
  Eye,
  Download,
} from "lucide-vue-next";
import DailySalesModal from "../components/DailySalesModal.vue";
import ExportSalesModal from "../components/ExportSalesModal.vue";
import { formatCurrency } from "../utils/currency";
import { apiGet, apiPatch } from "../utils/api";
import { useAuthStore } from "../stores/authStore";

const authStore = useAuthStore();
const currentUser = computed(() => authStore.currentUser);
const isAdmin = computed(() => currentUser.value?.role === "admin");
const sales = ref([]);
const loading = ref(false);
const error = ref(null);
const expandedSale = ref(null);
const expandedDays = ref([]);
const isDailySalesModalOpen = ref(false);
const isExportModalOpen = ref(false);
const selectedDayData = ref(null);

function openDailySalesModal(dayGroup) {
  selectedDayData.value = dayGroup;
  isDailySalesModalOpen.value = true;
}

function closeDailySalesModal() {
  isDailySalesModalOpen.value = false;
  selectedDayData.value = null;
}

function openExportModal() {
  isExportModalOpen.value = true;
}

function closeExportModal() {
  isExportModalOpen.value = false;
}

// Group sales by date
const salesByDate = computed(() => {
  const grouped = {};

  sales.value.forEach((sale) => {
    let dateStr;
    // Prioritize saleDate, fallback to createdAt
    if (sale.saleDate || sale.sale_date) {
      const rawDate = sale.saleDate || sale.sale_date;
      // Ensure YYYY-MM-DD is treated as local time
      dateStr = rawDate.includes("T") ? rawDate : `${rawDate}T00:00:00`;
    } else {
      dateStr = sale.createdAt || sale.created_at;
      if (dateStr && typeof dateStr === "string") {
        dateStr = dateStr.replace(" ", "T");
      }
    }

    const date = new Date(dateStr).toDateString();
    if (!grouped[date]) {
      grouped[date] = {
        date: date,
        sales: [],
        total: 0,
      };
    }
    grouped[date].sales.push(sale);
    grouped[date].total += sale.total;
  });

  // Sort groups by date descending
  const sortedGroups = Object.values(grouped).sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );

  // Sort sales within each group by ID descending (newest first)
  sortedGroups.forEach((group) => {
    group.sales.sort((a, b) => b.id - a.id);
  });

  return sortedGroups;
});

function toggleDay(date) {
  if (expandedDays.value.includes(date)) {
    expandedDays.value = expandedDays.value.filter((d) => d !== date);
  } else {
    expandedDays.value.push(date);
  }
}

function toggleSale(id) {
  expandedSale.value = expandedSale.value === id ? null : id;
}

function isToday(dateString) {
  if (!dateString) return false;
  if (typeof dateString === "string") {
    dateString = dateString.replace(" ", "T");
  }
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  return date.toDateString() === today.toDateString();
}

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
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }
}

function formatTime(dateString) {
  if (!dateString) return "";
  if (typeof dateString === "string") {
    dateString = dateString.replace(" ", "T");
  }
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPaymentIcon(method) {
  return method === "cash" ? Banknote : Smartphone;
}

async function fetchSales() {
  loading.value = true;
  error.value = null;
  try {
    const response = await apiGet("/api/sales");
    if (!response.ok) throw new Error("Failed to fetch sales");
    sales.value = await response.json();

    // Auto-expand today
    const today = new Date().toDateString();
    if (salesByDate.value.some((g) => g.date === today)) {
      expandedDays.value.push(today);
    }
  } catch (err) {
    error.value = err.message;
    console.error("Error fetching sales:", err);
  } finally {
    loading.value = false;
  }
}

async function verifyItem(saleId, item) {
  item.isVerifying = true;
  try {
    const response = await apiPatch(
      `/api/sales/${saleId}/items/${item.id}/verify`,
      { verifiedBy: currentUser.value.id },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to verify item");
    }

    const data = await response.json();
    item.paymentStatus = "verified";
    item.verifiedAt = data.verifiedAt;
    item.verifiedBy = data.verifiedBy;
  } catch (err) {
    console.error("Error verifying item:", err);
  } finally {
    item.isVerifying = false;
  }
}

onMounted(() => {
  fetchSales();
});
</script>

<style scoped>
.sales-container {
  padding: var(--spacing-xl);
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  margin: 0;
  font-size: var(--font-size-2xl);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
}

.export-btn {
  padding: 0.3rem 1rem;
  background: var(--primary-gradient);
  color: var(--text-white);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.export-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.export-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.header-icon {
  width: 32px;
  height: 32px;
  color: var(--primary-color);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
  color: var(--text-secondary);
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid var(--bg-hover);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--danger-bg);
  background: var(--bg-white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-secondary);
}

.empty-icon {
  width: 48px;
  height: 48px;
  opacity: 0.3;
  margin-bottom: 1rem;
}

/* Timeline & Groups */
.sales-timeline {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.day-group {
  background: var(--bg-white);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: var(--border-width) solid var(--border-color);
}

.day-header {
  padding: var(--spacing-lg) 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  background: var(--bg-white);
  transition: background 0.2s;
  user-select: none;
}

.day-header:hover {
  background: var(--bg-hover);
}

.day-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.toggle-icon {
  width: 18px;
  height: 18px;
  color: var(--text-secondary);
  transition: transform 0.2s;
}

.toggle-icon.rotated {
  transform: rotate(90deg);
}

.day-info h2 {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--text-primary);
}

.sales-count-badge {
  background: var(--bg-hover);
  color: var(--text-secondary);
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
  border-radius: 10px;
  font-weight: 500;
}

.day-total {
  font-weight: 600;
  color: var(--primary-color);
  font-size: var(--font-size-base);
}

.day-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.action-btn {
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 0.4rem;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--bg-hover);
  color: var(--primary-color);
  border-color: var(--primary-color);
}

.icon-sm {
  width: 16px;
  height: 16px;
}

/* Sales List */
.sales-list {
  border-top: 1px solid var(--border-color);
  background: var(--bg-hover);
}

.sale-card {
  border-bottom: var(--border-width) solid var(--border-color);
  background: var(--bg-white);
  transition: all 0.2s;
}

.sale-card:last-child {
  border-bottom: none;
}

.sale-card:hover {
  background: #f8fafc;
}

.sale-summary {
  padding: 0.75rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.sale-main-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.sale-id {
  font-family: monospace;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.sale-time {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.item-count {
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
  font-weight: normal;
}

.sale-meta {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.payment-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  text-transform: capitalize;
}

.icon-xs {
  width: 14px;
  height: 14px;
}

.sale-amount {
  font-weight: 500;
  color: var(--text-primary);
  min-width: 60px;
  text-align: right;
}

.expand-icon {
  width: 16px;
  height: 16px;
  color: var(--text-secondary);
  transition: transform 0.2s;
}

.expand-icon.rotated {
  transform: rotate(180deg);
}

.verification-badge {
  font-size: 0.65rem;
  padding: 0.15rem 0.4rem;
  border-radius: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-block;
}

.verification-badge.verified {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.verification-badge.unverified {
  background-color: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.item-verification-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.item-verify-date {
  font-size: 0.65rem;
  color: var(--text-secondary);
  font-style: italic;
}

.verify-btn-sm {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 0.15rem 0.4rem;
  border-radius: var(--radius-sm);
  font-size: 0.65rem;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.verify-btn-sm:hover:not(:disabled) {
  opacity: 0.9;
}

.verify-btn-sm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Sale Details Panel */
.sale-details-panel {
  padding: 0 1.25rem 1.25rem;
  background: #f8fafc;
  border-top: 1px solid var(--border-color);
  font-size: var(--font-size-sm);
}

.items-table-header {
  display: flex;
  padding: 0.75rem 0.5rem;
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: var(--border-width) solid var(--border-color);
  margin-bottom: 0.5rem;
}

.items-table-header span:first-child {
  flex: 1;
}

.items-table-header span:not(:first-child) {
  width: 80px;
}

.text-right {
  text-align: right;
}

.item-row {
  display: flex;
  padding: 0.5rem;
  border-bottom: var(--border-width) dashed var(--border-color);
}

.item-row:last-child {
  border-bottom: none;
}

.item-name {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.item-name-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.item-primary-info {
  color: var(--text-primary);
  font-weight: 500;
}

.item-qty,
.item-price,
.item-subtotal {
  width: 80px;
  color: var(--text-secondary);
}

.item-subtotal {
  color: var(--text-primary);
  font-weight: 500;
}

.no-items {
  padding: 1rem;
  text-align: center;
  color: var(--text-secondary);
  font-style: italic;
}

/* Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
  opacity: 1;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}

@media (max-width: 640px) {
  .sales-container {
    padding: var(--spacing-lg);
  }

  .sale-summary {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .sale-meta {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
