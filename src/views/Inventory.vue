<template>
  <div class="inventory">
    <div class="header">
      <h1>
        <Package class="header-icon" />
        Inventory
      </h1>
      <div class="header-actions">
        <button @click="exportToExcel" class="export-btn" :disabled="exporting">
          <Download class="icon-sm" />
          {{ exporting ? 'Exporting...' : 'Export' }}
        </button>
        <button @click="openAddModal" class="add-btn">+ Add Product</button>
      </div>
    </div>
    
    <div class="inventory-table">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Barcode</th>
            <th>Price</th>
            <th>Cost</th>
            <th>Expected Profit</th>
            <th>Stock</th>
            <th>Total Value</th>
            <th>Category</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id" :class="{ 'deleted-row': product.deleted_at }">
            <td>
              <span :class="{ 'strikethrough': product.deleted_at }">{{ product.name }}</span>
              <span v-if="product.deleted_at" class="deleted-badge">Deleted</span>
            </td>
            <td><code>{{ product.barcode || 'N/A' }}</code></td>
            <td>{{ formatCurrency(product.price) }}</td>
            <td>{{ formatCurrency(product.cost || 0) }}</td>
            <td>{{ formatCurrency(product.price - (product.cost || 0)) }}</td>
            <td :class="{ 'low-stock': product.stock < 10 }">{{ product.stock }}</td>
            <td>{{ formatCurrency(product.price * product.stock) }}</td>
            <td>{{ product.category || 'N/A' }}</td>
            <td class="actions">
              <button 
                @click="openEditModal(product)" 
                class="btn-icon edit" 
                title="Edit"
                :disabled="!!product.deleted_at"
              >
                <Edit2 class="icon-sm" />
              </button>
              <button 
                @click="handleDelete(product.id)" 
                class="btn-icon delete" 
                title="Delete"
                :disabled="!!product.deleted_at"
              >
                <Trash2 class="icon-sm" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <PaginationControls 
        v-if="pagination.total > 0"
        :current-page="pagination.page"
        :total-pages="pagination.totalPages"
        :total="pagination.total"
        :limit="pagination.limit"
        @page-change="handlePageChange"
      />
    </div>

    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ isEditing ? 'Edit Product' : 'Add New Product' }}</h2>
          <button class="close-btn" @click="closeModal">✕</button>
        </div>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>Product Name</label>
            <input v-model="formData.name" type="text" required />
          </div>
          <div class="form-group">
            <label>Barcode</label>
            <input v-model="formData.barcode" type="text" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Price</label>
              <input v-model.number="formData.price" type="number" step="0.01" required />
            </div>
            <div class="form-group">
              <label>Cost</label>
              <input v-model.number="formData.cost" type="number" step="0.01" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Stock</label>
              <input v-model.number="formData.stock" type="number" required />
            </div>
            <div class="form-group">
              <label>Category</label>
              <select v-model="formData.category" required>
                <option value="">Select Category</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.name">
                  {{ cat.name }}
                </option>
              </select>
            </div>
          </div>
          <button type="submit" class="submit-btn">
            {{ isEditing ? 'Update Product' : 'Add Product' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useProductStore } from '../stores/productStore'
import { useCategoryStore } from '../stores/categoryStore'
import { useSettingsStore } from '../stores/settingsStore'
import { formatCurrency } from '../utils/currency'
import { Edit2, Trash2, Package, Download } from 'lucide-vue-next'
import PaginationControls from '../components/PaginationControls.vue'
import * as XLSX from 'xlsx'

import { useDialogStore } from '../stores/dialogStore'

const productStore = useProductStore()
const categoryStore = useCategoryStore()
const settingsStore = useSettingsStore()
const dialogStore = useDialogStore()
const products = computed(() => productStore.products)
const categories = computed(() => categoryStore.categories)
const pagination = computed(() => productStore.pagination)

const exporting = ref(false)

async function exportToExcel() {
  exporting.value = true
  try {
    // Fetch all products for export (ignoring pagination)
    // Note: In a real app with thousands of items, we might need a dedicated API endpoint
    // For now, we'll assume the store can handle fetching all or we use the current list
    // If we need ALL products, we might need to fetch them. 
    // Let's assume we want to export what's currently available or fetch all if possible.
    // For this implementation, I'll fetch all products temporarily.
    
    // Fetch all products
    const allProducts = await productStore.getAllProducts() // We need to ensure this exists or implement it
    
    const businessName = settingsStore.businessName
    const date = new Date().toLocaleDateString()
    const time = new Date().toLocaleTimeString()
    
    // Prepare data
    const data = [
      [businessName], // Row 1: Business Name
      [`Stock as at ${date} ${time}`], // Row 2: Date
      [], // Row 3: Empty
      ['Name', 'Barcode', 'Price', 'Cost', 'Expected Profit', 'Stock', 'Total Value', 'Category'] // Row 4: Headers
    ]
    
    allProducts.forEach(p => {
      data.push([
        p.name,
        p.barcode || 'N/A',
        p.price,
        p.cost || 0,
        p.price - (p.cost || 0),
        p.stock,
        p.price * p.stock,
        p.category || 'N/A'
      ])
    })
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(data)
    
    // Merge cells for title
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // Merge Business Name across 8 columns
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }  // Merge Date across 8 columns
    ]
    
    // Create workbook
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory')
    
    // Save file
    XLSX.writeFile(wb, `Inventory_${date.replace(/\//g, '-')}.xlsx`)
    
    dialogStore.success('Inventory exported successfully')
  } catch (error) {
    console.error('Export failed:', error)
    dialogStore.error('Export failed: ' + error.message)
  } finally {
    exporting.value = false
  }
}

