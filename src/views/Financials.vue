<template>
  <div class="financials">
    <h1>
      <DollarSign class="header-icon" />
      Financial Management
    </h1>

    <div class="date-filter">
      <div class="month-label">
        <Calendar class="icon-md" />
        <h2>{{ currentMonthLabel }}</h2>
      </div>
      <div class="filter-controls">
        <div class="date-input">
          <label>Start Date:</label>
          <input v-model="startDate" type="date" />
        </div>
        <div class="date-input">
          <label>End Date:</label>
          <input v-model="endDate" type="date" />
        </div>
        <button @click="fetchData" class="filter-btn">Apply Filter</button>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="tabs">
      <button
        class="tab"
        :class="{ active: activeTab === 'summary' }"
        @click="activeTab = 'summary'"
      >
        <BarChart3 class="icon-sm" />
        Summary
      </button>
      <button
        class="tab"
        :class="{ active: activeTab === 'purchase-orders' }"
        @click="activeTab = 'purchase-orders'"
      >
        <Package class="icon-sm" />
        Purchase Orders
      </button>
      <button
        class="tab"
        :class="{ active: activeTab === 'expenses' }"
        @click="activeTab = 'expenses'"
      >
        <FileText class="icon-sm" />
        Expenses
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Summary Tab -->
      <div v-show="activeTab === 'summary'" class="tab-panel">
        <div class="summary-section" v-if="summary">
          <div class="summary-grid">
            <div class="summary-card revenue">
              <h3>Revenue</h3>
              <p class="amount">{{ formatCurrency(summary.total_revenue) }}</p>
            </div>
            <div class="summary-card">
              <h3>Stock Purchases</h3>
              <p class="amount">
                {{ formatCurrency(summary.total_stock_purchases) }}
              </p>
            </div>
            <div class="summary-card">
              <h3>Expenses</h3>
              <p class="amount">{{ formatCurrency(summary.total_expenses) }}</p>
            </div>
            <div class="summary-card profit">
              <h3>Net Profit</h3>
              <p class="amount" :class="{ negative: summary.net_profit < 0 }">
                {{ formatCurrency(summary.net_profit) }}
              </p>
            </div>
          </div>
          <div class="profit-formula">
            <p>
              <strong>Formula:</strong> Net Profit = Revenue - (Stock Purchases
              + Expenses)
            </p>
            <p class="formula-detail">
              ${{ summary.net_profit?.toFixed(2) || "0.00" }} = ${{
                summary.total_revenue?.toFixed(2) || "0.00"
              }}
              - (${{ summary.total_stock_purchases?.toFixed(2) || "0.00" }} +
              ${{ summary.total_expenses?.toFixed(2) || "0.00" }})
            </p>
          </div>
        </div>
      </div>

      <!-- Purchase Orders Tab -->
      <div v-show="activeTab === 'purchase-orders'" class="tab-panel">
        <div class="section-header">
          <h2>Purchase Orders</h2>
          <button @click="showPurchaseOrderModal = true" class="add-btn">
            + Add Purchase Order
          </button>
        </div>

        <div class="table-container">
          <table class="po-table">
            <thead>
              <tr>
                <th class="expand-col"></th>
                <th>Date</th>
                <th>Supplier</th>
                <th>Status</th>
                <th>Notes</th>
                <th class="center-text">Products</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="po in purchaseOrders" :key="po.id">
                <tr
                  :class="{ 'expanded-row': expandedPOs.includes(po.id) }"
                  @click="togglePO(po)"
                >
                  <td class="expand-col">
                    <button class="expand-btn">
                      <ChevronDown
                        v-if="!expandedPOs.includes(po.id)"
                        class="icon-sm"
                      />
                      <ChevronUp v-else class="icon-sm" />
                    </button>
                  </td>
                  <td>{{ formatDate(po.createdAt) }}</td>
                  <td>{{ getSupplierName(po.supplierId) }}</td>
                  <td>
                    <span class="status-badge" :class="po.status">{{
                      po.status
                    }}</span>
                  </td>
                  <td class="notes-cell">{{ po.notes || "-" }}</td>
                  <td class="center-text">
                    <span class="item-count-badge">{{
                      po.itemCount || 0
                    }}</span>
                  </td>
                  <td class="amount">
                    {{ formatCurrency(po.total || po.computedTotal || 0) }}
                  </td>
                  <td class="actions" @click.stop>
                    <button
                      v-if="po.status === 'pending'"
                      @click="handleReceivePO(po.id)"
                      class="action-btn receive-btn"
                      title="Mark Received"
                    >
                      <Package class="icon-sm" />
                    </button>
                    <button
                      @click="handleDeletePurchaseOrder(po.id)"
                      class="action-btn delete-btn"
                    >
                      <Trash2 class="icon-sm" />
                    </button>
                  </td>
                </tr>
                <!-- Secondary Row (Items) -->
                <tr v-if="expandedPOs.includes(po.id)" class="items-view-row">
                  <td colspan="8">
                    <div class="items-view-container">
                      <div class="items-header">
                        <h3>Order Items</h3>
                        <button
                          @click="openAddItemModal(po)"
                          class="add-item-btn"
                        >
                          <Plus class="icon-xs" /> Add Product
                        </button>
                      </div>
                      <table class="items-table">
                        <thead>
                          <tr>
                            <th>Product Name</th>
                            <th>Quantity</th>
                            <th>Unit Cost</th>
                            <th>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="item in poItems[po.id]" :key="item.id">
                            <td>{{ item.productName }}</td>
                            <td>{{ item.quantity }}</td>
                            <td>{{ formatCurrency(item.cost) }}</td>
                            <td>
                              {{ formatCurrency(item.quantity * item.cost) }}
                            </td>
                          </tr>
                          <tr v-if="!poItems[po.id]?.length">
                            <td colspan="4" class="empty-items">
                              No items found for this order.
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              </template>
              <tr v-if="purchaseOrders.length === 0">
                <td colspan="8" class="empty-state">
                  No purchase orders found for this period.
                </td>
              </tr>
            </tbody>
          </table>
          <PaginationControls
            v-if="purchaseOrdersPagination.total > 0"
            :current-page="purchaseOrdersPagination.page"
            :total-pages="purchaseOrdersPagination.totalPages"
            :total="purchaseOrdersPagination.total"
            :limit="purchaseOrdersPagination.limit"
            @page-change="handlePurchaseOrdersPageChange"
          />
        </div>
      </div>

      <!-- Expenses Tab -->
      <div v-show="activeTab === 'expenses'" class="tab-panel">
        <div class="section-header">
          <h2>Expenses</h2>
          <button
            @click="
              showExpenseModal = true;
              editingExpense = null;
            "
            class="add-btn"
          >
            + Add Expense
          </button>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="expense in expenses" :key="expense.id">
                <td>{{ formatDate(expense.createdAt) }}</td>
                <td>
                  <span class="category-badge">{{ expense.category }}</span>
                </td>
                <td>{{ expense.description }}</td>
                <td class="amount">{{ formatCurrency(expense.amount) }}</td>
                <td class="actions">
                  <button
                    @click="handleEditExpense(expense)"
                    class="action-btn edit-btn"
                  >
                    <Edit2 class="icon-sm" />
                  </button>
                  <button
                    @click="handleDeleteExpense(expense.id)"
                    class="action-btn delete-btn"
                  >
                    <Trash2 class="icon-sm" />
                  </button>
                </td>
              </tr>
              <tr v-if="expenses.length === 0">
                <td colspan="5" class="empty-state">
                  No expenses found for this period.
                </td>
              </tr>
            </tbody>
          </table>
          <PaginationControls
            v-if="expensesPagination.total > 0"
            :current-page="expensesPagination.page"
            :total-pages="expensesPagination.totalPages"
            :total="expensesPagination.total"
            :limit="expensesPagination.limit"
            @page-change="handleExpensesPageChange"
          />
        </div>
      </div>
    </div>

    <ExpenseModal
      v-if="showExpenseModal"
      :expense="editingExpense"
      @close="
        showExpenseModal = false;
        editingExpense = null;
      "
      @save="handleSaveExpense"
    />

    <PurchaseOrderModal
      v-if="showPurchaseOrderModal"
      @close="showPurchaseOrderModal = false"
      @save="handleSavePurchaseOrder"
    />

    <!-- Add Item to PO Modal -->
    <div
      v-if="showAddItemModal"
      class="modal-overlay"
      @click="showAddItemModal = false"
    >
      <div class="modal-content small-modal" @click.stop>
        <div class="modal-header">
          <div class="header-title">
            <Plus class="icon-md" />
            <h2>Add Product to Order</h2>
          </div>
          <button class="close-btn" @click="showAddItemModal = false">
            <X class="icon-sm" />
          </button>
        </div>

        <form @submit.prevent="handleSaveItem">
          <div class="form-group">
            <label>Product</label>
            <select v-model="newItem.product_id" required>
              <option :value="null">Select Product</option>
              <option
                v-for="product in allProducts"
                :key="product.id"
                :value="product.id"
              >
                {{ product.name }}
              </option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Quantity</label>
              <input
                v-model.number="newItem.quantity"
                type="number"
                min="1"
                required
              />
            </div>
            <div class="form-group">
              <label>Cost per Unit</label>
              <input
                v-model.number="newItem.cost"
                type="number"
                step="0.01"
                required
              />
            </div>
          </div>

          <div class="modal-footer-simple">
            <button
              type="button"
              @click="showAddItemModal = false"
              class="secondary-btn"
            >
              Cancel
            </button>
            <button type="submit" class="submit-btn" :disabled="savingItem">
              {{ savingItem ? "Adding..." : "Add to Order" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useFinanceStore } from "../stores/financeStore";
import { useProductStore } from "../stores/productStore";
import ExpenseModal from "../components/ExpenseModal.vue";
import { useSupplierStore } from "../stores/supplierStore";
import PurchaseOrderModal from "../components/PurchaseOrderModal.vue";
import {
  Edit2,
  Trash2,
  DollarSign,
  BarChart3,
  Package,
  FileText,
  Calendar,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
} from "lucide-vue-next";
import { formatCurrency } from "../utils/currency";
import PaginationControls from "../components/PaginationControls.vue";

import { useDialogStore } from "../stores/dialogStore";

const financeStore = useFinanceStore();
const supplierStore = useSupplierStore();
const productStore = useProductStore();
const dialogStore = useDialogStore();
const summary = computed(() => financeStore.summary);
const expenses = computed(() => financeStore.expenses);
const purchaseOrders = computed(() => financeStore.purchaseOrders);
const suppliers = computed(() => supplierStore.suppliers);
const allProducts = computed(() => productStore.products);

const expensesPagination = computed(() => financeStore.expensesPagination);
const purchaseOrdersPagination = computed(
  () => financeStore.purchaseOrdersPagination,
);

const activeTab = ref("summary");
const startDate = ref(new Date().toISOString().split("T")[0]);
const endDate = ref(new Date().toISOString().split("T")[0]);
const showExpenseModal = ref(false);
const showPurchaseOrderModal = ref(false);
const editingExpense = ref(null);

// PO Expansion State
const expandedPOs = ref([]);
const poItems = ref({});
const showAddItemModal = ref(false);
const selectedPOForItems = ref(null);
const newItem = ref({
  product_id: null,
  quantity: 1,
  cost: "",
});
const savingItem = ref(false);

const currentMonthLabel = computed(() => {
  const date = new Date(startDate.value.replace(" ", "T"));
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
});

function formatDate(dateString) {
  if (!dateString) return "N/A";
  if (typeof dateString === "string") {
    dateString = dateString.replace(" ", "T");
  }
  return (
    new Date(dateString).toLocaleDateString() +
    " " +
    new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}

function getSupplierName(id) {
  const supplier = suppliers.value.find((s) => s.id === id);
  return supplier ? supplier.name : "Unknown Supplier";
}

async function fetchData() {
  await Promise.all([
    financeStore.fetchSummary(startDate.value, endDate.value),
    financeStore.fetchExpenses(startDate.value, endDate.value, 1, 20),
    financeStore.fetchPurchaseOrders(startDate.value, endDate.value, 1, 20),
    supplierStore.fetchSuppliers(),
    productStore.fetchProducts({ limit: 1000 }),
  ]);
}

async function togglePO(po) {
  const index = expandedPOs.value.indexOf(po.id);
  if (index > -1) {
    expandedPOs.value.splice(index, 1);
  } else {
    expandedPOs.value.push(po.id);
    if (!poItems.value[po.id]) {
      await fetchPOItems(po.id);
    }
  }
}

async function fetchPOItems(id) {
  try {
    const items = await financeStore.fetchPurchaseOrderItems(id);
    poItems.value[id] = items;
  } catch (error) {
    dialogStore.error("Failed to load items: " + error.message);
  }
}

function openAddItemModal(po) {
  selectedPOForItems.value = po;
  newItem.value = {
    product_id: null,
    quantity: 1,
    cost: "",
  };
  showAddItemModal.value = true;
}

async function handleSaveItem() {
  if (!newItem.value.product_id) return;

  savingItem.value = true;
  try {
    await financeStore.addPurchaseOrderItem(
      selectedPOForItems.value.id,
      newItem.value,
    );
    await fetchPOItems(selectedPOForItems.value.id);
    showAddItemModal.value = false;
    dialogStore.success("Item added to order");
  } catch (error) {
    dialogStore.error("Failed to add item: " + error.message);
  } finally {
    savingItem.value = false;
  }
}
async function handleReceivePO(id) {
  const confirmed = await dialogStore.confirm(
    "Mark this purchase order as received? This will update stock levels.",
  );
  if (confirmed) {
    try {
      await financeStore.markPurchaseOrderReceived(id);
      dialogStore.success("Purchase order received and stock updated");
      fetchData();
    } catch (error) {
      dialogStore.error("Failed to receive PO: " + error.message);
    }
  }
}

async function handleExpensesPageChange(page) {
  await financeStore.fetchExpenses(startDate.value, endDate.value, page, 20);
}

async function handlePurchaseOrdersPageChange(page) {
  await financeStore.fetchPurchaseOrders(
    startDate.value,
    endDate.value,
    page,
    20,
  );
}

function handleEditExpense(expense) {
  editingExpense.value = expense;
  showExpenseModal.value = true;
}

async function handleSaveExpense(expenseData) {
  try {
    if (editingExpense.value) {
      await financeStore.updateExpense(editingExpense.value.id, expenseData);
      dialogStore.success("Expense updated successfully");
    } else {
      await financeStore.addExpense(expenseData);
      dialogStore.success("Expense added successfully");
    }
    showExpenseModal.value = false;
    editingExpense.value = null;
    fetchData();
  } catch (error) {
    dialogStore.error("Failed to save expense: " + error.message);
  }
}

async function handleDeleteExpense(id) {
  const confirmed = await dialogStore.confirm(
    "Are you sure you want to delete this expense?",
  );
  if (confirmed) {
    try {
      await financeStore.deleteExpense(id);
      fetchData();
      dialogStore.success("Expense deleted successfully");
    } catch (error) {
      dialogStore.error("Failed to delete expense: " + error.message);
    }
  }
}

async function handleSavePurchaseOrder(poData) {
  try {
    await financeStore.addPurchaseOrder(poData);
    showPurchaseOrderModal.value = false;
    fetchData();
    dialogStore.success("Purchase order created successfully");
  } catch (error) {
    dialogStore.error("Failed to save purchase order: " + error.message);
  }
}

async function handleDeletePurchaseOrder(id) {
  const confirmed = await dialogStore.confirm(
    "Are you sure you want to delete this purchase order?",
  );
  if (confirmed) {
    try {
      await financeStore.deletePurchaseOrder(id);
      fetchData();
      dialogStore.success("Purchase order deleted successfully");
    } catch (error) {
      dialogStore.error("Failed to delete purchase order: " + error.message);
    }
  }
}

watch([startDate, endDate], () => {
  fetchData();
});

onMounted(() => {
  const date = new Date();
  // Set to first day of current month
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  // Adjust for timezone offset to ensure correct date string
  const offset = firstDay.getTimezoneOffset();
  const firstDayLocal = new Date(firstDay.getTime() - offset * 60 * 1000);
  startDate.value = firstDayLocal.toISOString().split("T")[0];

  // Set to last day of current month
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const lastDayLocal = new Date(lastDay.getTime() - offset * 60 * 1000);
  endDate.value = lastDayLocal.toISOString().split("T")[0];

  fetchData();
});
</script>

<style scoped>
.financials {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.financials h1 {
  color: var(--text-primary);
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-icon {
  width: 32px;
  height: 32px;
  color: var(--primary-color);
}

.icon-sm {
  width: 18px;
  height: 18px;
}

.icon-md {
  width: 24px;
  height: 24px;
  color: var(--primary-color);
}

/* Date Filter */
.date-filter {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: var(--bg-white);
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  flex-wrap: wrap;
  gap: 1.5rem;
}

.month-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.month-label h2 {
  margin: 0;
  color: var(--primary-color);
  font-size: 1.5rem;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.date-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-filter label {
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.date-filter input {
  padding: 0.5rem;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 1rem;
}

.date-filter input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.filter-btn {
  padding: 0.5rem 1.5rem;
  background: var(--primary-gradient);
  color: var(--text-white);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* Tabs */
.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  background: var(--bg-white);
  padding: 0.5rem;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow-x: auto;
  white-space: nowrap;
}

.tab {
  flex: 1;
  padding: 1rem 1.5rem;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
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
  color: var(--primary-color);
}

.tab.active {
  background: var(--primary-gradient);
  color: var(--text-white);
}

/* Tab Content */
.tab-content {
  min-height: 400px;
}

.tab-panel {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Summary Section */
.summary-section {
  margin-bottom: 2rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: var(--bg-white);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-md);
  transition: transform 0.3s;
  text-align: center;
}

.summary-card:hover {
  transform: translateY(-4px);
}

.summary-card.revenue {
  background: var(--primary-gradient);
  color: var(--text-white);
}

.summary-card.revenue h3 {
  color: var(--text-white);
}

.summary-card.profit {
  border: var(--border-width) solid var(--primary-color);
}

.summary-card h3 {
  margin: 0 0 0.5rem 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
  text-transform: uppercase;
}

.summary-card .amount {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
}

.summary-card.revenue .amount {
  color: var(--text-white);
}

.amount.negative {
  color: var(--danger-bg);
}

.profit-formula {
  background: var(--bg-white);
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  text-align: center;
}

.profit-formula p {
  margin: 0.5rem 0;
  color: var(--text-primary);
}

.formula-detail {
  font-family: "Courier New", monospace;
  color: var(--primary-color);
  font-weight: 600;
  word-break: break-all;
}

/* Section Headers */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-header h2 {
  margin: 0;
  color: var(--text-primary);
}

.add-btn {
  padding: 0.3rem 1rem;
  background: var(--primary-gradient);
  color: var(--text-white);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.empty-state {
  text-align: center;
  color: var(--text-secondary);
  font-style: italic;
  padding: 2rem !important;
}

/* Badges */
.category-badge {
  background: #edf2f7;
  color: var(--primary-color);
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-lg);
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-lg);
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status-badge.pending {
  background: var(--warning-bg);
  color: var(--warning-text);
}

.status-badge.received {
  background: var(--success-bg);
  color: var(--success-text);
}

.receive-btn {
  color: var(--success-text);
}

/* PO Tables */
.po-table tr {
  cursor: pointer;
}

.po-table tr:hover {
  background: #f8fafc;
}

.expand-col {
  width: 40px;
  padding: 0 !important;
  text-align: center;
}

.expand-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
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
  z-index: 2000;
  backdrop-filter: blur(4px);
  padding: 1rem;
}

.center-text {
  text-align: center;
}

.item-count-badge {
  background: #edf2f7;
  color: var(--primary-color);
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 700;
}

.notes-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Items View (Secondary Row) */
.items-view-row {
  background: #f8fafc !important;
}

.items-view-container {
  padding: 1rem 2rem 2rem 3rem;
  border-left: 4px solid var(--primary-color);
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.items-header h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--text-primary);
}

.add-item-btn {
  background: white;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s;
}

.add-item-btn:hover {
  background: var(--primary-color);
  color: white;
}

.items-table {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  min-width: unset;
}

.items-table th {
  background: #f1f5f9;
  color: #1e293b; /* Darker slate/black */
  font-size: 0.8rem;
  padding: 0.5rem 1rem;
  text-align: left;
}

.items-table td {
  padding: 0.5rem 1rem;
}

.empty-items {
  text-align: center;
  color: var(--text-secondary);
  font-style: italic;
  padding: 1rem !important;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.icon-xs {
  width: 14px;
  height: 14px;
}

.modal-content {
  background: var(--bg-white);
  border-radius: var(--radius-xl);
  padding: 2rem;
  width: 100%;
  max-width: 600px;
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
  margin-bottom: 2rem;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-title h2 {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.close-btn:hover {
  color: var(--danger-bg);
}

.form-group {
  margin-bottom: 1.25rem;
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
  font-size: var(--font-size-base);
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.modal-footer-simple {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.submit-btn {
  padding: 0.75rem 1.5rem;
  background: var(--primary-gradient);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.secondary-btn {
  padding: 0.75rem 1.5rem;
  background: white;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 600;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.secondary-btn:hover {
  background: var(--bg-hover);
  border-color: var(--text-secondary);
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

@media (max-width: 768px) {
  .financials {
    padding: 1rem;
  }
  .date-filter {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  .filter-controls {
    flex-direction: column;
    align-items: stretch;
  }
  .date-input {
    flex-direction: column;
    align-items: stretch;
  }
  .date-filter input {
    width: 100%;
  }
  .filter-btn {
    width: 100%;
  }
  .section-header {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }
  .add-btn {
    width: 100%;
  }
  .month-label {
    justify-content: center;
    margin-bottom: 0.5rem;
  }
}
</style>
