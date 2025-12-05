<template>
  <div class="sales-summary">
    <div class="header">
      <TrendingUp class="header-icon" />
      <h1>Sales Summary - {{ currentDateFormatted }}</h1>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      Loading today's sales...
    </div>

    <div v-else class="summary-grid">
      <!-- Total Sales Card -->
      <div class="summary-card primary">
        <DollarSign class="card-icon" />
        <div class="card-content">
          <h3>Total Sales Today</h3>
          <p class="amount">{{ formatCurrency(todayStats.totalSales) }}</p>
          <span class="detail">{{ todayStats.transactionCount }} transactions</span>
        </div>
      </div>

      <!-- Cash Sales Card -->
      <div class="summary-card">
        <Banknote class="card-icon" />
        <div class="card-content">
          <h3>Cash Sales</h3>
          <p class="amount">{{ formatCurrency(todayStats.cashSales) }}</p>
          <span class="detail">{{ todayStats.cashCount }} transactions</span>
        </div>
      </div>

      <!-- Card Sales Card -->
      <div class="summary-card">
        <CreditCard class="card-icon" />
        <div class="card-content">
          <h3>Card Sales</h3>
          <p class="amount">{{ formatCurrency(todayStats.cardSales) }}</p>
          <span class="detail">{{ todayStats.cardCount }} transactions</span>
        </div>
      </div>

      <!-- Average Transaction Card -->
      <div class="summary-card">
        <TrendingUp class="card-icon" />
        <div class="card-content">
          <h3>Average Transaction</h3>
          <p class="amount">{{ formatCurrency(todayStats.averageTransaction) }}</p>
          <span class="detail">per sale</span>
        </div>
      </div>
    </div>

    <!-- Recent Sales List -->
    <div v-if="!loading && todaySales.length > 0" class="recent-sales">
      <h2>Recent Sales</h2>
      <div class="sales-list">
        <div v-for="sale in todaySales.slice(0, 10)" :key="sale.id" class="sale-item">
          <div class="sale-info">
            <span class="sale-id">#{{ sale.id }}</span>
            <span class="sale-time">{{ formatTime(sale.createdAt || sale.created_at) }}</span>
          </div>
          <div class="sale-details">
            <span class="payment-method">
              <component :is="getPaymentIcon(sale.paymentMethod || sale.payment_method)" class="icon-xs" />
              {{ sale.paymentMethod || sale.payment_method }}
            </span>
            <span class="sale-amount">{{ formatCurrency(sale.total) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="!loading && todaySales.length === 0" class="empty-state">
      <Receipt class="empty-icon" />
      <h3>No Sales Today</h3>
      <p>Sales made today will appear here</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { TrendingUp, DollarSign, Banknote, CreditCard, Receipt } from 'lucide-vue-next'
import { formatCurrency } from '../utils/currency'

const todaySales = ref([])
const loading = ref(false)

const currentDateFormatted = computed(() => {
  return new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
})

const todayStats = computed(() => {
  const stats = {
    totalSales: 0,
    cashSales: 0,
    cardSales: 0,
    cashCount: 0,
    cardCount: 0,
    transactionCount: 0,
    averageTransaction: 0
  }

  todaySales.value.forEach(sale => {
    stats.totalSales += sale.total
    stats.transactionCount++
    
    const paymentMethod = sale.paymentMethod || sale.payment_method
    if (paymentMethod === 'cash') {
      stats.cashSales += sale.total
      stats.cashCount++
    } else {
      stats.cardSales += sale.total
      stats.cardCount++
    }
  })

  stats.averageTransaction = stats.transactionCount > 0 
    ? stats.totalSales / stats.transactionCount 
    : 0

  return stats
})

function formatTime(dateString) {
  if (!dateString) return ''
  if (typeof dateString === 'string') {
    dateString = dateString.replace(' ', 'T')
  }
  return new Date(dateString).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit'
  })
}

