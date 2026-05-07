<template>
  <div class="financials">
    <div class="header">
      <h1>
        <DollarSign class="header-icon" />
        Financial Management
      </h1>
      <button
        @click="downloadReport"
        class="download-report-btn"
        :disabled="!summary"
      >
        <Download class="icon-sm" />
        Download Report
      </button>
    </div>

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
      <div v-show="activeTab === 'summary'" class="tab-panel">
        <div class="summary-section" v-if="summary">
          <!-- Quick Stats -->
          <div class="summary-grid">
            <div class="summary-card revenue">
              <TrendingUp class="card-icon-bg" />
              <h3>Total Revenue</h3>
              <p class="amount">{{ formatCurrency(summary.total_revenue) }}</p>
              <span class="detail"
                >{{ summary.sales_count }} sales recorded</span
              >
            </div>
            <div class="summary-card success">
              <Activity class="card-icon-bg" />
              <h3>Gross Profit</h3>
              <p class="amount">{{ formatCurrency(summary.gross_profit) }}</p>
              <span class="detail"
                >{{ formatCurrency(summary.total_cogs) }} cost of goods</span
              >
            </div>
            <div class="summary-card warning">
              <FileText class="card-icon-bg" />
              <h3>Total Outflow</h3>
              <p class="amount">
                {{
                  formatCurrency(
                    summary.total_stock_purchases + summary.total_expenses,
                  )
                }}
              </p>
              <span class="detail">Purchases + Expenses</span>
            </div>
            <div
              class="summary-card profit"
              :class="{ negative: summary.net_profit < 0 }"
            >
              <Wallet class="card-icon-bg" />
              <h3>Net Profit (Cash Flow)</h3>
              <p class="amount">{{ formatCurrency(summary.net_profit) }}</p>
              <span class="detail"
                >{{ summary.profit_margin.toFixed(1) }}% margin</span
              >
            </div>
          </div>

          <!-- Charts Section -->
          <div class="charts-grid">
            <!-- Revenue Trend -->
            <div class="chart-card large">
              <h3>Revenue Performance</h3>
              <div class="trend-chart-container">
                <div
                  v-if="summary.daily_trends.length > 0"
                  class="mini-trend-chart"
                >
                  <div
                    v-for="(day, idx) in normalizedDailyTrends"
                    :key="idx"
                    class="trend-bar-wrapper"
                    :title="`${day.date}: ${formatCurrency(day.revenue)}`"
                  >
                    <div
                      class="trend-bar"
                      :style="{ height: `calc(${day.height}% + 4px)` }"
                    >
                      <span class="bar-amount">{{
                        formatCurrency(day.revenue)
                      }}</span>
                      <span class="tooltip">{{
                        formatCurrency(day.revenue)
                      }}</span>
                    </div>
                    <span class="bar-label">{{
                      formatDateShort(day.date)
                    }}</span>
                  </div>
                </div>
                <div v-else class="empty-chart">
                  No trend data available for this period.
                </div>
              </div>
            </div>

            <!-- Payment Breakdown -->
            <div class="chart-card">
              <h3>Payments Breakdown</h3>
              <div class="payment-stats">
                <div
                  v-for="item in summary.payment_breakdown"
                  :key="item.method"
                  class="payment-stat-item"
                >
                  <div class="payment-info">
                    <span class="payment-method-name">{{
                      formatMethod(item.method)
                    }}</span>
                    <span class="payment-value">{{
                      formatCurrency(item.total)
                    }}</span>
                  </div>
                  <div class="progress-bar-bg">
                    <div
                      class="progress-bar-fill"
                      :class="item.method"
                      :style="{
                        width: `${(item.total / summary.total_revenue) * 100}%`,
                      }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Top Products Section -->
          <div class="performance-sections">
            <div class="perf-card">
              <h3>
                <Trophy class="icon-sm text-warning" />
                Top 5 Products (Quantity)
              </h3>
              <div class="mini-list">
                <div
                  v-for="p in summary.top_products.by_quantity"
                  :key="p.id"
                  class="mini-list-item"
                >
                  <span class="pa-name">{{ p.name }}</span>
                  <span class="pa-value badge-blue"
                    >{{ p.quantity }} units</span
                  >
                </div>
              </div>
            </div>
            <div class="perf-card">
              <h3>
                <Sparkles class="icon-sm text-success" />
                Top 5 Products (Profit)
              </h3>
              <div class="mini-list">
                <div
                  v-for="p in summary.top_products.by_profit"
                  :key="p.id"
                  class="mini-list-item"
                >
                  <span class="pa-name">{{ p.name }}</span>
                  <span class="pa-value badge-green">{{
                    formatCurrency(p.profit)
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Comprehensive Product Table -->
          <div class="detailed-analytics-section">
            <div class="section-header-row">
              <h2>Product Performance Details</h2>
              <div class="table-legend">
                <span class="legend-item"
                  ><span class="dot active"></span> Active</span
                >
                <span class="legend-item"
                  ><span class="dot inactive"></span> Inactive</span
                >
              </div>
            </div>

            <!-- Active Products -->
            <div class="table-container-modern shadow-sm">
              <h3>Active Products (Sold in Period)</h3>
              <div class="responsive-table-wrapper">
                <table class="modern-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th class="text-center">Opening</th>
                      <th class="text-center">Sold</th>
                      <th class="text-center">Remaining</th>
                      <th class="text-right">Price</th>
                      <th class="text-right">Total Value</th>
                      <th class="text-right">Gross Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="pa in summary.product_analytics.active"
                      :key="pa.id"
                    >
                      <td class="font-medium sticky-col">{{ pa.name }}</td>
                      <td class="text-center">{{ pa.openingQuantity }}</td>
                      <td class="text-center font-bold text-primary">
                        {{ pa.soldQuantity }}
                      </td>
                      <td
                        class="text-center"
                        :class="{ 'text-danger': pa.closingQuantity < 5 }"
                      >
                        {{ pa.closingQuantity }}
                      </td>
                      <td class="text-right">{{ formatCurrency(pa.price) }}</td>
                      <td class="text-right font-medium">
                        {{ formatCurrency(pa.soldAmount) }}
                      </td>
                      <td class="text-right text-success font-bold">
                        {{ formatCurrency(pa.profit) }}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="total-row">
                      <td colspan="5">Total Performance</td>
                      <td class="text-right">
                        {{ formatCurrency(summary.total_revenue) }}
                      </td>
                      <td class="text-right">
                        {{ formatCurrency(summary.gross_profit) }}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- Inactive Products -->
            <div class="table-container-modern inactive-group">
              <button
                @click="showInactive = !showInactive"
                class="toggle-inactive-btn"
              >
                {{ showInactive ? "Hide" : "Show" }} Inactive Products ({{
                  summary.product_analytics.inactive.length
                }})
                <ChevronDown v-if="!showInactive" class="icon-xs" />
                <ChevronUp v-else class="icon-xs" />
              </button>

              <div v-if="showInactive" class="inactive-table-wrapper">
                <table class="modern-table dimmed">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th class="text-center">Current Stock</th>
                      <th class="text-right">Expected Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="pa in summary.product_analytics.inactive"
                      :key="pa.id"
                    >
                      <td class="sticky-col">{{ pa.name }}</td>
                      <td class="text-center">{{ pa.closingQuantity }}</td>
                      <td class="text-right opacity-70">
                        {{ formatCurrency(pa.closingQuantity * pa.price) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
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

        <DataListing
          :data="purchaseOrders"
          :columns="purchaseOrderColumns"
          @rowClick="togglePO"
          :expandedKeys="expandedPOs"
          rowKey="id"
        >
          <template #cell-expand="{ item }">
            <button class="expand-btn">
              <ChevronDown
                v-if="!expandedPOs.includes(item.id)"
                class="icon-sm"
              />
              <ChevronUp v-else class="icon-sm" />
            </button>
          </template>

          <template #cell-date="{ item }">
            {{ formatDate(item.createdAt) }}
          </template>

          <template #cell-supplier="{ item }">
            {{ getSupplierName(item.supplierId) }}
          </template>

          <template #cell-status="{ item }">
            <span class="status-badge" :class="item.status">{{
              item.status
            }}</span>
          </template>

          <template #cell-notes="{ item }">
            <div class="notes-cell" :title="item.notes">
              {{ item.notes || "-" }}
            </div>
          </template>

          <template #cell-products="{ item }">
            <span class="item-count-badge">{{ item.itemCount || 0 }}</span>
          </template>

          <template #cell-total="{ item }">
            {{ formatCurrency(item.total || item.computedTotal || 0) }}
          </template>

          <template #cell-actions="{ item }">
            <div class="actions" @click.stop>
              <button
                v-if="item.status === 'pending'"
                @click="handleReceivePO(item.id)"
                class="action-btn receive-btn"
                title="Mark Received"
              >
                <Package class="icon-sm" />
              </button>
              <button
                @click="handleDeletePurchaseOrder(item.id)"
                class="action-btn delete-btn"
              >
                <Trash2 class="icon-sm" />
              </button>
            </div>
          </template>

          <template #expandedRow="{ item }">
            <div class="items-view-container" @click.stop>
              <div class="items-header">
                <h3>Order Items</h3>
                <button
                  @click.stop="openAddItemModal(item)"
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
                  <tr v-for="poItem in poItems[item.id]" :key="poItem.id">
                    <td>{{ poItem.productName }}</td>
                    <td>{{ poItem.quantity }}</td>
                    <td>{{ formatCurrency(poItem.cost) }}</td>
                    <td>
                      {{ formatCurrency(poItem.quantity * poItem.cost) }}
                    </td>
                  </tr>
                  <tr v-if="!poItems[item.id]?.length">
                    <td colspan="4" class="empty-items">
                      No items found for this order.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>

          <template #empty>
            No purchase orders found for this period.
          </template>

          <template #pagination>
            <PaginationControls
              v-if="purchaseOrdersPagination.total > 0"
              :current-page="purchaseOrdersPagination.page"
              :total-pages="purchaseOrdersPagination.totalPages"
              :total="purchaseOrdersPagination.total"
              :limit="purchaseOrdersPagination.limit"
              @page-change="handlePurchaseOrdersPageChange"
            />
          </template>
        </DataListing>
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

        <DataListing :data="expenses" :columns="expenseColumns" rowKey="id">
          <template #cell-date="{ item }">
            {{ formatJustDate(item.incurredDate || item.createdAt) }}
          </template>

          <template #cell-category="{ item }">
            <span class="category-badge">{{ item.category }}</span>
          </template>

          <template #cell-description="{ item }">
            {{ item.description }}
          </template>

          <template #cell-amount="{ item }">
            {{ formatCurrency(item.amount) }}
          </template>

          <template #cell-actions="{ item }">
            <div class="actions">
              <template v-if="item.category !== 'Borrowed Items'">
                <button
                  @click="handleEditExpense(item)"
                  class="action-btn edit-btn"
                >
                  <Edit2 class="icon-sm" />
                </button>
                <button
                  @click="handleDeleteExpense(item.id)"
                  class="action-btn delete-btn"
                >
                  <Trash2 class="icon-sm" />
                </button>
              </template>
              <span v-else class="managed-badge">Managed Automatically</span>
            </div>
          </template>

          <template #empty> No expenses found for this period. </template>

          <template #pagination>
            <PaginationControls
              v-if="expensesPagination.total > 0"
              :current-page="expensesPagination.page"
              :total-pages="expensesPagination.totalPages"
              :total="expensesPagination.total"
              :limit="expensesPagination.limit"
              @page-change="handleExpensesPageChange"
            />
          </template>
        </DataListing>
      </div>
    </div>

    <ExpenseModal
      v-if="showExpenseModal"
      :expense="editingExpense"
      :isSubmitting="isSavingExpense"
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
      :isSubmitting="isSavingPO"
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
import DataListing from "../components/DataListing.vue";
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
  Download,
  Activity,
  TrendingUp,
  Trophy,
  Sparkles,
} from "lucide-vue-next";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
const purchaseOrderColumns = [
  { key: "expand", label: "", primary: false },
  { key: "date", label: "Date", primary: true },
  { key: "supplier", label: "Supplier" },
  { key: "status", label: "Status", align: "center" },
  { key: "notes", label: "Notes" },
  { key: "products", label: "Products", align: "center" },
  { key: "total", label: "Total", align: "right" },
  { key: "actions", label: "Actions", align: "right" },
];

const expenseColumns = [
  { key: "date", label: "Date", primary: true },
  { key: "category", label: "Category" },
  { key: "description", label: "Description" },
  { key: "amount", label: "Amount", align: "right" },
  { key: "actions", label: "Actions", align: "right" },
];
const startDate = ref(new Date().toISOString().split("T")[0]);
const endDate = ref(new Date().toISOString().split("T")[0]);
const showExpenseModal = ref(false);
const showPurchaseOrderModal = ref(false);
const editingExpense = ref(null);
const isSavingPO = ref(false);
const isSavingExpense = ref(false);

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
const showInactive = ref(false);

const normalizedDailyTrends = computed(() => {
  if (
    !summary.value ||
    !summary.value.daily_trends ||
    summary.value.daily_trends.length === 0
  )
    return [];
  const maxRev = Math.max(
    ...summary.value.daily_trends.map((t) => t.revenue),
    1,
  );
  return summary.value.daily_trends.map((t) => ({
    ...t,
    height: (t.revenue / maxRev) * 100,
  }));
});

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

function formatJustDate(dateString) {
  if (!dateString) return "N/A";
  if (typeof dateString === "string" && dateString.includes(" ")) {
    dateString = dateString.replace(" ", "T");
  }
  return new Date(dateString).toLocaleDateString();
}

function formatMethod(method) {
  if (!method) return "Unknown";
  if (method.toLowerCase() === "cash") return "Cash";
  if (method.toLowerCase() === "mpesa") return "M-Pesa";
  return method.charAt(0).toUpperCase() + method.slice(1);
}

function formatDateShort(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}
function downloadReport() {
  if (!summary.value) return;

  const doc = new jsPDF();
  const start = startDate.value;
  const end = endDate.value;

  // Header and Branding
  doc.setFontSize(22);
  doc.setTextColor(102, 126, 234);
  doc.text("Business Performance Report", 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Period: ${start} to ${end}`, 14, 30);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 35);

  // Summary Metrics Section
  doc.setFillColor(248, 250, 252);
  doc.rect(14, 45, 182, 40, "F");

  doc.setFontSize(12);
  doc.setTextColor(50, 50, 50);
  doc.setFont(undefined, "bold");
  doc.text("Key Metrics", 20, 55);

  doc.setFont(undefined, "normal");
  doc.setFontSize(10);
  doc.text(
    `Total Revenue: ${formatCurrency(summary.value.total_revenue)}`,
    20,
    65,
  );
  doc.text(
    `Gross Profit: ${formatCurrency(summary.value.gross_profit)}`,
    20,
    75,
  );

  doc.text(
    `Total Expenses: ${formatCurrency(summary.value.total_expenses)}`,
    85,
    65,
  );
  doc.text(
    `Stock Purchases: ${formatCurrency(summary.value.total_stock_purchases)}`,
    85,
    75,
  );

  doc.setFont(undefined, "bold");
  doc.text(
    `Net Profit (Cash Flow): ${formatCurrency(summary.value.net_profit)}`,
    140,
    65,
  );
  doc.text(
    `Profit Margin: ${summary.value.profit_margin.toFixed(2)}%`,
    140,
    75,
  );

  // Performance Table
  doc.setFontSize(14);
  doc.setTextColor(102, 126, 234);
  doc.text("Product Performance Details", 14, 100);

  const tableColumn = [
    "Product",
    "Opening",
    "Sold",
    "Closing",
    "Price",
    "Revenue",
    "Profit",
  ];
  const tableRows = summary.value.product_analytics.active.map((pa) => [
    pa.name,
    pa.openingQuantity,
    pa.soldQuantity,
    pa.closingQuantity,
    formatCurrency(pa.price),
    formatCurrency(pa.soldAmount),
    formatCurrency(pa.profit),
  ]);

  // Aggregated totals row for the table
  tableRows.push([
    {
      content: "TOTALS",
      colSpan: 5,
      styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
    },
    {
      content: formatCurrency(summary.value.total_revenue),
      styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
    },
    {
      content: formatCurrency(summary.value.gross_profit),
      styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
    },
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 105,
    theme: "grid",
    headStyles: { fillColor: [102, 126, 234], textColor: 255 },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { halign: "center" },
      2: { halign: "center" },
      3: { halign: "center" },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
    },
  });

  doc.save(`performance-report-${start}-${end}.pdf`);
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
  isSavingExpense.value = true;
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
  } finally {
    isSavingExpense.value = false;
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
  isSavingPO.value = true;
  try {
    await financeStore.addPurchaseOrder(poData);
    showPurchaseOrderModal.value = false;
    fetchData();
    dialogStore.success("Purchase order created successfully");
  } catch (error) {
    dialogStore.error("Failed to save purchase order: " + error.message);
  } finally {
    isSavingPO.value = false;
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

// Remove watch to only fetch on button click as requested
/*
watch([startDate, endDate], () => {
  fetchData();
});
*/

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
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.download-report-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background: var(--bg-white);
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.download-report-btn:hover:not(:disabled) {
  background: var(--primary-color);
  color: white;
  transform: translateY(-1px);
}

.download-report-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Enhanced Summary Cards */
.summary-card {
  position: relative;
  overflow: hidden;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.card-icon-bg {
  position: absolute;
  right: -10px;
  bottom: -10px;
  width: 80px;
  height: 80px;
  opacity: 0.1;
  transform: rotate(-15deg);
}

.summary-card.success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
}
.summary-card.warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
}
.summary-card.revenue {
  background: var(--primary-gradient);
  color: white;
  border: none;
}
.summary-card.profit {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  border: none;
}
.summary-card.profit.negative {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.summary-card h3 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.9;
  margin-bottom: 0.5rem;
}
.summary-card .amount {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
}
.summary-card .detail {
  font-size: 0.75rem;
  opacity: 0.8;
  margin-top: 0.25rem;
}

/* Charts Layout */
.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.chart-card {
  background: var(--bg-white);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
}

.chart-card h3 {
  margin-bottom: 1.5rem;
  font-size: 1rem;
  color: var(--text-secondary);
  font-weight: 600;
}

/* Custom CSS Trend Chart */
.trend-chart-container {
  height: 250px;
  display: flex;
  align-items: flex-end;
  padding-bottom: 2rem;
}

.mini-trend-chart {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  width: 100%;
  height: 100%;
}

.trend-bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  position: relative;
}

.trend-bar {
  width: 100%;
  background: var(--primary-color);
  background: linear-gradient(to top, var(--primary-color), #818cf8);
  border-radius: 4px 4px 0 0;
  transition: all 0.3s ease;
  position: relative;
  min-height: 4px;
  display: flex;
  justify-content: center;
}

.bar-amount {
  position: absolute;
  top: -20px;
  font-size: 9px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.trend-bar:hover {
  background: var(--secondary-color);
  transform: scaleX(1.1);
}

.trend-bar .tooltip {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
  white-space: nowrap;
}

.trend-bar:hover .tooltip {
  opacity: 1;
}

.bar-label {
  font-size: 9px;
  color: var(--text-secondary);
  position: absolute;
  bottom: -20px;
  transform: rotate(-45deg);
  white-space: nowrap;
}

.empty-chart {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary);
  font-style: italic;
}

/* Payment Stats */
.payment-stats {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.payment-stat-item {
  width: 100%;
}
.payment-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.payment-method-name {
  font-weight: 500;
  font-size: 0.9rem;
}
.payment-value {
  font-weight: 600;
  color: var(--primary-color);
}
.progress-bar-bg {
  height: 8px;
  background: #f1f5f9;
  border-radius: 4px;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  border-radius: 4px;
}
.progress-bar-fill.cash {
  background: #10b981;
}
.progress-bar-fill.mpesa {
  background: #3b82f6;
}

/* Top Products Mini Lists */
.performance-sections {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}
.perf-card {
  background: var(--bg-white);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  border: 1px solid var(--border-color);
}
.perf-card h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
}
.mini-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.mini-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #edf2f7;
}
.pa-name {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-primary);
}
.pa-value {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
}
.badge-blue {
  background: #dbeafe;
  color: #1e40af;
}
.badge-green {
  background: #dcfce7;
  color: #166534;
}

/* Modern Tables */
.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 2.5rem 0 1rem 0;
}
.section-header-row h2 {
  font-size: 1.25rem;
  margin: 0;
  color: var(--text-primary);
}
.table-legend {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.dot.active {
  background: var(--primary-color);
}
.dot.inactive {
  background: #94a3b8;
}

.detailed-analytics-section {
  width: 100%;
  margin-top: 2rem;
}

.table-container-modern {
  background: var(--bg-white);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  overflow-x: auto; /* Enable horizontal scroll on this container */
  margin-bottom: 1.5rem;
  -webkit-overflow-scrolling: touch;
}

.modern-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  min-width: 800px; /* Force minimum width to ensure readability */
}

.modern-table th {
  background: white;
  padding: 1rem 1.5rem;
  text-align: left;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 2px solid var(--border-color);
}
.modern-table td {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
}
.modern-table tr:last-child td {
  border-bottom: none;
}
.modern-table tbody tr:hover {
  background: #fdfdfd;
}
.modern-table.dimmed {
  opacity: 0.8;
}
.total-row {
  background: #f8fafc;
  font-weight: 700;
}
.total-row td {
  border-top: 2px solid var(--border-color);
}

.responsive-table-wrapper {
  overflow-x: auto;
  width: 100%;
}

.sticky-col {
  position: sticky;
  left: 0;
  background: white;
  z-index: 1;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.05);
}

.modern-table tr:hover .sticky-col {
  background: #fdfdfd;
}

.text-center {
  text-align: center;
}
.text-right {
  text-align: right;
}
.font-medium {
  font-weight: 500;
}
.font-bold {
  font-weight: 700;
}
.text-primary {
  color: var(--primary-color);
}
.text-success {
  color: #059669;
}
.text-danger {
  color: #dc2626;
}

/* Inactive Group Styles */
.inactive-group {
  border-style: dashed;
  border-color: #cbd5e1;
}
.toggle-inactive-btn {
  width: 100%;
  padding: 1rem;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.toggle-inactive-btn:hover {
  color: var(--primary-color);
  background: #f8fafc;
}
.inactive-table-wrapper {
  border-top: 1px dashed #cbd5e1;
}

@media (max-width: 1024px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .performance-sections {
    grid-template-columns: 1fr;
  }
  .summary-grid {
    grid-template-columns: 1fr 1fr;
  }
  .modern-table {
    font-size: 0.8rem;
  }
  .modern-table th,
  .modern-table td {
    padding: 0.75rem;
  }
}

@media (max-width: 480px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}

.financials {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.financials h1 {
  color: var(--text-primary);
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

.summary-card h3 {
  margin: 0 0 0.5rem 0;
  color: var(--text-white);
  font-size: 0.9rem;
  text-transform: uppercase;
}

.summary-card .amount {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
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
  background: var(--bg-hover);
  color: var(--text-secondary);
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 500;
}

.managed-badge {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-style: italic;
  white-space: nowrap;
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
