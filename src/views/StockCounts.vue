<template>
  <div class="stock-counts">
    <div class="header">
      <h1>
        <ClipboardList class="header-icon" />
        Stock Counts
      </h1>
    </div>

    <!-- Tab Navigation -->
    <div class="tabs">
      <button
        class="tab"
        :class="{ active: activeTab === 'history' }"
        @click="activeTab = 'history'"
      >
        <History class="icon-sm" />
        Count History
      </button>
      <button
        v-if="activeCount"
        class="tab"
        :class="{ active: activeTab === 'active' }"
        @click="activeTab = 'active'"
      >
        <Edit3 class="icon-sm" />
        Active Count
      </button>
    </div>

    <div class="tab-content">
      <!-- History Tab -->
      <div v-if="activeTab === 'history'" class="content-section">
        <div class="section-header">
          <h2>Count History</h2>
          <div class="header-actions">
            <button
              @click="startNewCount"
              class="add-btn"
              :disabled="stockCountStore.loading"
            >
              {{ stockCountStore.loading ? "..." : "+ Start New Count" }}
            </button>
          </div>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th class="history-notes-col">Notes</th>
                <th>Discrepancy</th>
                <th>Counted By</th>
                <th>Reconciled By</th>
                <th>Options</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="count in stockCountStore.stockCounts" :key="count.id">
                <td data-label="Date">
                  {{ formatDateWithoutTime(count.countDate) }}
                </td>
                <td data-label="Status">
                  <span class="status-badge" :class="count.status">{{
                    count.status
                  }}</span>
                </td>
                <td data-label="Notes" class="history-notes-cell">
                  {{ count.notes || "N/A" }}
                </td>
                <td data-label="Discrepancy">
                  <span
                    v-if="count.hasDiscrepancy"
                    class="discrepancy-badge yes"
                    >Yes</span
                  >
                  <span v-else class="discrepancy-badge no">No</span>
                </td>
                <td data-label="Counted By">
                  {{
                    getUserName(count.countedBy) || count.countedBy || "Unknown"
                  }}
                </td>
                <td data-label="Reconciled By">
                  {{
                    count.reconciledBy
                      ? `${getUserName(count.reconciledBy) || count.reconciledBy}`
                      : count.status === "completed"
                        ? "N/A"
                        : "Pending"
                  }}
                </td>
                <td class="actions" data-label="Options">
                  <button
                    @click="viewCount(count)"
                    class="action-btn edit-btn"
                    title="View/Edit"
                  >
                    <Eye class="icon-sm" v-if="count.status === 'completed'" />
                    <Edit2 class="icon-sm" v-else />
                  </button>
                  <button
                    v-if="
                      count.status === 'completed' &&
                      !count.reconciledBy &&
                      isLatestCount(count.id)
                    "
                    @click="confirmReconcile(count)"
                    class="action-btn manage-btn"
                    title="Reconcile"
                  >
                    <CheckCircle class="icon-sm" />
                  </button>
                </td>
              </tr>
              <tr v-if="stockCountStore.stockCounts.length === 0">
                <td colspan="7" class="empty-state">No stock counts found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Active Count Tab -->
      <div v-if="activeTab === 'active' && activeCount" class="content-section">
        <div class="section-header">
          <h2>
            Stock Count: {{ formatDateWithoutTime(activeCount.countDate) }}
          </h2>
          <span class="status-badge" :class="activeCount.status">{{
            activeCount.status
          }}</span>
        </div>

        <div class="count-form">
          <div class="form-section count-details-section">
            <h3 class="section-title">Count Details</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Count Date</label>
                <input
                  type="date"
                  v-model="activeCount.countDate"
                  :disabled="isCompleted"
                />
              </div>
              <div class="form-group notes-group">
                <label>Notes</label>
                <textarea
                  v-model="activeCount.notes"
                  :disabled="isCompleted"
                  placeholder="e.g., Monthly audit"
                  rows="2"
                ></textarea>
              </div>
            </div>
          </div>

          <div class="form-section count-items-section mt-4">
            <h3 class="section-title">Stock Items</h3>
            <div class="form-group mb-4" v-if="!isCompleted">
              <div class="search-wrapper">
                <Search class="search-icon" />
                <input
                  type="text"
                  v-model="searchQuery"
                  placeholder="Search product name..."
                  class="search-input"
                />
              </div>
            </div>

            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th class="text-center">Previous Count</th>
                    <th class="text-center">System Count</th>
                    <th class="text-center">Actual Count</th>
                    <th class="text-center">Variance</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody
                  v-for="(items, categoryName) in groupedActiveItems"
                  :key="categoryName"
                >
                  <tr
                    class="category-row clickable"
                    @click="toggleCategory(categoryName)"
                  >
                    <td colspan="6" class="category-header font-bold">
                      <div class="flex items-center gap-1">
                        <ChevronDown
                          v-if="!collapsedCategories.has(categoryName)"
                          class="icon-sm"
                        />
                        <ChevronRight v-else class="icon-sm" />
                        {{ categoryName }}
                      </div>
                    </td>
                  </tr>
                  <tr
                    v-if="!collapsedCategories.has(categoryName)"
                    v-for="item in items"
                    :key="item.id"
                  >
                    <td data-label="Product">{{ item.productName }}</td>
                    <td
                      data-label="Previous Count"
                      class="text-center text-secondary"
                    >
                      {{
                        item.previousCount !== null &&
                        item.previousCount !== undefined
                          ? item.previousCount
                          : "-"
                      }}
                    </td>
                    <td data-label="System Count" class="text-center">
                      {{ item.systemCount }}
                    </td>
                    <td data-label="Actual Count" class="text-center">
                      <input
                        type="number"
                        v-model.number="item.actualCount"
                        @input="recalculateVariance(item)"
                        class="count-input center-align"
                        :disabled="isCompleted"
                      />
                    </td>
                    <td
                      data-label="Variance"
                      class="text-center"
                      :class="getVarianceClass(item.variance)"
                    >
                      <strong>{{
                        item.variance > 0 ? "+" + item.variance : item.variance
                      }}</strong>
                    </td>
                    <td data-label="Reason">
                      <input
                        v-if="item.variance !== 0"
                        type="text"
                        v-model="item.reason"
                        placeholder="Reason for discrepancy"
                        class="reason-input w-full"
                        :disabled="isCompleted"
                        required
                      />
                      <span v-else class="text-secondary">-</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div
            class="actions-footer flex justify-end gap-2 mt-4"
            v-if="!isCompleted"
          >
            <button
              @click="saveDraft"
              class="secondary-btn"
              :disabled="stockCountStore.loading"
            >
              Save Draft
            </button>
            <button
              @click="promptCompleteCount"
              class="primary-btn"
              :disabled="stockCountStore.loading"
            >
              Review & Complete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Custom Modal for Record Only Options -->
    <div v-if="showCompleteModal" class="modal-overlay">
      <div class="modal-content small-modal">
        <div class="modal-header">
          <h3 style="margin: 0; font-size: 1.25rem">Complete Stock Count</h3>
          <button class="close-btn" @click="showCompleteModal = false">
            ×
          </button>
        </div>
        <div style="margin-top: 1rem; margin-bottom: 1.5rem">
          <p>
            Are you sure you want to complete this stock count? You won't be
            able to edit it afterward.
          </p>

          <div v-if="varianceItems.length > 0" class="variance-summary mt-4">
            <h4 class="variance-title">Variance Discrepancies</h4>
            <div class="variance-list-scroll">
              <table class="variance-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th class="text-center">System</th>
                    <th class="text-center">Actual</th>
                    <th class="text-center">Var</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in varianceItems" :key="item.id">
                    <td>{{ item.productName }}</td>
                    <td class="text-center">{{ item.systemCount }}</td>
                    <td class="text-center">{{ item.actualCount }}</td>
                    <td
                      class="text-center"
                      :class="getVarianceClass(item.variance)"
                    >
                      {{
                        item.variance > 0 ? "+" + item.variance : item.variance
                      }}
                    </td>
                    <td class="variance-reason">{{ item.reason }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div v-else class="variance-summary no-variance mt-4">
            <p>No variances detected.</p>
          </div>
          <label
            style="
              display: flex;
              align-items: center;
              gap: 0.5rem;
              margin-top: 1.5rem;
              cursor: pointer;
              padding: 0.5rem;
              background: #f3f4f6;
              border-radius: 0.375rem;
            "
          >
            <input
              type="checkbox"
              v-model="isRecordOnly"
              style="width: 1.2rem; height: 1.2rem"
            />
            <span style="font-weight: 500"
              >Record only (Do not update system stock quantities)</span
            >
          </label>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 1rem">
          <button @click="showCompleteModal = false" class="secondary-btn">
            Cancel
          </button>
          <button @click="confirmCompleteCount" class="primary-btn">
            Confirm Completion
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useStockCountStore } from "../stores/stockCountStore";
import { useAuthStore } from "../stores/authStore";
import { useUserStore } from "../stores/userStore";
import { useDialogStore } from "../stores/dialogStore";
import { useCategoryStore } from "../stores/categoryStore";
import {
  ClipboardList,
  History,
  Edit3,
  Eye,
  Edit2,
  CheckCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-vue-next";

const stockCountStore = useStockCountStore();
const authStore = useAuthStore();
const userStore = useUserStore();
const dialogStore = useDialogStore();
const categoryStore = useCategoryStore();

const activeTab = ref("history");
const activeCount = ref(null);
const searchQuery = ref("");
const showCompleteModal = ref(false);
const isRecordOnly = ref(false);
const collapsedCategories = ref(new Set());

const isCompleted = computed(() => {
  return activeCount.value?.status === "completed";
});

const varianceItems = computed(() => {
  if (!activeCount.value) return [];
  return activeCount.value.items.filter((item) => item.variance !== 0);
});

onMounted(async () => {
  await stockCountStore.fetchStockCounts();
  if (userStore.users.length === 0) {
    try {
      await userStore.fetchUsers(); // Loads users if not loaded to map user IDs
    } catch (e) {}
  }
  if (categoryStore.categories.length === 0) {
    try {
      await categoryStore.fetchCategories({ limit: 1000 });
    } catch (e) {}
  }
});

function getCategoryName(id) {
  if (!id) return "Uncategorized";
  const cat = categoryStore.categories.find((c) => c.id === id);
  return cat ? cat.name : "Uncategorized";
}

const groupedActiveItems = computed(() => {
  if (!activeCount.value) return {};

  let items = activeCount.value.items || [];

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    items = items.filter((i) =>
      (i.productName || "").toLowerCase().includes(q),
    );
  }

  const groups = {};
  for (const item of items) {
    const catName = getCategoryName(item.productCategory);
    if (!groups[catName]) groups[catName] = [];
    groups[catName].push(item);
  }

  return groups;
});

