<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content bulk-upload-modal" @click.stop>
      <div class="modal-header">
        <h2><Upload class="icon-sm" /> Bulk Upload Products</h2>
        <button class="close-btn" @click="$emit('close')">
          <X class="icon-sm" />
        </button>
      </div>

      <div class="modal-body">
        <!-- Step 1: Download Template -->
        <div class="step-section">
          <h3>Step 1: Download Template</h3>
          <p>Download the Excel template with category dropdown pre-configured.</p>
          <button @click="downloadTemplate" class="download-btn" :disabled="loadingCategories">
            <Download class="icon-sm" />
            {{ loadingCategories ? 'Loading...' : 'Download Template' }}
          </button>
        </div>

        <!-- Step 2: Upload & Validate -->
        <div class="step-section">
          <h3>Step 2: Upload & Validate</h3>
          <div class="file-upload-area" :class="{ 'has-file': selectedFile }">
            <input 
              type="file" 
              ref="fileInput"
              accept=".xlsx,.xls"
              @change="handleFileSelect"
              class="file-input"
            />
            <div class="file-upload-content">
              <FileSpreadsheet class="upload-icon" />
              <p v-if="!selectedFile">Click or drag Excel file here</p>
              <p v-else class="file-name">{{ selectedFile.name }}</p>
            </div>
          </div>
          
          <button 
            @click="validateFile" 
            class="validate-btn"
            :disabled="!selectedFile || validating"
          >
            <CheckCircle class="icon-sm" />
            {{ validating ? 'Validating...' : 'Validate' }}
          </button>
        </div>

        <!-- Validation Results -->
        <div v-if="validationResults" class="validation-results">
          <h3>Validation Results</h3>
          
          <div class="stats">
            <div class="stat valid">
              <span class="stat-number">{{ validationResults.validCount }}</span>
              <span class="stat-label">Valid</span>
            </div>
            <div class="stat invalid">
              <span class="stat-number">{{ validationResults.errorCount }}</span>
              <span class="stat-label">Errors</span>
            </div>
            <div class="stat total">
              <span class="stat-number">{{ validationResults.totalRows }}</span>
              <span class="stat-label">Total</span>
            </div>
          </div>

          <!-- Errors List -->
          <div v-if="validationResults.errors.length > 0" class="errors-list">
            <h4><AlertCircle class="icon-sm" /> Errors Found</h4>
            <div class="error-items">
              <div v-for="(error, index) in validationResults.errors" :key="index" class="error-item">
                <strong>Row {{ error.row }}:</strong> {{ error.message }}
              </div>
            </div>
          </div>

          <!-- Valid Products Preview -->
          <div v-if="validationResults.validProducts.length > 0" class="valid-preview">
            <h4><CheckCircle class="icon-sm" /> Products Ready to Import</h4>
            <div class="preview-table-wrapper">
              <table class="preview-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Cost</th>
                    <th>Stock</th>
                    <th>Category</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(product, index) in validationResults.validProducts.slice(0, 5)" :key="index">
                    <td>{{ product.name }}</td>
                    <td>{{ product.price }}</td>
                    <td>{{ product.cost || 0 }}</td>
                    <td>{{ product.stock }}</td>
                    <td>{{ product.category }}</td>
                  </tr>
                  <tr v-if="validationResults.validProducts.length > 5">
                    <td colspan="5" class="more-rows">
                      ... and {{ validationResults.validProducts.length - 5 }} more products
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="$emit('close')" class="cancel-btn">Cancel</button>
        <button 
          @click="importProducts" 
          class="import-btn"
          :disabled="!canImport || importing"
        >
          <Upload class="icon-sm" />
          {{ importing ? 'Importing...' : `Import ${validationResults?.validCount || 0} Products` }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCategoryStore } from '../stores/categoryStore'