const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref(null)

const formData = ref({
  name: '',
  barcode: '',
  price: 0,
  cost: 0,
  stock: 0,
  category: ''
})

function generateBarcode() {
  const startBarcode = 1000000001
  
  // Get all existing numeric barcodes
  const existingBarcodes = productStore.products
    .map(p => parseInt(p.barcode))
    .filter(b => !isNaN(b) && b >= startBarcode)
    
  if (existingBarcodes.length === 0) {
    return startBarcode.toString()
  }
  
  // Find the max and add 1
  const maxBarcode = Math.max(...existingBarcodes)
  return (maxBarcode + 1).toString()
}

function openAddModal() {
  isEditing.value = false
  editingId.value = null
  formData.value = { 
    name: '', 
    barcode: generateBarcode(), 
    price: 0, 
    cost: 0, 
    stock: 0, 
    category: '' 
  }
  showModal.value = true
}

function openEditModal(product) {
  isEditing.value = true
  editingId.value = product.id
  formData.value = { ...product }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function handlePageChange(page) {
  await productStore.fetchProducts({ page, limit: 20 })
}

async function handleSubmit() {
  try {
    if (isEditing.value) {
      await productStore.updateProduct(editingId.value, formData.value)
      dialogStore.success('Product updated successfully')
    } else {
      await productStore.addProduct(formData.value)
      dialogStore.success('Product added successfully')
    }
    closeModal()
  } catch (error) {
    dialogStore.error('Operation failed: ' + error.message)
  }
}

async function handleDelete(id) {
  const confirmed = await dialogStore.confirm('Are you sure you want to delete this product?')
  if (!confirmed) return

  try {
    await productStore.deleteProduct(id)
    dialogStore.success('Product deleted successfully')
  } catch (error) {
    dialogStore.error('Delete failed: ' + error.message)
  }
}

onMounted(async () => {
  await productStore.fetchProducts({ page: 1, limit: 20 })
  await categoryStore.fetchCategories()
})
</script>

<style scoped>
.inventory {
  padding: var(--spacing-xl);
  max-width: 1400px;
  margin: 0 auto;
}
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.header h1 { 
  margin: 0; 
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
.header-actions {
  display: flex;
  gap: 1rem;
}
.add-btn {
  padding: 0.75rem 1.5rem;
  background: var(--primary-gradient);
  color: var(--text-white);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}
.export-btn {
  padding: 0.75rem 1.5rem;
  background: var(--bg-white);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.export-btn:hover {
  background: var(--bg-hover);
  border-color: var(--text-secondary);
}
.export-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.add-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }
.inventory-table { background: var(--bg-white); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm); overflow-x: auto; }
table { min-width: 800px; }
code {
  background: var(--bg-hover);
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-family: monospace;
}
.low-stock { color: var(--danger-bg); font-weight: 600; }
.actions { display: flex; gap: 0.5rem; }
.btn-icon {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: var(--radius-sm);
  transition: background 0.2s;
}
.btn-icon:hover { background: var(--bg-hover); }
.btn-icon.delete:hover { background: var(--danger-light); }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
.modal-content {
  background: var(--bg-white);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  max-width: 600px;
  width: 90%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.3s ease;
  max-height: 90vh;
  overflow-y: auto;
}
@keyframes slideIn { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.modal-header h2 { margin: 0; color: var(--text-primary); }
.close-btn {
  background: none;
  border: none;
  font-size: var(--font-size-xl);
  cursor: pointer;
  color: var(--text-secondary);
}
.close-btn:hover { color: var(--text-primary); }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--text-primary); }
.form-group input,
.form-group select {
  width: 100%;
  padding: var(--spacing-md);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  background-color: var(--bg-white);
}
.form-group input:focus,
.form-group select:focus { outline: none; border-color: var(--primary-color); }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.submit-btn {
  width: 100%;
  padding: var(--spacing-lg);
  background: var(--primary-gradient);
  color: var(--text-white);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: var(--font-size-base);
  cursor: pointer;
  margin-top: var(--spacing-lg);
  transition: all 0.3s ease;
}
.submit-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }

@media (max-width: 768px) {
  .inventory {
    padding: var(--spacing-lg);
  }
  .header { flex-direction: column; gap: 1rem; align-items: stretch; }
  .header h1 {
    text-align: center;
    font-size: var(--font-size-xl);
  }
  .form-row { grid-template-columns: 1fr; }
  .modal-content {
    padding: var(--spacing-lg);
    width: 95%;
  }
}

.deleted-row {
  background-color: var(--bg-hover);
  opacity: 0.7;
}

.strikethrough {
  text-decoration: line-through;
  color: var(--text-secondary);
}

.deleted-badge {
  background: var(--danger-bg);
  color: var(--text-white);
  font-size: 0.7rem;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  margin-left: 0.5rem;
  vertical-align: middle;
}

.btn-icon:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  pointer-events: none;
}
</style>