function toggleCategory(categoryName) {
  if (collapsedCategories.value.has(categoryName)) {
    collapsedCategories.value.delete(categoryName);
  } else {
    collapsedCategories.value.add(categoryName);
  }
}

function isLatestCount(countId) {
  if (!stockCountStore.stockCounts || stockCountStore.stockCounts.length === 0)
    return false;
  return stockCountStore.stockCounts[0].id === countId;
}

function formatDateWithoutTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toISOString().split("T")[0];
}

function getUserName(userId) {
  if (!userId) return null;
  const user = userStore.users.find((u) => u.id === userId);
  return user ? user.username : null;
}

function recalculateVariance(item) {
  item.variance = (item.actualCount || 0) - item.systemCount;
}

function getVarianceClass(variance) {
  if (variance > 0) return "text-success";
  if (variance < 0) return "text-danger";
  return "";
}

async function startNewCount() {
  const payload = {
    counted_by: authStore.currentUser?.id,
    count_date: new Date().toISOString().split("T")[0],
  };
  const result = await stockCountStore.startStockCount(payload);
  if (result && result.id) {
    await viewCount({ id: result.id });
  }
}

async function viewCount(countSummary) {
  const fullDetails = await stockCountStore.fetchStockCount(countSummary.id);
  activeCount.value = JSON.parse(JSON.stringify(fullDetails)); // deep copy so we can edit
  activeCount.value.countDate = formatDateWithoutTime(
    activeCount.value.countDate,
  ); // prep date picker

  // Initialize actual count if empty
  activeCount.value.items.forEach((item) => {
    if (item.actualCount === null || item.actualCount === undefined) {
      item.actualCount = item.systemCount;
    }
    recalculateVariance(item);
  });

  activeTab.value = "active";
}