import { useProductStore } from '../stores/productStore'
import { useDialogStore } from '../stores/dialogStore'
import { Upload, Download, X, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-vue-next'
import * as XLSX from 'xlsx'

const emit = defineEmits(['close', 'imported'])

const categoryStore = useCategoryStore()
const productStore = useProductStore()
const dialogStore = useDialogStore()

const fileInput = ref(null)
const selectedFile = ref(null)
const loadingCategories = ref(false)
const validating = ref(false)
const importing = ref(false)
const validationResults = ref(null)

const categories = computed(() => categoryStore.categories.map(c => c.name))

const canImport = computed(() => {
  return validationResults.value && 
         validationResults.value.validCount > 0 && 
         validationResults.value.errorCount === 0
})

onMounted(async () => {
  loadingCategories.value = true
  await categoryStore.fetchCategories()
  loadingCategories.value = false
})

function downloadTemplate() {
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()
  
  // Template data with headers and example row
  const templateData = [
    ['Name', 'Price', 'Cost', 'Stock', 'Category'],
    ['Example Product', 100, 50, 10, categories.value[0] || 'Electronics']
  ]
  
  const ws = XLSX.utils.aoa_to_sheet(templateData)
  
  // Set column widths
  ws['!cols'] = [
    { wch: 30 }, // Name
    { wch: 12 }, // Price
    { wch: 12 }, // Cost
    { wch: 10 }, // Stock
    { wch: 20 }  // Category
  ]
  
  // Add data validation for category column (Column E)
  // Create a reference sheet for category values
  if (categories.value.length > 0) {
    // Add categories to a hidden sheet for dropdown reference
    const catData = categories.value.map(c => [c])
    const catWs = XLSX.utils.aoa_to_sheet(catData)
    XLSX.utils.book_append_sheet(wb, catWs, 'Categories')
    
    // Note: SheetJS doesn't fully support data validation in the community version
    // The categories sheet serves as a reference for users
  }
  
  XLSX.utils.book_append_sheet(wb, ws, 'Products')
  
  // Download file
  XLSX.writeFile(wb, 'product_upload_template.xlsx')
}

function handleFileSelect(event) {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
    validationResults.value = null
  }
}

async function validateFile() {
  if (!selectedFile.value) return
  
  validating.value = true
  validationResults.value = null
  
  try {
    const data = await readExcelFile(selectedFile.value)
    
    if (data.length === 0) {
      validationResults.value = {
        totalRows: 0,
        validCount: 0,
        errorCount: 1,
        errors: [{ row: 1, message: 'No data found in file' }],
        validProducts: []
      }
      return
    }
    
    const errors = []
    const validProducts = []
    
    // Skip header row if present
    const startIndex = isHeaderRow(data[0]) ? 1 : 0
    
    for (let i = startIndex; i < data.length; i++) {
      const row = data[i]
      const rowNum = i + 1 // Excel row number (1-indexed)
      const rowErrors = validateRow(row, rowNum)
      
      if (rowErrors.length > 0) {
        errors.push(...rowErrors)
      } else {
        validProducts.push({
          name: String(row.Name || row.name || '').trim(),
          price: parseFloat(row.Price || row.price) || 0,
          cost: parseFloat(row.Cost || row.cost) || 0,
          stock: parseInt(row.Stock || row.stock) || 0,
          category: String(row.Category || row.category || '').trim()
        })
      }
    }
    
    validationResults.value = {
      totalRows: data.length - startIndex,
      validCount: validProducts.length,
      errorCount: errors.length,
      errors,
      validProducts
    }
  } catch (err) {
    validationResults.value = {
      totalRows: 0,
      validCount: 0,
      errorCount: 1,
      errors: [{ row: 0, message: `Failed to read file: ${err.message}` }],
      validProducts: []
    }
  } finally {
    validating.value = false
  }
}

function readExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        
        // Try to find 'Products' sheet first
        let sheetName = workbook.SheetNames.find(name => name === 'Products')
        
        // If not found, try the second sheet (index 1) as template puts Categories first
        if (!sheetName && workbook.SheetNames.length > 1) {
          sheetName = workbook.SheetNames[1]
        }
        
        // Fallback to first sheet
        if (!sheetName) {
          sheetName = workbook.SheetNames[0]
        }

        const sheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(sheet)
        resolve(jsonData)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

function isHeaderRow(row) {
  const nameValue = String(row.Name || row.name || '').toLowerCase()
  return nameValue === 'name' || nameValue === ''
}

