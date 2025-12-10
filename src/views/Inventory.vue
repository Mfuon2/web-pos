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
          
          <!-- Image Upload Section (Only for Edit) -->
          <div v-if="isEditing" class="form-group image-upload-section">
            <label>Product Image</label>
            <div class="image-preview" v-if="imagePreview || formData.image">
              <img :src="imagePreview || formData.image" alt="Product preview" />
              <button type="button" class="remove-image-btn" @click="removeImage">
                <Trash2 class="icon-sm" /> Remove Image
              </button>
            </div>
            <div class="file-input-wrapper" v-else>
              <input 
                type="file" 
                accept="image/jpeg,image/png,image/webp" 
                @change="handleImageSelect"
                ref="imageInput"
              />
              <div class="file-input-placeholder">
                <ImageIcon class="icon-md" />
                <span>Click to select an image</span>
                <small>JPG, PNG, or WebP (max 2MB)</small>
              </div>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useProductStore } from '../stores/productStore'
import { useCategoryStore } from '../stores/categoryStore'
import { useSettingsStore } from '../stores/settingsStore'
import { formatCurrency } from '../utils/currency'
import { Edit2, Trash2, Package, Download, Upload, Image as ImageIcon } from 'lucide-vue-next'
import PaginationControls from '../components/PaginationControls.vue'
import BulkUploadModal from '../components/BulkUploadModal.vue'
import * as XLSX from 'xlsx'
import { apiFetch } from '../utils/api'

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
    category: '',
    image: null
  }
  showModal.value = true
}

function openEditModal(product) {
  isEditing.value = true
  editingId.value = product.id
  formData.value = { ...product }
  // Reset image upload state
  pendingImageFile.value = null
  imagePreview.value = null
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  // Reset image input
  if (imageInput.value) {
    imageInput.value.value = ''
  }
}

function handleImageSelect(event) {
  const file = event.target.files[0]
  if (!file) return
  
  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    dialogStore.error('Image too large. Please select an image under 2MB.')
    event.target.value = ''
    return
  }
  
  // Validate file type
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    dialogStore.error('Invalid file type. Please select a JPG, PNG, or WebP image.')
    event.target.value = ''
    return
  }
  
  // Store the file for upload on save
  pendingImageFile.value = file
  
  // Create preview URL
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target.result
  }
  reader.readAsDataURL(file)
}

async function removeImage() {
  if (formData.value.image && editingId.value) {
    // Extract filename from image URL
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

async function handlePageChange(page) {
  await productStore.fetchProducts({ page, limit: 20 })
}

async function handleSubmit() {
  try {
    if (isEditing.value) {
      await productStore.updateProduct(editingId.value, formData.value)
      
      // Upload image if a new one was selected
      if (pendingImageFile.value) {
        await uploadImage(editingId.value)
        await productStore.fetchProducts({ page: 1, limit: 20 }) // Refresh to get new image URL
      }
      
      dialogStore.success('Product updated successfully')
    } else {
      await productStore.addProduct(formData.value)
      dialogStore.success('Product added successfully')
    }
    
    // Reset image state
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
  // Refresh data is already handled by the store action, but we can do extra cleanup if needed
  // The modal emits this event after successful import and store refresh
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
.export-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.add-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }

code {
  background: var(--bg-hover);
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-family: monospace;
}
.low-stock { color: var(--danger-bg); font-weight: 600; }
.actions { display: flex; gap: 0.5rem; }

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

/* Image Upload Styles */
.image-upload-section {
  margin-top: 1rem;
}

.file-input-wrapper {
  position: relative;
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-md);
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.file-input-wrapper:hover {
  border-color: var(--primary-color);
  background: var(--bg-hover);
}

.file-input-wrapper input[type="file"] {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.file-input-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
}

.file-input-placeholder .icon-md {
  width: 32px;
  height: 32px;
  color: var(--primary-color);
}

.file-input-placeholder small {
  font-size: 0.75rem;
  opacity: 0.7;
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
</style>
