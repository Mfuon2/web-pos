<template>
  <div class="dashboard">
    <div class="header">
      <LayoutDashboard class="header-icon" />
      <h1>Dashboard Overview</h1>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      Loading dashboard...
    </div>

    <div v-else class="dashboard-content">
      <!-- Summary Cards -->
      <div class="stats-grid">
        <div class="stat-card primary">
          <DollarSign class="stat-icon" />
          <div class="stat-content">
            <h3>Today's Revenue</h3>
            <p class="stat-value">{{ formatCurrency(stats.todayRevenue) }}</p>
            <span class="stat-detail">{{ stats.todaySales }} sales</span>
          </div>
        </div>

        <div class="stat-card">
          <TrendingUp class="stat-icon" />
          <div class="stat-content">
            <h3>This Month</h3>
            <p class="stat-value">{{ formatCurrency(stats.monthRevenue) }}</p>
            <span class="stat-detail">{{ stats.monthSales }} sales</span>
          </div>
        </div>

        <div class="stat-card">
          <Package class="stat-icon" />
          <div class="stat-content">
            <h3>Low Stock Items</h3>
            <p class="stat-value">{{ stats.lowStockCount }}</p>
            <span class="stat-detail">Need restocking</span>
          </div>
        </div>

        <div class="stat-card">
          <ShoppingCart class="stat-icon" />
          <div class="stat-content">
            <h3>Total Products</h3>
            <p class="stat-value">{{ stats.totalProducts }}</p>
            <span class="stat-detail">In inventory</span>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h2>Quick Actions</h2>
        <div class="actions-grid">
          <router-link to="/pos" class="action-card">
            <ShoppingCart class="action-icon" />
            <h3>New Sale</h3>
            <p>Process a transaction</p>
          </router-link>

          <router-link to="/inventory" class="action-card">
            <Package class="action-icon" />
            <h3>Manage Inventory</h3>
            <p>Add or update products</p>
          </router-link>

          <router-link to="/sales" class="action-card">
            <Receipt class="action-icon" />
            <h3>View Sales</h3>
            <p>Sales history & reports</p>
          </router-link>

          <router-link to="/financials" class="action-card">
            <Wallet class="action-icon" />
            <h3>Financials</h3>
            <p>Revenue & expenses</p>
          </router-link>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="recent-activity">
        <h2>Recent Sales</h2>
        <div v-if="recentSales.length > 0" class="activity-list">
          <div v-for="sale in recentSales.slice(0, 5)" :key="sale.id" class="activity-item">
            <div class="activity-info">
              <span class="activity-time">{{ formatTime(sale.created_at) }}</span>
              <span class="activity-desc">Sale #{{ sale.id }}</span>
            </div>
            <span class="activity-amount">{{ formatCurrency(sale.total) }}</span>
          </div>
        </div>
        <div v-else class="empty-state">
          <Receipt class="empty-icon" />
          <p>No recent sales</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { LayoutDashboard, DollarSign, TrendingUp, Package, ShoppingCart, Receipt, Wallet } from 'lucide-vue-next'
import { formatCurrency } from '../utils/currency'

const loading = ref(false)
const stats = ref({
  todayRevenue: 0,
  todaySales: 0,
  monthRevenue: 0,
  monthSales: 0,
  lowStockCount: 0,
  totalProducts: 0
})
const recentSales = ref([])

function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit'
  })
}

async function fetchDashboardData() {
  loading.value = true
  try {
    // Fetch sales data
    const salesRes = await fetch('/api/sales')
    const allSales = await salesRes.json()
    
    // Calculate today's stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todaySales = allSales.filter(sale => {
      const saleDate = new Date(sale.created_at)
      saleDate.setHours(0, 0, 0, 0)
      return saleDate.getTime() === today.getTime()
    })
    
    stats.value.todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0)
    stats.value.todaySales = todaySales.length
    
    // Calculate month stats
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthSales = allSales.filter(sale => {
      const saleDate = new Date(sale.created_at)
      return saleDate >= startOfMonth
    })
    
    stats.value.monthRevenue = monthSales.reduce((sum, sale) => sum + sale.total, 0)
    stats.value.monthSales = monthSales.length
    
    // Recent sales
    recentSales.value = allSales
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
    
    // Fetch products data
    const productsRes = await fetch('/api/products')
    const products = await productsRes.json()
    
    stats.value.totalProducts = products.length
    stats.value.lowStockCount = products.filter(p => p.stock < 10).length
    
  } catch (err) {
    console.error('Error fetching dashboard data:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
.dashboard {
  padding: 2rem;
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
  font-size: 2rem;
  color: var(--text-primary);
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

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: var(--bg-white);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 2px solid var(--border-color);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.stat-card.primary {
  background: var(--primary-gradient);
  color: var(--text-white);
  border: none;
}

.stat-card.primary h3,
.stat-card.primary .stat-value,
.stat-card.primary .stat-detail {
  color: var(--text-white);
}

.stat-icon {
  width: 40px;
  height: 40px;
  color: var(--primary-color);
  flex-shrink: 0;
}

.stat-card.primary .stat-icon {
  color: var(--text-white);
  opacity: 0.9;
}

.stat-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.stat-detail {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.quick-actions {
  background: var(--bg-white);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-md);
}

.quick-actions h2 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  color: var(--text-primary);
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.action-card {
  background: var(--bg-hover);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  text-decoration: none;
  color: var(--text-primary);
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.5rem;
}

.action-card:hover {
  border-color: var(--primary-color);
  background: var(--bg-white);
  transform: translateY(-2px);
}

.action-icon {
  width: 32px;
  height: 32px;
  color: var(--primary-color);
}

.action-card h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--text-primary);
}

.action-card p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.recent-activity {
  background: var(--bg-white);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-md);
}

.recent-activity h2 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  color: var(--text-primary);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.activity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--bg-hover);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.activity-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.activity-time {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.activity-desc {
  color: var(--text-primary);
  font-weight: 500;
}

.activity-amount {
  font-weight: 700;
  color: var(--text-primary);
  font-size: 1.1rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.empty-icon {
  width: 32px;
  height: 32px;
  opacity: 0.3;
  margin-bottom: 0.5rem;
}

@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;
  }

  .stats-grid,
  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
