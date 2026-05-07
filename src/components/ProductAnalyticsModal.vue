<template>
  <div class="modal-overlay" @click.stop="$emit('close')">
    <div class="modal-content" :class="{ 'wide-modal': multipleProducts }" @click.stop>
      <div class="modal-header">
        <h2>
          <BarChart3 class="header-icon" />
          Product Sales Analytics
        </h2>
        <div class="header-actions">
          <button v-if="data" class="btn-export" @click="exportToExcel" :disabled="isExporting">
            <Download class="icon-sm" v-if="!isExporting" />
            <RefreshCw class="icon-sm spin" v-else />
            {{ isExporting ? 'Exporting...' : 'Export Excel' }}
          </button>
          <button class="close-btn" @click="$emit('close')">
            <X class="icon" />
          </button>
        </div>
      </div>

      <div class="modal-body">
        <div class="analytics-filters">
          <div class="filter-row">
            <div class="filter-group">
              <label>Date Range</label>
              <div class="date-inputs">
                <div class="input-field">
                  <span class="input-label">Start Date</span>
                  <input type="date" v-model="filters.startDate" class="form-input" />
                </div>
                <div class="input-field">
                  <span class="input-label">End Date</span>
                  <input type="date" v-model="filters.endDate" class="form-input" />
                </div>
              </div>
            </div>
          </div>

          <div class="filter-row">
            <div class="filter-group">
              <label>Select Product (Optional - Leave blank for all)</label>
              <SearchableSelect
                v-model="filters.productId"
                :options="productOptions"
                placeholder="All Products"
                label-key="name"
                value-key="id"
              />
            </div>
          </div>

          <div class="filter-actions">
            <button class="btn-primary" @click="fetchAnalytics" :disabled="loading">
              <RefreshCw class="icon-sm" :class="{ spin: loading }" v-if="loading" />
              <Search class="icon-sm" v-else />
              {{ loading ? 'Analyzing...' : 'Generate Analytics' }}
            </button>
          </div>
        </div>

        <div v-if="error" class="error-msg">
          {{ error }}
        </div>

        <div v-if="data" class="analytics-content">
          <!-- Single Product View -->
          <div v-if="!multipleProducts" class="single-product-view">
            <div class="results-header">
              <h3>{{ data.product.name }}</h3>
              <span class="barcode-badge" v-if="data.product.barcode">{{ data.product.barcode }}</span>
            </div>

            <div class="metrics-grid">
              <div class="metric-card opening">
                <div class="metric-label">Opening Quantity</div>
                <div class="metric-value">{{ data.analytics.openingQuantity }}</div>
                <div class="metric-info">Quantity as at {{ formatDate(filters.startDate) }}</div>
              </div>

              <div class="metric-card sales">
                <div class="metric-label">Quantity Sold</div>
                <div class="metric-value">- {{ data.analytics.soldQuantity }}</div>
                <div class="metric-info">Total Revenue: {{ formatCurrency(data.analytics.soldAmount) }}</div>
              </div>

              <div class="metric-card purchases">
                <div class="metric-label">Purchases</div>
                <div class="metric-value">+ {{ data.analytics.purchasedQuantity }}</div>
                <div class="metric-info">Total Cost: {{ formatCurrency(data.analytics.purchasedAmount) }}</div>
              </div>

              <div class="metric-card closing">
                <div class="metric-label">Closing Quantity</div>
                <div class="metric-value">{{ data.analytics.closingQuantity }}</div>
                <div class="metric-info">Calculated for {{ formatDate(filters.endDate) }}</div>
              </div>
            </div>

            <div class="reconciliation-panel">
              <h4>Reconciliation Summary</h4>
              <div class="recon-row">
                <span class="label">System Balance:</span>
                <span class="value">{{ data.analytics.closingQuantity }} Units</span>
              </div>
              <div class="recon-row highlight">
                <span class="label">Total Amount Expected:</span>
                <span class="value">{{ formatCurrency(data.analytics.soldAmount) }}</span>
              </div>
            </div>
          </div>

          <!-- Multiple Products View -->
          <div v-else class="multiple-products-view">
            <div class="summary-banner">
                <div class="summary-item">
                    <span class="label">Products Tracked:</span>
                    <span class="value">{{ data.products.length }}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Total Period Revenue:</span>
                    <span class="value">{{ formatCurrency(totalPeriodRevenue) }}</span>
                </div>
            </div>

            <div class="products-list-header">
                <span class="col-product">Product</span>
                <span class="col-qty">Opening</span>
                <span class="col-qty">Sold</span>
                <span class="col-qty">Purchased</span>
                <span class="col-qty">Closing</span>
                <span class="col-amount">Revenue</span>
                <span class="col-expand"></span>
            </div>

            <div class="products-list">
                <div v-for="item in data.products" :key="item.product.id" class="product-item-group">
                    <div class="product-item-row" @click="toggleProductExpand(item.product.id)">
                        <div class="col-product">
                            <span class="p-name">{{ item.product.name }}</span>
                            <span class="p-barcode" v-if="item.product.barcode">{{ item.product.barcode }}</span>
                        </div>
                        <div class="col-qty">{{ item.analytics.openingQuantity }}</div>
                        <div class="col-qty text-danger">-{{ item.analytics.soldQuantity }}</div>
                        <div class="col-qty text-success">+{{ item.analytics.purchasedQuantity }}</div>
                        <div class="col-qty font-bold">{{ item.analytics.closingQuantity }}</div>
                        <div class="col-amount">{{ formatCurrency(item.analytics.soldAmount) }}</div>
                        <div class="col-expand">
                            <ChevronDown class="icon-xs" :class="{ rotated: expandedProducts.includes(item.product.id) }" />
                        </div>
                    </div>
                    
                    <transition name="slide">
                        <div v-if="expandedProducts.includes(item.product.id)" class="product-item-details">
                            <div class="details-grid">
                                <div class="detail-box">
                                    <span class="label">Opening ({{ formatDate(filters.startDate) }})</span>
                                    <span class="value">{{ item.analytics.openingQuantity }}</span>
                                </div>
                                <div class="detail-box">
                                    <span class="label">Sales in Period</span>
                                    <span class="value">{{ item.analytics.soldQuantity }} Units ({{ formatCurrency(item.analytics.soldAmount) }})</span>
                                </div>
                                <div class="detail-box">
                                    <span class="label">Purchases in Period</span>
                                    <span class="value">{{ item.analytics.purchasedQuantity }} Units ({{ formatCurrency(item.analytics.purchasedAmount) }})</span>
                                </div>
                                <div class="detail-box">
                                    <span class="label">Closing ({{ formatDate(filters.endDate) }})</span>
                                    <span class="value">{{ item.analytics.closingQuantity }} Units</span>
                                </div>
                            </div>
                        </div>
                    </transition>
                </div>
            </div>
          </div>
        </div>

        <div v-else-if="!loading && !data" class="empty-results">
          <Info class="icon-lg" />
          <p>Configure filters and generate analytics to get started.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { X, BarChart3, Search, RefreshCw, Info, Download, ChevronDown } from 'lucide-vue-next';