function validateCount() {
  for (const item of activeCount.value.items) {
    if (item.variance !== 0 && (!item.reason || item.reason.trim() === "")) {
      dialogStore.alert(`Reason is required for product: ${item.productName}`);
      return false;
    }
  }
  return true;
}

async function saveDraft() {
  if (!activeCount.value) return;
  const payload = {
    status: "draft",
    notes: activeCount.value.notes,
    items: activeCount.value.items,
  };
  await stockCountStore.updateStockCount(activeCount.value.id, payload);
  dialogStore.success("Draft saved successfully.");
  await stockCountStore.fetchStockCounts();
}

function promptCompleteCount() {
  if (!activeCount.value) return;
  if (!validateCount()) return;
  isRecordOnly.value = false;
  showCompleteModal.value = true;
}

async function confirmCompleteCount() {
  showCompleteModal.value = false;

  const notesSuffix = isRecordOnly.value
    ? " (Record Only Auto-Reconciled)"
    : "";
  const baseNotes = activeCount.value.notes
    ? activeCount.value.notes.trim()
    : "";
  const finalNotes = baseNotes
    ? `${baseNotes}${notesSuffix}`
    : notesSuffix.trim();

  const payload = {
    status: "completed",
    notes: finalNotes,
    items: activeCount.value.items,
  };

  await stockCountStore.updateStockCount(activeCount.value.id, payload);

  if (isRecordOnly.value) {
    await stockCountStore.reconcileStockCount(activeCount.value.id, {
      user_id: authStore.currentUser?.id,
      recordOnly: true,
    });
    dialogStore.success(
      "Stock count completed & recorded successfully without updating stock quantities.",
    );
  } else {
    dialogStore.success(
      "Stock count completed! You can now reconcile the differences.",
    );
  }

  await stockCountStore.fetchStockCounts();
  activeTab.value = "history";
  activeCount.value = null;
}