function getPaymentIcon(method) {
  return method === 'cash' ? Banknote : CreditCard
}

async function fetchTodaySales() {
  loading.value = true
  try {
    const response = await fetch('/api/sales')
    if (!response.ok) throw new Error('Failed to fetch sales')
    
    const allSales = await response.json()
    
    // Filter to today's sales only
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    todaySales.value = allSales.filter(sale => {
      let dateStr = sale.createdAt || sale.created_at
      if (dateStr && typeof dateStr === 'string') {
        dateStr = dateStr.replace(' ', 'T')
      }
      const saleDate = new Date(dateStr)
      return saleDate.toDateString() === today.toDateString()
    }).sort((a, b) => {
      let dateA = a.createdAt || a.created_at
      let dateB = b.createdAt || b.created_at
      if (dateA && typeof dateA === 'string') {
        dateA = dateA.replace(' ', 'T')
      }
      if (dateB && typeof dateB === 'string') {
        dateB = dateB.replace(' ', 'T')
      }
      return new Date(dateB) - new Date(dateA)
    })
    
  } catch (err) {
    console.error('Error fetching sales:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTodaySales()
})
</script>

<style scoped>
.sales-summary {
  padding: var(--spacing-xl);
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header h1 {
  margin: 0;
  font-size: var(--font-size-2xl);
  color: var(--text-primary);
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

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: var(--bg-white);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  gap: 1rem;
  border: var(--border-width) solid var(--border-color);
  transition: transform 0.2s, box-shadow 0.2s;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.summary-card.primary {
  background: var(--primary-gradient);
  color: var(--text-white);
  border: none;
}

.summary-card.primary h3,
.summary-card.primary .amount,
.summary-card.primary .detail {
  color: var(--text-white);
}

.card-icon {
  width: 40px;
  height: 40px;
  color: var(--primary-color);
  flex-shrink: 0;
}

.summary-card.primary .card-icon {
  color: var(--text-white);
  opacity: 0.9;
}

.card-content {
  flex: 1;
}

.card-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.amount {
  font-size: var(--font-size-2xl);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.detail {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.recent-sales {
  background: var(--bg-white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
}

.recent-sales h2 {
  margin: 0 0 1rem 0;
  font-size: var(--font-size-lg);
  font-weight: 500;
  color: var(--text-primary);
}

.sales-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.sale-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  background: var(--bg-hover);
  border-radius: var(--radius-md);
  border: var(--border-width) solid var(--border-color);
}

.sale-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.sale-id {
  font-family: monospace;
  color: var(--text-secondary);
  font-weight: 500;
}

.sale-time {
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.sale-details {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.payment-method {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  text-transform: capitalize;
}

.icon-xs {
  width: 14px;
  height: 14px;
}

.sale-amount {
  font-weight: 600;
  color: var(--text-primary);
  font-size: var(--font-size-lg);
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

@media (max-width: 768px) {
  .sales-summary {
    padding: var(--spacing-lg);
  }
  
  .header h1 {
    font-size: var(--font-size-xl);
  }
  
  .header-icon {
    width: 24px;
    height: 24px;
  }

  .summary-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .summary-card {
    padding: 1rem;
  }
  
  .card-icon {
    width: 32px;
    height: 32px;
  }
  
  .card-content h3 {
    font-size: var(--font-size-xs);
  }
  
  .amount {
    font-size: var(--font-size-xl);
  }
  
  .detail {
    font-size: var(--font-size-xs);
  }
  
  .recent-sales {
    padding: 1rem;
  }
  
  .recent-sales h2 {
    font-size: var(--font-size-lg);
  }

  .sale-item {
    padding: 0.75rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .sale-time {
    font-size: var(--font-size-xs);
  }
  
  .payment-method {
    font-size: var(--font-size-xs);
  }

  .sale-details {
    width: 100%;
    justify-content: space-between;
  }
  
  .sale-amount {
    font-size: var(--font-size-lg);
    align-self: flex-end;
  }
}
</style>