import SearchableSelect from './SearchableSelect.vue';
import { apiGet } from '../utils/api';
import { formatCurrency } from '../utils/currency';
import { useProductStore } from '../stores/productStore';
import * as XLSX from 'xlsx';

const emit = defineEmits(['close']);

const productStore = useProductStore();
const productOptions = ref([]);
const loading = ref(false);
const isExporting = ref(false);
const error = ref(null);
const data = ref(null);
const expandedProducts = ref([]);

const today = new Date().toISOString().split('T')[0];
const filters = ref({
  startDate: today,
  endDate: today,
  productId: null
});

const multipleProducts = computed(() => data.value && data.value.products);

const totalPeriodRevenue = computed(() => {
    if (!multipleProducts.value) return 0;
    return data.value.products.reduce((sum, item) => sum + item.analytics.soldAmount, 0);
});

async function loadProducts() {
  try {
    const products = await productStore.getAllProducts();
    productOptions.value = products.map(p => ({
      ...p,
      subLabel: p.barcode ? `Barcode: ${p.barcode}` : `Price: ${formatCurrency(p.price)}`
    }));
  } catch (err) {
    console.error('Failed to load products:', err);
  }
}

async function fetchAnalytics() {
  loading.value = true;
  error.value = null;
  data.value = null;
  expandedProducts.value = [];

  try {
    let url = `/api/reports/product-analytics?start_date=${filters.value.startDate}&end_date=${filters.value.endDate}`;
    if (filters.value.productId) {
        url += `&product_id=${filters.value.productId}`;
    }
    
    const response = await apiGet(url);
    const result = await response.json();

    if (!response.ok) throw new Error(result.error || 'Failed to fetch analytics');
    
    data.value = result;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

function toggleProductExpand(productId) {
    if (expandedProducts.value.includes(productId)) {
        expandedProducts.value = expandedProducts.value.filter(id => id !== productId);
    } else {
        expandedProducts.value.push(productId);
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function exportToExcel() {
    if (!data.value) return;
    isExporting.value = true;
    
    try {
        const exportData = [];
        const items = multipleProducts.value ? data.value.products : [data.value];
        
        items.forEach(item => {
            exportData.push({
                'Product Name': item.product.name,
                'Barcode': item.product.barcode || 'N/A',
                'Opening Qty': item.analytics.openingQuantity,
                'Sold Qty': item.analytics.soldQuantity,
                'Sold Amount': item.analytics.soldAmount,
                'Purchased Qty': item.analytics.purchasedQuantity,
                'Purchased Amount': item.analytics.purchasedAmount,
                'Closing Qty': item.analytics.closingQuantity
            });
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Product Analytics');
        
        const fileName = `Product_Analytics_${filters.value.startDate}_to_${filters.value.endDate}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    } catch (err) {
        console.error('Export failed:', err);
    } finally {
        isExporting.value = false;
    }
}

onMounted(() => {
  loadProducts();
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
  width: 95%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  overflow-y: auto;
}

.modal-content.wide-modal {
    max-width: 1100px;
}

@keyframes slideIn {
  from { transform: translateY(20px) scale(0.95); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.header-icon {
  width: 28px;
  height: 28px;
  color: var(--primary-color);
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: var(--bg-hover);
  color: var(--danger-bg);
}

.btn-export {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: white;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-export:hover:not(:disabled) {
    background: var(--bg-hover);
    border-color: var(--primary-color);
}

.analytics-filters {
  background: var(--bg-hover, #f8fafc);
  padding: 1.5rem;
  border-radius: var(--radius-lg, 12px);
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  border: 1px solid var(--border-color, #e2e8f0);
}

.filter-row {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.filter-group {
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--text-primary);
}

.date-inputs {
  display: flex;
  gap: 1rem;
}

.input-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.input-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-input {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: var(--radius-md, 8px);
  font-size: 0.9rem;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, background-color 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--primary-dark, #4f46e5);
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Single View */
.results-header {
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.results-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-primary);
}

.barcode-badge {
  background: #e2e8f0;
  color: #475569;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-family: monospace;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.metric-card {
  padding: 1.25rem;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: transform 0.2s;
}

.metric-card:hover {
  transform: translateY(-2px);
}

.metric-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.opening { border-left: 4px solid #94a3b8; background: #f8fafc; }
.sales { border-left: 4px solid #f87171; background: #fef2f2; }
.sales .metric-value { color: #dc2626; }
.purchases { border-left: 4px solid #34d399; background: #ecfdf5; }
.purchases .metric-value { color: #059669; }
.closing { border-left: 4px solid #6366f1; background: #eef2ff; }
.closing .metric-value { color: #4f46e5; }

.reconciliation-panel {
  background: #ffffff;
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
}

.recon-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
}

.recon-row.highlight {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--primary-color);
}

/* Multiple View */
.summary-banner {
    display: flex;
    gap: 2rem;
    background: var(--primary-color);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    margin-bottom: 1.5rem;
}

.summary-item {
    display: flex;
    flex-direction: column;
}

.summary-item .label {
    font-size: 0.75rem;
    opacity: 0.8;
    text-transform: uppercase;
}

.summary-item .value {
    font-size: 1.25rem;
    font-weight: 700;
}

.products-list-header {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1.2fr 40px;
    padding: 0.75rem 1rem;
    background: #f1f5f9;
    font-size: 0.75rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    border-radius: 8px;
    margin-bottom: 0.5rem;
}

.products-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.product-item-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1.2fr 40px;
    padding: 0.875rem 1rem;
    background: white;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s;
}

.product-item-row:hover {
    border-color: var(--primary-color);
    background: #f8fafc;
}

.col-product {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    overflow: hidden;
}

.p-name {
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.p-barcode {
    font-size: 0.7rem;
    color: var(--text-secondary);
    font-family: monospace;
}

.col-qty { font-weight: 500; font-size: 0.9rem; }
.col-amount { font-weight: 600; color: var(--text-primary); text-align: right; margin-right: 0.5rem;}
.col-expand { display: flex; justify-content: center; color: #94a3b8; }

.icon-xs { width: 14px; height: 14px; transition: transform 0.2s;}
.icon-xs.rotated { transform: rotate(180deg); color: var(--primary-color); }

.text-danger { color: #ef4444; }
.text-success { color: #10b981; }
.font-bold { font-weight: 700; color: var(--primary-color); }

.product-item-details {
    margin: 0.25rem 0.5rem 0.75rem;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 0 0 8px 8px;
    border: 1px solid var(--border-color);
    border-top: none;
}

.details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.detail-box {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.detail-box .label { font-size: 0.75rem; color: #64748b; }
.detail-box .value { font-weight: 600; color: var(--text-primary); }

/* Transitions */
.slide-enter-active, .slide-leave-active { transition: all 0.3s ease; max-height: 200px; overflow: hidden; }
.slide-enter-from, .slide-leave-to { max-height: 0; opacity: 0; }

.empty-results {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.icon-lg {
  width: 48px;
  height: 48px;
  opacity: 0.2;
}

.error-msg {
  padding: 1rem;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 900px) {
    .products-list-header, .product-item-row {
        grid-template-columns: 2fr 1fr 1fr 1.2fr 40px;
    }
    .products-list-header .col-qty:nth-child(2),
    .products-list-header .col-qty:nth-child(4),
    .product-item-row .col-qty:nth-child(2),
    .product-item-row .col-qty:nth-child(4) {
        display: none;
    }
}

@media (max-width: 640px) {
  .modal-content {
    padding: 1.5rem;
  }
  .filter-row {
    flex-direction: column;
    gap: 1rem;
  }
  .date-inputs {
    flex-direction: column;
  }
  .metrics-grid {
    grid-template-columns: 1fr 1fr;
  }
  .products-list-header, .product-item-row {
        grid-template-columns: 1fr 1fr 40px;
  }
  .col-qty, .col-amount { display: none; }
  .product-item-row .col-qty:last-of-type { display: block; }
}
</style>
