<template>
  <div class="modal-overlay" @click.stop="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>
          <Download class="header-icon" />
          Export Sales Data
        </h2>
        <button class="close-btn" @click="$emit('close')">
          <X class="icon" />
        </button>
      </div>

      <div class="modal-body">
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

        <div class="filter-group">
          <label>Payment Method</label>
          <select v-model="filters.paymentMethod" class="form-input">
            <option value="all">All Methods</option>
            <option value="cash">Cash</option>
            <option value="mpesa">M-Pesa / Mobile Money</option>
          </select>
        </div>

        <div class="filter-group" v-if="isAdmin">
          <label>Payment Status</label>
          <select v-model="filters.paymentStatus" class="form-input">
            <option value="all">All Statuses</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="$emit('close')">Cancel</button>
        <button class="btn-primary" @click="exportToExcel" :disabled="isExporting">
          <Download class="icon-sm" v-if="!isExporting" />
          <Loader2 class="icon-sm spin" v-else />
          {{ isExporting ? 'Exporting...' : 'Export to Excel' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { X, Download, Loader2 } from 'lucide-vue-next';
import * as XLSX from 'xlsx';
import { formatCurrency } from '../utils/currency';
import { useDialogStore } from '../stores/dialogStore';

const props = defineProps({
  sales: {
    type: Array,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  }
});

const emit = defineEmits(['close']);

const dialogStore = useDialogStore();

const today = new Date().toISOString().split('T')[0];

const filters = ref({
  startDate: today,
  endDate: today,
  paymentMethod: 'all',
  paymentStatus: 'all'
});

const isExporting = ref(false);

const filteredSales = computed(() => {
  return props.sales.filter(sale => {
    // Determine sale date
    let saleDateStr = sale.saleDate || sale.sale_date || sale.createdAt || sale.created_at;
    if (saleDateStr && typeof saleDateStr === 'string') {
        saleDateStr = saleDateStr.replace(' ', 'T');
        if (!saleDateStr.includes('T')) {
            saleDateStr += 'T00:00:00';
        }
    }
    const saleDate = new Date(saleDateStr);
    
    // Normalize filter dates to compare just the date part
    const startObj = filters.value.startDate ? new Date(filters.value.startDate + 'T00:00:00') : null;
    let endObj = filters.value.endDate ? new Date(filters.value.endDate + 'T23:59:59') : null;

    // Date Range Filter
    if (startObj && saleDate < startObj) return false;
    if (endObj && saleDate > endObj) return false;

    // Payment Method Filter
    if (filters.value.paymentMethod !== 'all') {
      const pm = sale.paymentMethod?.toLowerCase() || 'cash';
      if (filters.value.paymentMethod === 'cash' && pm !== 'cash') return false;
      if (filters.value.paymentMethod === 'mpesa' && pm === 'cash') return false;
    }

    return true;
  });
});

async function exportToExcel() {
  isExporting.value = true;
  
  try {
    // Allow UI to update to show loading state
    await new Promise(resolve => setTimeout(resolve, 50));

    const exportData = [];

    // Map sales to flat rows for Excel
    filteredSales.value.forEach(sale => {
        
      let saleDateStr = sale.saleDate || sale.sale_date || sale.createdAt || sale.created_at;
      if (saleDateStr && typeof saleDateStr === 'string') {
          saleDateStr = saleDateStr.replace(' ', 'T');
      }
      const saleDateObj = new Date(saleDateStr);
      
      const formattedDate = saleDateObj.toLocaleDateString();
      const formattedTime = saleDateObj.toLocaleTimeString();

      if (!sale.items || sale.items.length === 0) {
        // Sale with no items
        exportData.push({
          'Date': formattedDate,
          'Item Name': 'N/A',
          'Qty': 0,
          'Item Price': 0,
          'Item Total': 0,
          'Payment Method': sale.paymentMethod || 'Cash',
          'Payment Status': 'N/A',
          'Sale Total': sale.total
        });
      } else {
        sale.items.forEach(item => {
          // Payment Status filter applied at item level
          if (filters.value.paymentStatus !== 'all') {
            const itemStatus = item.paymentStatus || 'unverified';
            if (filters.value.paymentStatus !== itemStatus) return; // Skip this item
          }

          const itemName = item.productName || item.product_name || item.name || 'Unknown Item';
          
          exportData.push({
            'Date': formattedDate,
            'Item Name': itemName,
            'Qty': item.quantity,
            'Item Price': item.price,
            'Item Total': item.quantity * item.price,
            'Payment Method': sale.paymentMethod || 'Cash',
            'Payment Status': item.paymentStatus || 'unverified',
            'Sale Total': sale.total
          });
        });
      }
    });

    if (exportData.length === 0) {
        dialogStore.alert("No data matches the selected filters.");
        isExporting.value = false;
        return;
    }

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Data');

    // Auto-size columns loosely based on header length
    const colWidths = [
      { wch: 12 }, // Date
      { wch: 25 }, // Item Name
      { wch: 8 },  // Qty
      { wch: 12 }, // Item Price
      { wch: 12 }, // Item Total
      { wch: 15 }, // Payment Method
      { wch: 15 }, // Payment Status
      { wch: 12 }, // Sale Total
    ];
    worksheet['!cols'] = colWidths;

    // Generate filename
    const startStr = filters.value.startDate ? `_${filters.value.startDate}` : '';
    const endStr = filters.value.endDate ? `_to_${filters.value.endDate}` : '';
    const fileName = `Sales_Export${startStr}${endStr}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, fileName);
    
    emit('close');
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    dialogStore.error("Failed to export. Please try again.");
  } finally {
    isExporting.value = false;
  }
}
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
  max-width: 500px;
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

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 500;
  color: var(--text-primary, #1e293b);
  font-size: var(--font-size-sm, 0.875rem);
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
  font-size: 0.75rem;
  color: var(--text-secondary, #64748b);
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: var(--radius-md, 8px);
  font-size: var(--font-size-base, 1rem);
  color: var(--text-primary, #1e293b);
  background-color: var(--bg-white, #ffffff);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color, #6366f1);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color, #e2e8f0);
}

.btn-cancel {
  padding: 0.5rem 1rem;
  background: none;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: var(--radius-md, 8px);
  color: var(--text-primary, #1e293b);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-cancel:hover {
  background-color: var(--bg-hover, #f1f5f9);
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background-color: var(--primary-color, #6366f1);
  color: white;
  border: none;
  border-radius: var(--radius-md, 8px);
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.icon-sm {
  width: 18px;
  height: 18px;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