async function confirmReconcile(count) {
  const msg =
    "Are you sure you want to reconcile this stock count? This will update the LIVE SYSTEM STOCK quantites to match the counted amounts and your user ID will be recorded as the authorizer. This action cannot be undone.";
  if (!(await dialogStore.confirm(msg))) return;

  const payload = {
    user_id: authStore.currentUser?.id,
  };

  try {
    await stockCountStore.reconcileStockCount(count.id, payload);
    dialogStore.success("Stock successfully reconciled!");
    await stockCountStore.fetchStockCounts();
  } catch (e) {
    dialogStore.error("Failed to reconcile: " + e.message);
  }
}
</script>

<style scoped>
.stock-counts {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .stock-counts {
    padding: 1rem;
  }

  .tabs {
    flex-wrap: nowrap;
    padding-bottom: 0.5rem;
  }

  .tab {
    min-width: 120px;
    padding: 0.75rem 1rem;
    font-size: var(--font-size-sm);
  }

  .notes-group {
    grid-column: span 1 !important;
  }

  .form-section {
    padding: 1rem !important;
  }

  .table-container {
    border: none;
    box-shadow: none;
    background: transparent;
  }

  table,
  thead,
  tbody,
  th,
  td,
  tr {
    display: block;
  }

  thead tr {
    position: absolute;
    top: -9999px;
    left: -9999px;
  }

  tbody tr {
    background: var(--bg-white, #fff);
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    margin-bottom: 1rem;
    padding: 0.5rem 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  tbody tr.category-row {
    background: transparent;
    border: none;
    box-shadow: none;
    padding: 0;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
  }

  tbody tr.category-row td {
    border: none;
    border-bottom: 2px solid #e5e7eb;
    padding: 0 0 0.5rem 0 !important;
    text-align: left !important;
    font-size: 1.1rem;
    min-height: auto;
    color: var(--text-color, #333);
  }

  tbody tr.category-row td::before {
    content: none;
  }

  td {
    border: none;
    border-bottom: 1px solid #f3f4f6;
    position: relative;
    padding: 0.75rem 1rem 0.75rem 40% !important;
    text-align: right !important;
    min-height: 40px;
  }

  td:last-child {
    border-bottom: 0;
  }

  td::before {
    content: attr(data-label);
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    font-weight: 600;
    color: #4b5563;
    text-align: left;
    white-space: nowrap;
  }

  .text-center,
  .center-align {
    text-align: right !important;
  }

  .actions {
    justify-content: flex-end;
    width: 100%;
    display: flex;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  margin: 0;
  color: var(--text-color, #333);
}

.header-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--primary-color, #2563eb);
}

.tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid var(--border-color);
  margin-bottom: var(--spacing-lg);
  padding-bottom: 0;
  overflow-x: auto;
}

.tab {
  flex: none;
  padding: 1rem 1.5rem;
  background: transparent;
  border: none;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  font-weight: 500;
  font-size: 1rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s;
  min-width: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.tab:hover {
  background: var(--bg-hover);
}

.tab.active {
  background: var(--primary-gradient);
  color: var(--text-white);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h2 {
  font-size: 1.25rem;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.add-btn {
  padding: 0.3rem 1rem;
  background: var(--primary-gradient);
  color: var(--text-white);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.add-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.icon-sm {
  width: 16px;
  height: 16px;
}

.text-center {
  text-align: center;
}
.center-align {
  text-align: center;
}

.manage-btn:hover {
  color: #10b981;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: capitalize;
}

.status-badge.draft {
  background-color: #fef3c7;
  color: #92400e;
}
.status-badge.completed {
  background-color: #d1fae5;
  color: #065f46;
}

.discrepancy-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-block;
}
.discrepancy-badge.yes {
  background-color: #fee2e2;
  color: #991b1b;
}
.discrepancy-badge.no {
  background-color: #f3f4f6;
  color: #374151;
}

.text-success {
  color: #059669;
}
.text-danger {
  color: #dc2626;
}

.count-input {
  width: 80px;
  padding: 0.25rem;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-sm);
  background-color: var(--bg-white);
  transition: border-color 0.2s;
}

.reason-input {
  width: 100%;
  padding: 0.25rem 0.5rem;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-sm);
  background-color: var(--bg-white);
  font-size: 0.85rem;
  transition: border-color 0.2s;
}

.count-input:focus,
.reason-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.count-input:disabled,
.reason-input:disabled {
  background-color: #f8fafc;
  cursor: not-allowed;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.25rem;
}
.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  display: block;
  padding: 0.5rem;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: var(--font-size-sm);
  background-color: var(--bg-white);
  color: var(--text-primary);
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input:disabled,
.form-group textarea:disabled {
  background-color: #f8fafc;
  cursor: not-allowed;
  color: var(--text-secondary);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.notes-group {
  grid-column: span 2;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-section {
  background: var(--bg-white);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  width: 100%;
}

.count-details-section {
  border-left: 4px solid var(--primary-color);
}

.count-items-section {
  border-top: 1px solid var(--border-color);
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  width: 1.25rem;
  height: 1.25rem;
  color: var(--text-secondary);
}

.search-input {
  padding-left: 2.75rem !important;
}

.flex {
  display: flex;
}
.justify-end {
  justify-content: flex-end;
}
.gap-2 {
  gap: 0.5rem;
}
.mt-4 {
  margin-top: 1rem;
}
.w-full {
  width: 100%;
}

.primary-btn {
  background-color: var(--primary-color, #2563eb);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
}
.secondary-btn {
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
}
.primary-btn:disabled,
.secondary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.category-header {
  padding: 0.5rem 1rem;
  text-align: left;
  color: #374151;
}

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
  padding: 1rem;
}

.modal-content {
  background: var(--bg-white, #fff);
  border-radius: var(--radius-xl, 1rem);
  padding: 2rem;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.3s ease;
  max-height: 90vh;
  overflow-y: auto;
}

.small-modal {
  max-width: 500px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary, #64748b);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  font-size: 1.5rem;
  line-height: 1;
}

.close-btn:hover {
  background: #f1f5f9;
  color: #1e293b;
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

.clickable {
  cursor: pointer;
}

.items-center {
  display: flex;
  align-items: center;
}

.gap-1 {
  gap: 0.25rem;
}

.variance-summary {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin-top: 1rem;
}

.variance-title {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #374151;
}

.variance-list-scroll {
  max-height: 250px;
  overflow-y: auto;
  border: 1px solid #f3f4f6;
  border-radius: 0.375rem;
}

.variance-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.variance-table th {
  position: sticky;
  top: 0;
  background: #f3f4f6;
  padding: 0.5rem;
  text-align: left;
  border-bottom: 2px solid #e5e7eb;
}

.variance-table td {
  padding: 0.5rem;
  border-bottom: 1px solid #f3f4f6;
}

.variance-reason {
  color: #6b7280;
  font-style: italic;
  font-size: 0.8rem;
}

.no-variance {
  text-align: center;
  color: #6b7280;
  padding: 1rem;
}

.history-notes-col {
  min-width: 200px;
}

.history-notes-cell {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #6b7280;
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .history-notes-cell {
    max-width: none;
    white-space: normal;
    text-align: right !important;
  }
}
</style>
