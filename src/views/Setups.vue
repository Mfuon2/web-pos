<template>
  <div class="setups">
    <h1>
      <Settings class="header-icon" />
      Setups & Configuration
    </h1>

    <!-- Tab Navigation -->
    <div class="tabs">
      <button 
        class="tab" 
        :class="{ active: activeTab === 'categories' }"
        @click="activeTab = 'categories'"
      >
        <Folder class="icon-sm" />
        Categories
      </button>
      <button 
        class="tab" 
        :class="{ active: activeTab === 'suppliers' }"
        @click="activeTab = 'suppliers'"
      >
        <Truck class="icon-sm" />
        Suppliers
      </button>
      <button 
        class="tab" 
        :class="{ active: activeTab === 'users' }"
        @click="activeTab = 'users'"
      >
        <Users class="icon-sm" />
        Users
      </button>
      <button 
        class="tab" 
        :class="{ active: activeTab === 'settings' }"
        @click="activeTab = 'settings'"
      >
        <Settings class="icon-sm" />
        Settings
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Categories Tab -->
      <div v-if="activeTab === 'categories'" class="content-section">
        <div class="section-header">
          <h2>Product Categories</h2>
          <button @click="openCategoryModal()" class="add-btn">
            <Plus class="icon-sm" />
            Add Category
          </button>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="category in categories" :key="category.id">
                <td><strong>{{ category.name }}</strong></td>
                <td>{{ category.description || 'N/A' }}</td>
                <td>{{ formatDate(category.createdAt) }}</td>
                <td class="actions">
                  <button @click="openCategoryModal(category)" class="action-btn edit-btn">
                    <Edit2 class="icon-sm" />
                  </button>
                  <button @click="handleDeleteCategory(category.id)" class="action-btn delete-btn">
                    <Trash2 class="icon-sm" />
                  </button>
                </td>
              </tr>
              <tr v-if="categories.length === 0">
                <td colspan="4" class="empty-state">No categories found. Add your first category.</td>
              </tr>
            </tbody>
          </table>
          <PaginationControls 
            v-if="categoryPagination.total > 0"
            :current-page="categoryPagination.page"
            :total-pages="categoryPagination.totalPages"
            :total="categoryPagination.total"
            :limit="categoryPagination.limit"
            @page-change="handleCategoryPageChange"
          />
        </div>
      </div>

      <!-- Suppliers Tab -->
      <div v-if="activeTab === 'suppliers'" class="content-section">
        <div class="section-header">
          <h2>Suppliers & Vendors</h2>
          <button @click="openSupplierModal()" class="add-btn">
            <Plus class="icon-sm" />
            Add Supplier
          </button>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact Person</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="supplier in suppliers" :key="supplier.id">
                <td><strong>{{ supplier.name }}</strong></td>
                <td>{{ supplier.contact_person || 'N/A' }}</td>
                <td>{{ supplier.phone || 'N/A' }}</td>
                <td>{{ supplier.email || 'N/A' }}</td>
                <td class="actions">
                  <button @click="openSupplierModal(supplier)" class="action-btn edit-btn">
                    <Edit2 class="icon-sm" />
                  </button>
                  <button @click="handleDeleteSupplier(supplier.id)" class="action-btn delete-btn">
                    <Trash2 class="icon-sm" />
                  </button>
                </td>
              </tr>
              <tr v-if="suppliers.length === 0">
                <td colspan="5" class="empty-state">No suppliers found. Add your first supplier.</td>
              </tr>
            </tbody>
          </table>
          <PaginationControls 
            v-if="supplierPagination.total > 0"
            :current-page="supplierPagination.page"
            :total-pages="supplierPagination.totalPages"
            :total="supplierPagination.total"
            :limit="supplierPagination.limit"
            @page-change="handleSupplierPageChange"
          />
        </div>
      </div>

      <!-- Users Tab -->
      <div v-if="activeTab === 'users'" class="content-section">
        <div class="section-header">
          <h2>User Management</h2>
          <button @click="openUserModal()" class="add-btn">
            <Plus class="icon-sm" />
            Add User
          </button>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td><strong>{{ user.username }}</strong></td>
                <td>
                  <span class="role-badge" :class="user.role">{{ user.role }}</span>
                </td>
                <td>{{ formatDate(user.createdAt) }}</td>
                <td class="actions">
                  <button @click="openUserModal(user)" class="action-btn edit-btn" title="Edit User">
                    <Edit2 class="icon-sm" />
                  </button>
                  <button @click="handleDeleteUser(user.id)" class="action-btn delete-btn" title="Delete User">
                    <Trash2 class="icon-sm" />
                  </button>
                </td>
              </tr>
              <tr v-if="users.length === 0">
                <td colspan="4" class="empty-state">No users found.</td>
              </tr>
            </tbody>
          </table>
          <PaginationControls 
            v-if="userPagination.total > 0"
            :current-page="userPagination.page"
            :total-pages="userPagination.totalPages"
            :total="userPagination.total"
            :limit="userPagination.limit"
            @page-change="handleUserPageChange"
          />
        </div>
      </div>

      <!-- Settings Tab -->
      <div v-if="activeTab === 'settings'" class="content-section">
        <div class="section-header">
          <h2>Business Settings</h2>
        </div>

        <form @submit.prevent="handleSaveSettings" class="settings-form">
          <div class="settings-section">
            <h3><Palette class="icon-sm" /> Branding</h3>
            
            <div class="form-group">
              <label>Business Name *</label>
              <input 
                v-model="settingsForm.business_name" 
                type="text" 
                required 
                placeholder="My Business"
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Primary Color</label>
                <div class="color-input-wrapper">
                  <input 
                    v-model="settingsForm.primary_color" 
                    type="color"
                    class="color-picker"
                  />
                  <input 
                    v-model="settingsForm.primary_color" 
                    type="text"
                    class="color-text"
                    placeholder="#667eea"
                  />
                </div>
              </div>

              <div class="form-group">
                <label>Secondary Color</label>
                <div class="color-input-wrapper">
                  <input 
                    v-model="settingsForm.secondary_color" 
                    type="color"
                    class="color-picker"
                  />
                  <input 
                    v-model="settingsForm.secondary_color" 
                    type="text"
                    class="color-text"
                    placeholder="#764ba2"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <h3>Currency & Tax</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label>Currency Symbol</label>
                <input 
                  v-model="settingsForm.currency_symbol" 
                  type="text" 
                  placeholder="$"
                  maxlength="3"
                />
              </div>

              <div class="form-group">
                <label>Currency Code</label>
                <input 
                  v-model="settingsForm.currency_code" 
                  type="text" 
                  placeholder="USD"
                  maxlength="3"
                />
              </div>

              <div class="form-group">
                <label>Tax Rate (%)</label>
                <input 
                  v-model.number="settingsForm.tax_rate" 
                  type="number" 
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div class="form-group">
              <label>Business Timezone</label>
              <select v-model="settingsForm.timezone">
                <option value="Africa/Nairobi">Africa/Nairobi (EAT - UTC+3)</option>
                <option value="Africa/Lagos">Africa/Lagos (WAT - UTC+1)</option>
                <option value="Africa/Cairo">Africa/Cairo (EET - UTC+2)</option>
                <option value="Africa/Johannesburg">Africa/Johannesburg (SAST - UTC+2)</option>
                <option value="Africa/Accra">Africa/Accra (GMT - UTC+0)</option>
                <option value="Africa/Casablanca">Africa/Casablanca (WET - UTC+0/+1)</option>
                <option value="UTC">UTC (Coordinated Universal Time)</option>
              </select>
            </div>
          </div>

          <div class="settings-section">
            <h3>Contact Information</h3>
            
            <div class="form-group">
              <label>Address</label>
              <textarea 
                v-model="settingsForm.address" 
                rows="2"
                placeholder="123 Main St, City, Country"
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Phone</label>
                <input 
                  v-model="settingsForm.phone" 
                  type="tel" 
                  placeholder="+1234567890"
                />
              </div>

              <div class="form-group">
                <label>Email</label>
                <input 
                  v-model="settingsForm.email" 
                  type="email" 
                  placeholder="contact@business.com"
                />
              </div>
            </div>

            <div class="form-group">
              <label>Logo URL (Optional)</label>
              <input 
                v-model="settingsForm.logo_url" 
                type="url" 
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>

          <button type="submit" class="submit-btn" :disabled="settingsStore.loading">
            {{ settingsStore.loading ? 'Saving...' : 'Save Settings' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Category Modal -->
    <div v-if="showCategoryModal" class="modal-overlay" @click.self="closeCategoryModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ editingCategory ? 'Edit Category' : 'Add Category' }}</h2>
          <button @click="closeCategoryModal" class="close-btn">
            <X class="icon-sm" />
          </button>
        </div>
        <form @submit.prevent="handleSaveCategory">
          <div class="form-group">
            <label>Name *</label>
            <input v-model="categoryForm.name" type="text" required />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="categoryForm.description" rows="3"></textarea>
          </div>
          <button type="submit" class="submit-btn">
            {{ editingCategory ? 'Update' : 'Create' }} Category
          </button>
        </form>
      </div>
    </div>

    <!-- Supplier Modal -->
    <div v-if="showSupplierModal" class="modal-overlay" @click.self="closeSupplierModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ editingSupplier ? 'Edit Supplier' : 'Add Supplier' }}</h2>
          <button @click="closeSupplierModal" class="close-btn">
            <X class="icon-sm" />
          </button>
        </div>
        <form @submit.prevent="handleSaveSupplier">
          <div class="form-group">
            <label>Name *</label>
            <input v-model="supplierForm.name" type="text" required />
          </div>
          <div class="form-group">
            <label>Contact Person</label>
            <input v-model="supplierForm.contact_person" type="text" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Phone</label>
              <input v-model="supplierForm.phone" type="tel" />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input v-model="supplierForm.email" type="email" />
            </div>
          </div>
          <div class="form-group">
            <label>Address</label>
            <textarea v-model="supplierForm.address" rows="2"></textarea>
          </div>
          <button type="submit" class="submit-btn">
            {{ editingSupplier ? 'Update' : 'Create' }} Supplier
          </button>
        </form>
      </div>
    </div>

    <!-- User Modal -->
    <div v-if="showUserModal" class="modal-overlay" @click.self="closeUserModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ editingUser ? 'Edit User' : 'Add User' }}</h2>
          <button @click="closeUserModal" class="close-btn">
            <X class="icon-sm" />
          </button>
        </div>
        <form @submit.prevent="handleSaveUser">
          <div class="form-group">
            <label>Username *</label>
            <input v-model="userForm.username" type="text" required :disabled="!!editingUser" />
          </div>
          
          <div class="form-group">
            <label>Role *</label>
            <select v-model="userForm.role" required>
              <option value="cashier">Cashier</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div class="form-group">
            <label>{{ editingUser ? 'New Password (leave blank to keep current)' : 'Password *' }}</label>
            <input v-model="userForm.password" type="password" :required="!editingUser" />
          </div>

          <button type="submit" class="submit-btn">
            {{ editingUser ? 'Update' : 'Create' }} User
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCategoryStore } from '../stores/categoryStore'
import { useSupplierStore } from '../stores/supplierStore'
import { useUserStore } from '../stores/userStore'
import { Settings, Folder, Truck, Users, Plus, Edit2, Trash2, X, Palette } from 'lucide-vue-next'
import PaginationControls from '../components/PaginationControls.vue'

import { useDialogStore } from '../stores/dialogStore'
import { useSettingsStore } from '../stores/settingsStore'

const categoryStore = useCategoryStore()
const supplierStore = useSupplierStore()
const userStore = useUserStore()
const dialogStore = useDialogStore()
const settingsStore = useSettingsStore()

const categories = computed(() => categoryStore.categories)
const suppliers = computed(() => supplierStore.suppliers)
const users = computed(() => userStore.users)
const currentSettings = computed(() => settingsStore.settings)

const categoryPagination = computed(() => categoryStore.pagination)
const supplierPagination = computed(() => supplierStore.pagination)
const userPagination = computed(() => userStore.pagination)

const activeTab = ref('categories')
const showCategoryModal = ref(false)
const showSupplierModal = ref(false)
const showUserModal = ref(false)
const editingCategory = ref(null)
const editingSupplier = ref(null)
const editingUser = ref(null)

const categoryForm = ref({
  name: '',
  description: ''
})

const supplierForm = ref({
  name: '',
  contact_person: '',
  phone: '',
  email: '',
  address: ''
})

const userForm = ref({
  username: '',
  password: '',
  role: 'cashier'
})

const settingsForm = ref({
  business_name: '',
  primary_color: '#667eea',
  secondary_color: '#764ba2',
  currency_symbol: '$',
  currency_code: 'USD',
  tax_rate: 0,
  timezone: 'Africa/Nairobi',
  logo_url: '',
  address: '',
  phone: '',
  email: ''
})

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  if (typeof dateString === 'string') {
    dateString = dateString.replace(' ', 'T')
  }
  return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Settings functions
async function loadSettings() {
  if (currentSettings.value) {
    // Map camelCase API response to snake_case form fields
    settingsForm.value = {
      business_name: currentSettings.value.businessName || '',
      primary_color: currentSettings.value.primaryColor || '#667eea',
      secondary_color: currentSettings.value.secondaryColor || '#764ba2',
      currency_symbol: currentSettings.value.currencySymbol || '$',
      currency_code: currentSettings.value.currencyCode || 'USD',
      tax_rate: currentSettings.value.taxRate || 0,
      timezone: currentSettings.value.timezone || 'Africa/Nairobi',
      logo_url: currentSettings.value.logoUrl || '',
      address: currentSettings.value.address || '',
      phone: currentSettings.value.phone || '',
      email: currentSettings.value.email || ''
    }
  }
}

async function handleSaveSettings() {
  try {
    await settingsStore.updateSettings(settingsForm.value)
    dialogStore.success('Settings saved successfully!')
  } catch (err) {
    dialogStore.error('Failed to save settings: ' + err.message)
  }
}

// Category functions
async function handleCategoryPageChange(page) {
  await categoryStore.fetchCategories({ page, limit: 20 })
}

function openCategoryModal(category = null) {
  if (category) {
    editingCategory.value = category
    categoryForm.value = { ...category }
  } else {
    editingCategory.value = null
    categoryForm.value = { name: '', description: '' }
  }
  showCategoryModal.value = true
}

function closeCategoryModal() {
  showCategoryModal.value = false
  editingCategory.value = null
  categoryForm.value = { name: '', description: '' }
}

async function handleSaveCategory() {
  try {
    if (editingCategory.value) {
      await categoryStore.updateCategory(editingCategory.value.id, categoryForm.value)
      dialogStore.success('Category updated successfully')
    } else {
      await categoryStore.addCategory(categoryForm.value)
      dialogStore.success('Category added successfully')
    }
    closeCategoryModal()
  } catch (error) {
    dialogStore.error('Failed to save category: ' + error.message)
  }
}

async function handleDeleteCategory(id) {
  const confirmed = await dialogStore.confirm('Are you sure you want to delete this category?')
  if (confirmed) {
    try {
      await categoryStore.deleteCategory(id)
      dialogStore.success('Category deleted successfully')
    } catch (error) {
      dialogStore.error('Failed to delete category: ' + error.message)
    }
  }
}

// Supplier functions
async function handleSupplierPageChange(page) {
  await supplierStore.fetchSuppliers({ page, limit: 20 })
}

function openSupplierModal(supplier = null) {
  if (supplier) {
    editingSupplier.value = supplier
    supplierForm.value = { ...supplier }
  } else {
    editingSupplier.value = null
    supplierForm.value = {
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: ''
    }
  }
  showSupplierModal.value = true
}

function closeSupplierModal() {
  showSupplierModal.value = false
  editingSupplier.value = null
  supplierForm.value = {
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: ''
  }
}

async function handleSaveSupplier() {
  try {
    if (editingSupplier.value) {
      await supplierStore.updateSupplier(editingSupplier.value.id, supplierForm.value)
      dialogStore.success('Supplier updated successfully')
    } else {
      await supplierStore.addSupplier(supplierForm.value)
      dialogStore.success('Supplier added successfully')
    }
    closeSupplierModal()
  } catch (error) {
    dialogStore.error('Failed to save supplier: ' + error.message)
  }
}

async function handleDeleteSupplier(id) {
  const confirmed = await dialogStore.confirm('Are you sure you want to delete this supplier?')
  if (confirmed) {
    try {
      await supplierStore.deleteSupplier(id)
      dialogStore.success('Supplier deleted successfully')
    } catch (error) {
      dialogStore.error('Failed to delete supplier: ' + error.message)
    }
  }
}

// User functions
async function handleUserPageChange(page) {
  await userStore.fetchUsers({ page, limit: 20 })
}

function openUserModal(user = null) {
  if (user) {
    editingUser.value = user
    userForm.value = { 
      username: user.username,
      role: user.role,
      password: '' // Don't show password
    }
  } else {
    editingUser.value = null
    userForm.value = {
      username: '',
      password: '',
      role: 'cashier'
    }
  }
  showUserModal.value = true
}

function closeUserModal() {
  showUserModal.value = false
  editingUser.value = null
  userForm.value = {
    username: '',
    password: '',
    role: 'cashier'
  }
}

async function handleSaveUser() {
  try {
    if (editingUser.value) {
      const updates = { role: userForm.value.role }
      if (userForm.value.password) {
        updates.password = userForm.value.password
      }
      await userStore.updateUser(editingUser.value.id, updates)
      dialogStore.success('User updated successfully')
    } else {
      await userStore.addUser(userForm.value)
      dialogStore.success('User added successfully')
    }
    closeUserModal()
  } catch (error) {
    dialogStore.error('Failed to save user: ' + error.message)
  }
}

async function handleDeleteUser(id) {
  const confirmed = await dialogStore.confirm('Are you sure you want to delete this user?')
  if (confirmed) {
    try {
      await userStore.deleteUser(id)
      dialogStore.success('User deleted successfully')
    } catch (error) {
      dialogStore.error('Failed to delete user: ' + error.message)
    }
  }
}

onMounted(async () => {
  await categoryStore.fetchCategories({ page: 1, limit: 20 })
  await supplierStore.fetchSuppliers({ page: 1, limit: 20 })
  await userStore.fetchUsers({ page: 1, limit: 20 })
  
  // Load settings if they exist
  if (currentSettings.value) {
    loadSettings()
  }
})

// Watch for settings changes and update form
import { watch } from 'vue'
watch(() => currentSettings.value, (newSettings) => {
  if (newSettings) {
    settingsForm.value = {
      business_name: newSettings.businessName || '',
      primary_color: newSettings.primaryColor || '#667eea',
      secondary_color: newSettings.secondaryColor || '#764ba2',
      currency_symbol: newSettings.currencySymbol || '$',
      currency_code: newSettings.currencyCode || 'USD',
      tax_rate: newSettings.taxRate || 0,
      timezone: newSettings.timezone || 'Africa/Nairobi',
      logo_url: newSettings.logoUrl || '',
      address: newSettings.address || '',
      phone: newSettings.phone || '',
      email: newSettings.email || ''
    }
  }
})
</script>

<style scoped>
.setups {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.setups h1 {
  margin-bottom: var(--spacing-lg);
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

.icon-sm {
  width: 18px;
  height: 18px;
}

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
}

.add-btn {
  padding: 0.75rem 1.5rem;
  background: var(--primary-gradient);
  color: var(--text-white);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.table-container {
  background: var(--bg-white);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

td {
  border-bottom: var(--border-width) solid var(--border-color);
}

tr:last-child td {
  border-bottom: none;
}

tbody tr:hover {
  background: var(--bg-hover);
}

.empty-state {
  text-align: center;
  color: var(--text-secondary);
  padding: 3rem !important;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.5rem;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-btn {
  background: var(--bg-hover);
  color: var(--primary-color);
}

.edit-btn:hover {
  background: var(--primary-color);
  color: var(--text-white);
}

.delete-btn {
  background: var(--danger-light);
  color: var(--danger-bg);
}

.delete-btn:hover {
  background: var(--danger-bg);
  color: var(--text-white);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.3s ease;
  max-height: 90vh;
  overflow-y: auto;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h2 {
  margin: 0;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: var(--text-secondary);
  transition: color 0.2s;
}

.close-btn:hover {
  color: var(--text-primary);
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-primary);
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.4rem 0.4rem;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 1rem;
  transition: border-color 0.2s;
  background-color: var(--bg-white);
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary-color);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.submit-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--primary-gradient);
  color: var(--text-white);
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

@media (max-width: 768px) {
  .setups {
    padding: 1rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .tabs {
    flex-wrap: nowrap;
  }

  .tab {
    min-width: 120px;
    padding: 0.75rem 1rem;
  }

  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .add-btn {
    width: 100%;
    justify-content: center;
  }
}


.role-badge {
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: capitalize;
}

.role-badge.admin {
  background: var(--primary-color);
  color: var(--text-white);
}

.role-badge.cashier {
  background: var(--bg-hover);
  color: var(--text-secondary);
  border: var(--border-width) solid var(--border-color);
}

/* Mobile Responsive Styles */
@media (max-width: 768px) {
  .setups {
    padding: 1rem;
  }
  
  .setups h1 {
    font-size: var(--font-size-xl);
  }
  
  .header-icon {
    width: 24px;
    height: 24px;
  }
  
  .icon-sm {
    width: 16px;
    height: 16px;
  }
  
  .tabs {
    flex-wrap: nowrap;
    overflow-x: auto;
    gap: 0.5rem;
    -webkit-overflow-scrolling: touch;
  }
  
  .tab {
    padding: 0.75rem 1rem;
    min-width: auto;
    font-size: var(--font-size-sm);
  }
  
  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .section-header h2 {
    font-size: var(--font-size-lg);
  }
  
  .add-btn {
    width: 100%;
    justify-content: center;
    padding: 0.75rem;
    font-size: var(--font-size-sm);
  }
  
  .table-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  table {
    min-width: 600px;
    font-size: var(--font-size-sm);
  }
  
  th, td {
    padding: 0.75rem 0.5rem;
    font-size: var(--font-size-xs);
  }
  
  .empty-state {
    padding: 2rem 1rem !important;
    font-size: var(--font-size-sm);
  }
  
  .modal-content {
    max-width: 100%;
    width: calc(100% - 2rem);
    padding: 1.5rem;
    margin: 0 1rem;
  }
  
  .modal-header h2 {
    font-size: var(--font-size-lg);
  }
  
  .form-group label {
    font-size: var(--font-size-sm);
  }
  
  .form-group input,
  .form-group textarea,
  .form-group select {
    font-size: var(--font-size-base);
    padding: 0.65rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .submit-btn {
    padding: 0.875rem;
    font-size: var(--font-size-base);
  }
  
  .role-badge {
    font-size: var(--font-size-xs);
    padding: 0.25rem 0.5rem;
  }
}

/* Settings Form Styles */
.settings-form {
  max-width: 800px;
}

.settings-section {
  background: var(--bg-white);
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  margin-bottom: 1.5rem;
  box-shadow: var(--shadow-sm);
  border: var(--border-width) solid var(--border-color);
}

.settings-section h3 {
  margin: 0 0 1.25rem 0;
  color: var(--text-primary);
  font-size: var(--font-size-lg);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.color-input-wrapper {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.color-picker {
  width: 60px;
  height: 44px;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: border-color 0.2s;
}

.color-picker:hover {
  border-color: var(--primary-color);
}

.color-text {
  flex: 1;
  padding: 0.75rem;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-family: monospace;
  text-transform: uppercase;
}

.settings-form .submit-btn {
  margin-top: 1rem;
}
</style>

