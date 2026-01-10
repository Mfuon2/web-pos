<template>
  <div class="inventory">
    <div class="header">
      <h1>
        <Package class="header-icon" />
        Inventory Management
      </h1>
    </div>
    
    <!-- Tab Navigation -->
    <div class="tabs">
      <button 
        class="tab" 
        :class="{ active: activeTab === 'inventory' }"
        @click="activeTab = 'inventory'"
      >
        <Package class="icon-sm" />
        All Products
      </button>
      <button 
        class="tab" 
        :class="{ active: activeTab === 'low_stock' }"
        @click="activeTab = 'low_stock'"
      >
        <TrendingDown class="icon-sm" />
        Restock (< 1)
      </button>
      <button 
        class="tab" 
        :class="{ active: activeTab === 'borrowed' }"
        @click="activeTab = 'borrowed'"
      >
        <ArrowDownLeft class="icon-sm" />
        Borrowed
      </button>
      <button 
        class="tab" 
        :class="{ active: activeTab === 'loaned' }"
        @click="activeTab = 'loaned'"
      >
        <ArrowUpRight class="icon-sm" />
        Loaned
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      
      <!-- Inventory Tab / Low Stock Tab -->
      <div v-if="activeTab === 'inventory' || activeTab === 'low_stock'" class="content-section">
        <div class="section-header">
          <h2>{{ activeTab === 'low_stock' ? 'Restock Needed (Stock < 1)' : 'Product List' }}</h2>
          <div class="header-actions">
            <button @click="exportToExcel" class="export-btn" :disabled="exporting">
              <Download class="icon-sm" />
              {{ exporting ? 'Exporting...' : 'Export' }}
            </button>
            <button @click="showBulkUploadModal = true" class="upload-btn">
              <Upload class="icon-sm" />
              Upload Products
            </button>
            <button @click="openAddModal" class="add-btn">+ Add Product</button>
          </div>
        </div>

        <div class="table-container">
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
                    class="action-btn edit-btn"
                    title="Edit"
                    :disabled="!!product.deleted_at"
                  >
                    <Edit2 class="icon-sm" />
                  </button>
                  <button 
                    @click="handleDelete(product.id)" 
                    class="action-btn delete-btn" 
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
      </div>

      <!-- Borrowed Tab -->
      <div v-if="activeTab === 'borrowed'" class="content-section">
        <div class="section-header">
          <h2>Borrowed Inventory</h2>
        </div>
        
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Borrowed From</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in borrowedItems" :key="item.id">
                <td>
                  <strong>{{ item.product_name }}</strong>
                  <br>
                  <small>{{ item.product_barcode }}</small>
                </td>
                <td class="center-align-text">{{ item.quantity }}</td>
                <td>{{ item.borrowed_from }}</td>
                <td>{{ item.reason }}</td>
                <td>
                  <span class="status-badge" :class="item.status">{{ item.status }}</span>
                </td>
                <td>{{ formatDate(item.created_at) }}</td>
                <td class="actions">
                  <button @click="openEditBorrowedModal(item)" class="action-btn edit-btn" title="Edit">
                    <Edit2 class="icon-sm" />
                  </button>
                </td>
              </tr>
              <tr v-if="borrowedItems.length === 0">
                <td colspan="7" class="empty-state">No borrowed items recorded.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Loaned Tab -->
      <div v-if="activeTab === 'loaned'" class="content-section">
        <div class="section-header">
          <h2>Loaned Inventory</h2>
        </div>
        
        <div class="table-container">
          <table class="inventory-table">
            <thead>
              <tr>
                <th>Borrower</th>
                <th>Items</th>
                <th>Collateral</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="loan in loans" :key="loan.id">
                <td>
                  <strong>{{ loan.borrower_name }}</strong>
                  <div v-if="loan.borrower_contact"><small>{{ loan.borrower_contact }}</small></div>
                </td>
                <td>
                  <ul class="loan-items-list">
                    <li v-for="item in loan.items" :key="item.product_id">
                      {{ item.quantity }}x {{ item.product_name }}
                    </li>
                  </ul>
                </td>
                <td>
                  <div v-if="loan.collateral">
                    <strong>{{ loan.collateral }}</strong>
                    <div v-if="loan.collateral_description"><small>{{ loan.collateral_description }}</small></div>
                  </div>
                  <span v-else class="text-secondary">None</span>
                </td>
                <td>
                  <span class="status-badge" :class="loan.status">{{ loan.status }}</span>
                </td>
                <td>{{ formatDate(loan.created_at) }}</td>
                <td class="actions">
                  <button @click="openEditLoanModal(loan)" class="action-btn edit-btn" title="Update / Return">
                    <Edit2 class="icon-sm" />
                  </button>
                </td>
              </tr>
              <tr v-if="loans.length === 0">
                <td colspan="6" class="empty-state">No active loans.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- Edit Borrowed Item Modal -->
    <div v-if="showEditBorrowedModal" class="modal-overlay" @click="closeEditBorrowedModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Edit Borrowed Item</h2>
          <button class="close-btn" @click="closeEditBorrowedModal">✕</button>
        </div>
        <form @submit.prevent="handleUpdateBorrowedItem">
          <div class="form-group">
            <label>Product</label>
            <input type="text" :value="borrowedForm.productName" disabled class="disabled-input" />
          </div>
          <div class="form-group">
            <label>Available Status *</label>
            <select v-model="borrowedForm.status" required>
              <option value="pending">Pending</option>
              <option value="returned">Returned</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div class="form-group">
            <label>Borrowed From *</label>
            <input v-model="borrowedForm.borrowed_from" type="text" required />
          </div>
          <div class="form-group">
            <label>Reason / Notes</label>
            <textarea v-model="borrowedForm.reason" rows="2"></textarea>
          </div>
          <button type="submit" class="submit-btn" :disabled="borrowedStore.loading">
            {{ borrowedStore.loading ? 'Updating...' : 'Update Record' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Modals (Keep existing modals) -->
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
          
          <!-- Image Upload Section -->
          <div class="form-group image-upload-section">
            <label>Product Image</label>
            <div class="image-preview" v-if="imagePreview || formData.image">
              <img :src="imagePreview || formData.image" alt="Product preview" />
              <button type="button" class="remove-image-btn" @click="removeImage">
                <Trash2 class="icon-sm" /> Remove Image
              </button>
            </div>
            <div class="upload-controls" v-else>
              <div class="upload-buttons">
                <button type="button" class="upload-opt-btn" @click="$refs.imageInput.click()">
                  <ImageIcon class="icon-md" />
                  <span>Browse Files</span>
                </button>
                <button type="button" class="upload-opt-btn camera-btn" @click="$refs.cameraInput.click()">
                  <Camera class="icon-md" />
                  <span>Take Photo</span>
                </button>
              </div>
              <input 
                type="file" 
                accept="image/jpeg,image/png,image/webp" 
                @change="handleImageSelect"
                ref="imageInput"
                class="hidden-input"
              />
              <input 
                type="file" 
                accept="image/jpeg,image/png,image/webp" 
                capture="environment"
                @change="handleImageSelect"
                ref="cameraInput"
                class="hidden-input"
              />
              <p class="upload-hint">JPG, PNG, or WebP (max 2MB)</p>
            </div>
          </div>
          <button type="submit" class="submit-btn">
            {{ isEditing ? 'Update Product' : 'Add Product' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Bulk Upload Modal -->
    <BulkUploadModal 
      v-if="showBulkUploadModal" 
      @close="showBulkUploadModal = false"
      @imported="handleBulkImported"
    />
    <div v-if="showEditLoanModal" class="modal-overlay" @click.self="closeEditLoanModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Update Loan</h2>
          <button class="close-btn" @click="closeEditLoanModal">✕</button>
        </div>

        <form @submit.prevent="handleUpdateLoan">
           <div class="form-group">
            <label>Status</label>
            <select v-model="loanForm.status">
              <option value="active">Active</option>
              <option value="returned">Returned</option>
              <option value="partially_returned">Partially Returned</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div class="form-group">
            <label>Borrower Name</label>
            <input v-model="loanForm.borrower_name" type="text" required />
          </div>

           <div class="form-group">
            <label>Contact</label>
            <input v-model="loanForm.borrower_contact" type="text" />
          </div>

          <div class="form-group">
            <label>Collateral</label>
            <input v-model="loanForm.collateral" type="text" />
          </div>

          <div class="form-group">
            <label>Description</label>
            <textarea v-model="loanForm.collateral_description" rows="2"></textarea>
          </div>

          <button type="submit" class="submit-btn" :disabled="loanStore.loading">
            {{ loanStore.loading ? 'Updating...' : 'Update Loan' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useProductStore } from '../stores/productStore'
import { useCategoryStore } from '../stores/categoryStore'
import { useSettingsStore } from '../stores/settingsStore'
import { formatCurrency } from '../utils/currency'
import { Edit2, Trash2, Package, Download, Upload, Image as ImageIcon, Camera, ArrowDownLeft, ArrowUpRight, TrendingDown } from 'lucide-vue-next'
import PaginationControls from '../components/PaginationControls.vue'
import BulkUploadModal from '../components/BulkUploadModal.vue'
import * as XLSX from 'xlsx'
import { apiFetch } from '../utils/api'

import { useDialogStore } from '../stores/dialogStore'
import { useBorrowedStore } from '../stores/borrowedStore'
import { useLoanStore } from '../stores/loanStore'

const productStore = useProductStore()
const categoryStore = useCategoryStore()
const settingsStore = useSettingsStore()
const dialogStore = useDialogStore()
const borrowedStore = useBorrowedStore()
const loanStore = useLoanStore()

const products = computed(() => productStore.products)
const categories = computed(() => categoryStore.categories)
const pagination = computed(() => productStore.pagination)
const borrowedItems = computed(() => borrowedStore.borrowedItems)

const activeTab = ref('inventory') // inventory, low_stock, borrowed, loaned
const exporting = ref(false)

// Watch for tab changes to fetch appropriate data
watch(activeTab, async (newTab) => {
  if (newTab === 'inventory') {
    await productStore.fetchProducts({ page: 1, limit: 20 })
  } else if (newTab === 'low_stock') {
    await productStore.fetchProducts({ page: 1, limit: 20, low_stock: true })
  } else if (newTab === 'borrowed') {
    await borrowedStore.fetchBorrowedItems()
  } else if (newTab === 'loaned') {
    await loanStore.fetchLoans()
  }
})

async function handlePageChange(page) {
  if (activeTab.value === 'low_stock') {
    await productStore.fetchProducts({ page, limit: 20, low_stock: true })
  } else {
    await productStore.fetchProducts({ page, limit: 20 })
  }
}

async function exportToExcel() {
  exporting.value = true
  try {
    const allProducts = await productStore.getAllProducts()
    
    const businessName = settingsStore.businessName
    const date = new Date().toLocaleDateString()
    const time = new Date().toLocaleTimeString()
    
    const data = [
      [businessName],
      [`Stock as at ${date} ${time}`],
      [],
      ['Name', 'Barcode', 'Price', 'Cost', 'Expected Profit', 'Stock', 'Total Value', 'Category']
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
    
    const ws = XLSX.utils.aoa_to_sheet(data)
    
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }
    ]
    
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory')
    
    XLSX.writeFile(wb, `Inventory_${date.replace(/\//g, '-')}.xlsx`)
    
    dialogStore.success('Inventory exported successfully')
  } catch (error) {
    console.error('Export failed:', error)
    dialogStore.error('Export failed: ' + error.message)
  } finally {
    exporting.value = false
  }
}

// Borrowed Item Edit Logic
const showEditBorrowedModal = ref(false)
const editingBorrowedDetail = ref(null)
const borrowedForm = ref({
  productName: '',
  borrowed_from: '',
  reason: '',
  status: 'pending'
})

function openEditBorrowedModal(item) {
  editingBorrowedDetail.value = item
  borrowedForm.value = {
    productName: item.product_name,
    borrowed_from: item.borrowed_from,
    reason: item.reason,
    status: item.status || 'pending'
  }
  showEditBorrowedModal.value = true
}

function closeEditBorrowedModal() {
  showEditBorrowedModal.value = false
  editingBorrowedDetail.value = null
}

async function handleUpdateBorrowedItem() {
  if (!editingBorrowedDetail.value) return
  
  try {
    const updates = {
      borrowed_from: borrowedForm.value.borrowed_from,
      reason: borrowedForm.value.reason,
      status: borrowedForm.value.status
    }
    
    await borrowedStore.updateBorrowedItem(editingBorrowedDetail.value.id, updates)
    dialogStore.success('Borrowed item updated')
    closeEditBorrowedModal()
  } catch (error) {
    dialogStore.error('Update failed: ' + error.message)
  }
}

// Loan Edit Logic
const loans = computed(() => loanStore.loans)
const showEditLoanModal = ref(false)
const editingLoanDetail = ref(null)
const loanForm = ref({
  borrower_name: '',
  borrower_contact: '',
  collateral: '',
  collateral_description: '',
  status: 'active'
})

function openEditLoanModal(loan) {
  editingLoanDetail.value = loan
  loanForm.value = {
    borrower_name: loan.borrower_name,
    borrower_contact: loan.borrower_contact,
    collateral: loan.collateral,
    collateral_description: loan.collateral_description,
    status: loan.status || 'active'
  }
  showEditLoanModal.value = true
}

function closeEditLoanModal() {
  showEditLoanModal.value = false
  editingLoanDetail.value = null
}

async function handleUpdateLoan() {
  if (!editingLoanDetail.value) return
  
  try {
    const updates = { ...loanForm.value }
    // If status changed to returned, backend handles restocking?
    // Current backend logic supports it if action is 'return_all' or if we just set status.
    // Let's simple update for now, standard fields.
    
    await loanStore.updateLoan(editingLoanDetail.value.id, updates)
    dialogStore.success('Loan updated')
    closeEditLoanModal()
  } catch (error) {
    dialogStore.error('Update failed: ' + error.message)
  }
}

const showModal = ref(false)
const showBulkUploadModal = ref(false)
const isEditing = ref(false)
const editingId = ref(null)

const formData = ref({
  name: '',
  barcode: '',
  price: 0,
  cost: 0,
  stock: 0,
  category: '',
  image: null
})

const imageInput = ref(null)
const pendingImageFile = ref(null)
const imagePreview = ref(null)

function generateBarcode() {
  // Use timestamp + small random number for unique barcode
  // This avoids clashes even with paginated data
  const timestamp = Date.now().toString().slice(-8)
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0')
  return `10${timestamp}${random}`
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
    category: '',
    image: null
  }
  showModal.value = true
}

function openEditModal(product) {
  isEditing.value = true
  editingId.value = product.id
  formData.value = { ...product }
  pendingImageFile.value = null
  imagePreview.value = null
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  if (imageInput.value) {
    imageInput.value.value = ''
  }
}

function handleImageSelect(event) {
  const file = event.target.files[0]
  if (!file) return
  
  if (file.size > 2 * 1024 * 1024) {
    dialogStore.error('Image too large. Please select an image under 2MB.')
    event.target.value = ''
    return
  }
  
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    dialogStore.error('Invalid file type. Please select a JPG, PNG, or WebP image.')
    event.target.value = ''
    return
  }
  
  pendingImageFile.value = file
  
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target.result
  }
  reader.readAsDataURL(file)
}

async function removeImage() {
  if (formData.value.image && editingId.value) {
    const filename = formData.value.image.split('/').pop()
    try {
      const response = await apiFetch('/api/products/image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: editingId.value, filename })
      })
      if (!response.ok) throw new Error('Failed to delete image')
    } catch (err) {
      console.error('Image delete error:', err)
    }
  }
  
  formData.value.image = null
  pendingImageFile.value = null
  imagePreview.value = null
  if (imageInput.value) {
    imageInput.value.value = ''
  }
}

