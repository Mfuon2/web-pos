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
                <td>{{ formatDate(category.created_at) }}</td>
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
                <td>{{ formatDate(user.created_at) }}</td>
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
import { Settings, Folder, Truck, Users, Plus, Edit2, Trash2, X } from 'lucide-vue-next'
import PaginationControls from '../components/PaginationControls.vue'

import { useDialogStore } from '../stores/dialogStore'

const categoryStore = useCategoryStore()
const supplierStore = useSupplierStore()
const userStore = useUserStore()
const dialogStore = useDialogStore()

const categories = computed(() => categoryStore.categories)
const suppliers = computed(() => supplierStore.suppliers)
const users = computed(() => userStore.users)

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

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
  border-bottom: 2px solid var(--border-color);
  overflow-x: auto;
}

.tab {
  flex: 1;
  padding: 1rem 1.5rem;
  background: transparent;
  border: none;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  font-weight: 600;
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
  font-weight: 600;
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

thead {
  background: var(--primary-gradient);
  color: var(--text-white);
}

th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
}

td {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
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
  font-weight: 600;
  color: var(--text-primary);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
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
  padding: 1rem;
  background: var(--primary-gradient);
  color: var(--text-white);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
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
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: capitalize;
}

.role-badge.admin {
  background: var(--primary-color);
  color: var(--text-white);
}

.role-badge.cashier {
  background: var(--bg-hover);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}
</style>