function validateRow(row, rowNum) {
  const errors = []
  
  // Name validation
  const name = row.Name || row.name
  if (!name || String(name).trim() === '') {
    errors.push({ row: rowNum, message: 'Name is required' })
  }
  
  // Price validation
  const price = parseFloat(row.Price || row.price)
  if (isNaN(price) || price <= 0) {
    errors.push({ row: rowNum, message: 'Price must be a positive number' })
  }
  
  // Cost validation (optional but must be valid if provided)
  const cost = row.Cost || row.cost
  if (cost !== undefined && cost !== '' && cost !== null) {
    const costNum = parseFloat(cost)
    if (isNaN(costNum) || costNum < 0) {
      errors.push({ row: rowNum, message: 'Cost must be a non-negative number' })
    }
  }
  
  // Stock validation
  const stock = parseInt(row.Stock || row.stock)
  if (isNaN(stock) || stock < 0) {
    errors.push({ row: rowNum, message: 'Stock must be a non-negative integer' })
  }
  
  // Category validation
  const category = String(row.Category || row.category || '').trim()
  if (!category) {
    errors.push({ row: rowNum, message: 'Category is required' })
  } else if (!categories.value.includes(category)) {
    errors.push({ row: rowNum, message: `Category '${category}' does not exist. Valid categories: ${categories.value.join(', ')}` })
  }
  
  return errors
}

async function importProducts() {
  if (!canImport.value) return
  
  importing.value = true
  
  try {
    await productStore.bulkAddProducts(validationResults.value.validProducts)
    dialogStore.success(`Successfully imported ${validationResults.value.validCount} products`)
    emit('imported')
    emit('close')
  } catch (err) {
    dialogStore.error('Failed to import products: ' + err.message)
  } finally {
    importing.value = false
  }
}
</script>

<style scoped>
.bulk-upload-modal {
  max-width: 700px;
  width: 100%;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: var(--bg-white);
  border-radius: var(--radius-xl);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: var(--text-secondary);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.step-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.step-section:last-of-type {
  border-bottom: none;
}

.step-section h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: var(--text-primary);
}

.step-section p {
  margin: 0 0 1rem 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.download-btn, .validate-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.download-btn {
  background: var(--bg-hover);
  color: var(--primary-color);
}

.download-btn:hover:not(:disabled) {
  background: var(--primary-color);
  color: var(--text-white);
}

.validate-btn {
  background: var(--primary-gradient);
  color: var(--text-white);
  margin-top: 1rem;
}

.validate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.file-upload-area {
  position: relative;
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-lg);
  padding: 2rem;
  text-align: center;
  transition: all 0.2s;
  cursor: pointer;
}

.file-upload-area:hover {
  border-color: var(--primary-color);
  background: var(--bg-hover);
}

.file-upload-area.has-file {
  border-color: var(--primary-color);
  background: rgba(102, 126, 234, 0.05);
}

.file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.file-upload-content {
  pointer-events: none;
}

.upload-icon {
  width: 48px;
  height: 48px;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.file-name {
  color: var(--primary-color);
  font-weight: 500;
}

.validation-results {
  background: var(--bg-hover);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
}

.validation-results h3 {
  margin: 0 0 1rem 0;
}

.stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat {
  flex: 1;
  text-align: center;
  padding: 1rem;
  border-radius: var(--radius-md);
  background: var(--bg-white);
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.stat.valid .stat-number { color: #22c55e; }
.stat.invalid .stat-number { color: #ef4444; }
.stat.total .stat-number { color: var(--text-primary); }

.errors-list {
  background: rgba(239, 68, 68, 0.1);
  border-radius: var(--radius-md);
  padding: 1rem;
  margin-bottom: 1rem;
}

.errors-list h4 {
  margin: 0 0 0.75rem 0;
  color: #ef4444;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.error-items {
  max-height: 150px;
  overflow-y: auto;
}

.error-item {
  font-size: 0.875rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(239, 68, 68, 0.2);
}

.error-item:last-child {
  border-bottom: none;
}

.valid-preview h4 {
  margin: 0 0 0.75rem 0;
  color: #22c55e;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.preview-table-wrapper {
  overflow-x: auto;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  background: var(--bg-white);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.preview-table th,
.preview-table td {
  padding: 0.5rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.preview-table th {
  background: var(--bg-hover);
  font-weight: 600;
}

.more-rows {
  text-align: center;
  color: var(--text-secondary);
  font-style: italic;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.cancel-btn {
  padding: 0.75rem 1.25rem;
  background: var(--bg-hover);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
}

.import-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: var(--primary-gradient);
  color: var(--text-white);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
}

.import-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon-sm {
  width: 18px;
  height: 18px;
}
</style>