async function uploadImage(productId) {
  if (!pendingImageFile.value) return null
  
  const uploadFormData = new FormData()
  uploadFormData.append('image', pendingImageFile.value)
  uploadFormData.append('productId', productId)
  
  const response = await apiFetch('/api/products/image', {
    method: 'POST',
    body: uploadFormData
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to upload image')
  }
  
  const result = await response.json()
  return result.imageUrl
}



async function handleSubmit() {
  try {
    if (isEditing.value) {
      await productStore.updateProduct(editingId.value, formData.value)
      if (pendingImageFile.value) {
        await uploadImage(editingId.value)
        await productStore.fetchProducts({ page: 1, limit: 20 })
      }
      dialogStore.success('Product updated successfully')
    } else {
      const result = await productStore.addProduct(formData.value)
      if (pendingImageFile.value && result && result.id) {
        await uploadImage(result.id)
        await productStore.fetchProducts({ page: 1, limit: 20 })
      }
      dialogStore.success('Product added successfully')
    }
    
    pendingImageFile.value = null
    imagePreview.value = null
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

function handleBulkImported() {
  // handled by store
}

onMounted(async () => {
  await productStore.fetchProducts({ page: 1, limit: 20 })
  await categoryStore.fetchCategories()
  await borrowedStore.fetchBorrowedItems()
})

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  if (typeof dateString === 'string') {
    dateString = dateString.replace(' ', 'T')
  }
  return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.inventory {
  padding: var(--spacing-xl);
  max-width: 1400px;
  margin: 0 auto;
}

.header { 
  margin-bottom: 2rem; 
}

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

/* Tabs */
.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: var(--spacing-lg);
  border-bottom: var(--border-width) solid var(--border-color);
  overflow-x: auto;
}

.tab {
  flex: 1;
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

.content-section {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.section-header h2 {
  color: var(--text-primary);
  margin: 0;
  font-size: 1.25rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.add-btn {
  padding: 0.3rem 1.0rem;
  background: var(--primary-gradient);
  color: var(--text-white);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.export-btn, .upload-btn {
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

.export-btn:hover, .upload-btn:hover {
  background: var(--bg-hover);
  border-color: var(--text-secondary);
}

.export-btn:disabled, .add-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.add-btn:not(:disabled):hover { 
  transform: translateY(-2px); 
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); 
}

code {
  background: var(--bg-hover);
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-family: monospace;
}

.low-stock { color: var(--danger-bg); font-weight: 600; }
.actions { display: flex; gap: 0.5rem; }

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-secondary);
  background: var(--bg-white);
  border-radius: var(--radius-lg);
  border: var(--border-width) dashed var(--border-color);
}

.empty-icon-lg {
  width: 48px;
  height: 48px;
  margin-bottom: 1rem;
  opacity: 0.5;
}

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
  border: var(--border-width) solid var(--border-color);
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
  
  .header h1 {
    font-size: var(--font-size-xl);
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
  
  .section-header { 
    flex-direction: column; 
    gap: 1rem; 
    align-items: stretch; 
  }
  
  .header-actions {
    flex-direction: column;
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

.image-upload-section {
  margin-top: 1.5rem;
  background: var(--bg-hover);
  padding: 1.25rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
}

.upload-controls {
  text-align: center;
}

.upload-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.upload-opt-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem;
  background: var(--bg-white);
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
}

.upload-opt-btn:hover {
  border-color: var(--primary-color);
  background: var(--bg-hover);
  transform: translateY(-2px);
}

.upload-opt-btn.camera-btn {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
}

.upload-opt-btn .icon-md {
  width: 28px;
  height: 28px;
  color: var(--primary-color);
}

.upload-opt-btn span {
  font-weight: 500;
  font-size: 0.9rem;
}

.upload-hint {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0.5rem 0 0;
  opacity: 0.8;
}

.hidden-input {
  display: none;
}

.image-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.image-preview img {
  max-width: 200px;
  max-height: 150px;
  object-fit: contain;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.remove-image-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--danger-bg);
  color: var(--text-white);
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  cursor: pointer;
  transition: opacity 0.2s;
}

.remove-image-btn:hover {
  opacity: 0.9;
}

.icon-sm {
  width: 16px;
  height: 16px;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: capitalize;
}

.status-badge.pending {
  background-color: #fef3c7;
  color: #d97706; /* Amber */
  border: 1px solid #fde68a;
}

.status-badge.returned {
  background-color: #dbeafe;
  color: #2563eb; /* Blue/Info */
  border: 1px solid #bfdbfe;
}

.status-badge.paid {
  background-color: #dcfce7;
  color: #16a34a; /* Green/Success */
  border: 1px solid #bbf7d0;
}

/* Loan Statuses */
.status-badge.active {
  background-color: #f3e8ff;
  color: #9333ea; /* Purple */
  border: 1px solid #e9d5ff;
}

.status-badge.partially_returned {
  background-color: #ffedd5;
  color: #c2410c; /* Orange */
  border: 1px solid #fed7aa;
}

.status-badge.overdue {
  background-color: #fee2e2;
  color: #dc2626; /* Red/Danger */
  border: 1px solid #fecaca;
}

.loan-items-list {
  margin: 0;
  padding-left: 1.2rem;
  font-size: 0.9rem;
}
</style>
