<template>
  <div class="sales-container">
    <div class="header">
      <h1>
        <Receipt class="header-icon" />
        Sales History
      </h1>
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
      <div v-for="dailySales in salesByDate" :key="dailySales.date" class="day-group">
        <div class="day-header" @click="toggleDay(dailySales.date)">
          <div class="day-info">
            <ChevronRight class="toggle-icon" :class="{ rotated: expandedDays.includes(dailySales.date) }" />
            <h2>{{ formatDate(dailySales.date) }}</h2>
            <span class="sales-count-badge">{{ dailySales.sales.length }}</span>
          </div>
          <div class="day-total">
            {{ formatCurrency(dailySales.total) }}
          </div>
        </div>

        <transition name="slide">
          <div v-if="expandedDays.includes(dailySales.date)" class="sales-list">
            <div 
              v-for="sale in dailySales.sales" 
              :key="sale.id" 
              class="sale-card"
              :class="{ expanded: expandedSale === sale.id }"
              @click.stop="toggleSale(sale.id)"
            >
              <div class="sale-summary">
                <div class="sale-main-info">
                  <span class="sale-id">#{{ sale.id }}</span>
                  <span class="sale-time">{{ formatTime(sale.createdAt) }}</span>
                </div>
                
                <div class="sale-meta">
                  <div class="payment-badge">
                    <component :is="getPaymentIcon(sale.payment_method)" class="icon-xs" />
                    {{ sale.payment_method }}
                  </div>
                  <span class="sale-amount">{{ formatCurrency(sale.total) }}</span>
                  <ChevronDown class="expand-icon" :class="{ rotated: expandedSale === sale.id }" />
                </div>
              </div>

              <transition name="slide">
                <div v-if="expandedSale === sale.id" class="sale-details-panel" @click.stop>
                  <div class="items-table-header">
                    <span>Item</span>
                    <span class="text-right">Qty</span>
                    <span class="text-right">Price</span>
                    <span class="text-right">Total</span>
                  </div>
                  <div class="items-list">
                    <div v-for="item in sale.items" :key="item.id || item.product_id" class="item-row">
                      <div class="item-name">{{ item.product_name || item.name || 'Unknown Item' }}</div>
                      <div class="item-qty text-right">{{ item.quantity }}</div>
                      <div class="item-price text-right">{{ formatCurrency(item.price) }}</div>
                      <div class="item-subtotal text-right">{{ formatCurrency(item.price * item.quantity) }}</div>
                    </div>
                    <div v-if="!sale.items || sale.items.length === 0" class="no-items">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Receipt, ChevronDown, ChevronRight, Banknote, CreditCard } from 'lucide-vue-next'
import { formatCurrency } from '../utils/currency'

const sales = ref([])
const loading = ref(false)
const error = ref(null)
const expandedSale = ref(null)
const expandedDays = ref([])

// Group sales by date
const salesByDate = computed(() => {
  const grouped = {}
  
  sales.value.forEach(sale => {
    const date = new Date(sale.createdAt).toDateString()
    if (!grouped[date]) {
      grouped[date] = {
        date,
        sales: [],
        total: 0
      }
    }
    grouped[date].sales.push(sale)
    grouped[date].total += sale.total
  })

  return Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date))
})

function toggleDay(date) {
  if (expandedDays.value.includes(date)) {
    expandedDays.value = expandedDays.value.filter(d => d !== date)
  } else {
    expandedDays.value.push(date)
  }
}

function toggleSale(id) {
  expandedSale.value = expandedSale.value === id ? null : id
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }
}

function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit'
  })
}

function getPaymentIcon(method) {
  return method === 'cash' ? Banknote : CreditCard
}

async function fetchSales() {
  loading.value = true
  error.value = null
  try {
    const response = await fetch('/api/sales')
    if (!response.ok) throw new Error('Failed to fetch sales')
    sales.value = await response.json()
    
    // Auto-expand today
    const today = new Date().toDateString()
    if (salesByDate.value.some(g => g.date === today)) {
      expandedDays.value.push(today)
    }
  } catch (err) {
    error.value = err.message
    console.error('Error fetching sales:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSales()
})
</script>

<style scoped>
.sales-container {
  padding: var(--spacing-xl);
  max-width: 1400px; 
  margin: 0 auto;
}

.header {
  margin-bottom: 2rem;
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
  to { transform: rotate(360deg); }
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
  border: 1px solid var(--border-color);
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

/* Sales List */
.sales-list {
  border-top: 1px solid var(--border-color);
  background: var(--bg-hover);
}

.sale-card {
  border-bottom: 1px solid var(--border-color);
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
  border-bottom: 1px solid var(--border-color);
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
  border-bottom: 1px dashed var(--border-color);
}

.item-row:last-child {
  border-bottom: none;
}

.item-name {
  flex: 1;
  color: var(--text-primary);
  font-weight: 500;
}

.item-qty, .item-price, .item-subtotal {
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
