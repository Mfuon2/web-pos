<template>
  <div class="sales-summary">
    <div class="header">
      <h1>
        <TrendingUp class="header-icon" />
        Sales Summary - {{ currentDateFormatted }}
      </h1>
      <div class="header-actions">
        <div class="date-filter">
          <input type="date" v-model="selectedDate" @change="fetchSales" :max="todayDate" />
        </div>
        <button @click="downloadPDF" class="download-btn" :disabled="loading || salesItems.length === 0">
          <Download class="icon-sm" />
          Download Report
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      Loading sales...
    </div>

    <div v-else class="summary-grid">
      <!-- Total Sales Card -->
      <div class="summary-card primary">
        <DollarSign class="card-icon" />
        <div class="card-content">
          <h3>Total Sales</h3>
          <p class="amount">{{ formatCurrency(todayStats.totalSales) }}</p>
          <span class="detail">{{ todayStats.transactionCount }} transactions</span>
        </div>
      </div>

      <!-- Total Profit Card -->
      <div class="summary-card success">
        <TrendingUp class="card-icon" />
        <div class="card-content">
          <h3>Total Profit</h3>
          <p class="amount">{{ formatCurrency(todayStats.totalProfit) }}</p>
          <span class="detail">{{ formatCurrency(todayStats.totalCost) }} cost</span>
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
    </div>

    <!-- Detailed Sales Report -->
    <div v-if="!loading && salesItems.length > 0" class="report-section">
      <h2>Detailed Sales Report</h2>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Item Sold</th>
              <th class="center-align-text">Opening Qty</th>
              <th class="center-align-text">Sold Qty</th>
              <th class="center-align-text">Remaining Qty</th>
              <th class="right-align-text">Buying Price</th>
              <th class="right-align-text">Selling Price</th>
              <th class="right-align-text">Total Value (Sold Qty * Selling Price)</th>
              <th class="right-align-text">Profit</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in salesItems" :key="index">
              <td>{{ item.productName }}</td>
              <td class="center-align-text">{{ item.currentStock + item.quantity }}</td>
              <td class="center-align-text">{{ item.quantity }}</td>
              <td class="center-align-text">{{ item.currentStock }}</td>
              <td class="right-align-text">{{ formatCurrency(item.cost || 0) }}</td>
              <td class="right-align-text">{{ formatCurrency(item.price) }}</td>
              <td class="right-align-text">{{ formatCurrency(item.price * item.quantity) }}</td>
              <td class="profit">{{ formatCurrency((item.price - (item.cost || 0)) * item.quantity) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="grand-total">
              <td colspan="6"><strong>Totals</strong></td>
              <td class="right-align-text"><strong>{{ formatCurrency(todayStats.totalSales) }}</strong></td>
              <td class="profit"><strong>{{ formatCurrency(todayStats.totalProfit) }}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <div v-else-if="!loading && salesItems.length === 0" class="empty-state">
      <Receipt class="empty-icon" />
      <h3>No Sales Found</h3>
      <p>No sales records found for {{ currentDateFormatted }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { TrendingUp, DollarSign, Banknote, CreditCard, Receipt, Download } from 'lucide-vue-next'
import { formatCurrency } from '../utils/currency'
import { apiGet } from '../utils/api'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const todaySales = ref([])
const loading = ref(false)
const selectedDate = ref(new Date().toISOString().split('T')[0])
const todayDate = new Date().toISOString().split('T')[0]

const currentDateFormatted = computed(() => {
  const date = new Date(selectedDate.value)
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
})

const salesItems = computed(() => {
  const items = []
  todaySales.value.forEach(sale => {
    if (sale.items && Array.isArray(sale.items)) {
      sale.items.forEach(item => {
        items.push({
          ...item,
          saleId: sale.id,
          createdAt: sale.createdAt || sale.created_at
        })
      })
    }
  })
  return items
})

const todayStats = computed(() => {
  const stats = {
    totalSales: 0,
    totalCost: 0,
    totalProfit: 0,
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

    if (sale.items) {
      sale.items.forEach(item => {
        const cost = (item.cost || 0) * item.quantity
        const revenue = item.price * item.quantity
        stats.totalCost += cost
        stats.totalProfit += (revenue - cost)
      })
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

async function fetchSales() {
  loading.value = true
  try {
    const response = await apiGet('/api/sales')
    if (!response.ok) throw new Error('Failed to fetch sales')
    
    const allSales = await response.json()
    
    // Filter to selected date
    // Actually, selectedDate is YYYY-MM-DD string.
    // We can just compare the date string part of the sale date.
    
    todaySales.value = allSales.filter(sale => {
      let dateStr = sale.createdAt || sale.created_at
      if (dateStr && typeof dateStr === 'string') {
        dateStr = dateStr.replace(' ', 'T')
      }
      const saleDate = new Date(dateStr)
      return saleDate.toISOString().split('T')[0] === selectedDate.value
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

function downloadPDF() {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.text('Sales Summary Report', 14, 22)
  
  doc.setFontSize(11)
  doc.text(`Date: ${currentDateFormatted.value}`, 14, 32)
  
  // Summary Stats
  doc.setFillColor(240, 240, 240)
  doc.rect(14, 40, 182, 30, 'F')
  
  doc.setFontSize(12)
  doc.text('Summary', 20, 50)
  
  doc.setFontSize(10)
  doc.text(`Total Sales: ${formatCurrency(todayStats.value.totalSales)}`, 20, 60)
  doc.text(`Total Profit: ${formatCurrency(todayStats.value.totalProfit)}`, 80, 60)
  doc.text(`Transactions: ${todayStats.value.transactionCount}`, 140, 60)
  
  // Detailed Table
  const tableColumn = ["Item Sold", "Opening Qty", "Sold Qty", "Remaining Qty", "Buying Price", "Selling Price", "Total Value (Sold * Price)", "Profit"]
  const tableRows = []

  salesItems.value.forEach(item => {
    const rowData = [
      item.productName,
      (item.currentStock + item.quantity).toString(),
      item.quantity.toString(),
      item.currentStock.toString(),
      formatCurrency(item.cost || 0),
      formatCurrency(item.price),
      formatCurrency(item.price * item.quantity),
      formatCurrency((item.price - (item.cost || 0)) * item.quantity)
    ]
    tableRows.push(rowData)
  })

  // Add Totals Row
  tableRows.push([
    { content: 'Totals', colSpan: 6, styles: { fontStyle: 'bold' } },
    { content: formatCurrency(todayStats.value.totalSales), styles: { fontStyle: 'bold' } },
    { content: formatCurrency(todayStats.value.totalProfit), styles: { fontStyle: 'bold' } }
  ])

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 80,
    theme: 'grid',
    headStyles: { fillColor: [102, 126, 234], cellPadding: 2 },
    styles: { fontSize: 8, cellPadding: 2 }, // Compact PDF table
    columnStyles: {
      0: { cellWidth: 35 }, // Item Name
      1: { cellWidth: 15, halign: 'center' }, // Opening
      2: { cellWidth: 15, halign: 'center' }, // Sold
      3: { cellWidth: 15, halign: 'center' }, // Remaining
      4: { cellWidth: 20, halign: 'right' }, // Buying
      5: { cellWidth: 20, halign: 'right' }, // Selling
      6: { cellWidth: 30, halign: 'right' }, // Total
      7: { cellWidth: 20, halign: 'right' }  // Profit
    }
  })

  doc.save(`sales-summary-${selectedDate.value}.pdf`)
}

onMounted(() => {
  fetchSales()
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
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  margin: 0;
  font-size: var(--font-size-2xl);
  color: var(--text-primary);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.date-filter input {
  padding: 0.5rem;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  font-family: inherit;
  color: var(--text-primary);
  cursor: pointer;
}

.date-filter input:focus {
  outline: none;
  border-color: var(--primary-color);
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

.grand-total {
  font-weight: bolder;
  font-size: large;
  text-align: right;
  color: var(--text-success);
}

.right-align-text {
  font-weight: bold;
  text-align: right;
}

.center-align-text {
  text-align: center;
}

.profit {
  font-weight: bold;
  font-family: 'Courier New', Courier, monospace;
  text-align: right;
  color: var(--text-success);
}

.summary-card.success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: var(--text-white);
  border: none;
}

.summary-card.success h3,
.summary-card.success .amount,
.summary-card.success .detail {
  color: var(--text-white);
}

.summary-card.success .card-icon {
  color: var(--text-white);
  opacity: 0.9;
}

.card-content {
  flex: 1;
}

.card-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: var(--font-size-sm);
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

.download-btn {
  padding: 0.3rem 1.0rem;
  background: var(--bg-white);
  color: var(--text-primary);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
