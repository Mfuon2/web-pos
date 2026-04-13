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
        v-if="isAdmin"
        class="tab"
        :class="{ active: activeTab === 'inventory' }"
        @click="activeTab = 'inventory'"
      >
        <Package class="icon-sm" />
        All Products
      </button>
      <button
        v-if="isAdmin"
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
      <div
        v-if="
          isAdmin && (activeTab === 'inventory' || activeTab === 'low_stock')
        "
        class="content-section"
      >
        <div class="section-header">
          <h2>
            {{
              activeTab === "low_stock"
                ? "Restock Needed (Stock < 1)"
                : "Product List"
            }}
          </h2>
          <div class="header-actions">
            <div class="search-input-wrapper desktop-search">
              <Search class="search-icon" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search by name or barcode..."
                class="search-input"
              />
              <button
                v-if="searchQuery"
                @click="searchQuery = ''"
                class="clear-search"
              >
                ✕
              </button>
            </div>
            <button
              @click="exportToExcel"
              class="export-btn"
              :disabled="exporting"
              v-if="activeTab === 'inventory'"
            >
              <Download class="icon-sm" />
              <span class="btn-text">Export</span>
            </button>
            <button
              @click="showBulkUploadModal = true"
              class="upload-btn"
              v-if="activeTab === 'inventory'"
            >
              <Upload class="icon-sm" />
              <span class="btn-text">Upload</span>
            </button>
            <button
              @click="openAddModal"
              class="add-btn"
              v-if="activeTab === 'inventory'"
            >
              + Product
            </button>
          </div>
        </div>

        <!-- Mobile Search Bar (Only shown on small screens) -->
        <div class="search-bar-container mobile-search">
          <div class="search-input-wrapper">
            <Search class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by name or barcode..."
              class="search-input"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="clear-search"
            >
              ✕
            </button>
          </div>
        </div>

        <DataListing
          :data="products"
          :columns="computedInventoryColumns"
          rowKey="id"
          :rowClass="(product) => (product.deleted_at ? 'deleted-row' : '')"
        >
          <template #cell-name="{ item }">
            <span :class="{ strikethrough: item.deleted_at }">{{
              item.name
            }}</span>
            <span v-if="item.deleted_at" class="deleted-badge">Deleted</span>
          </template>

          <template #cell-barcode="{ item }">
            <code>{{ item.barcode || "N/A" }}</code>
          </template>

          <template #cell-price="{ item }">
            {{ formatCurrency(item.price) }}
          </template>

          <template #cell-cost="{ item }">
            {{ formatCurrency(item.cost || 0) }}
          </template>

          <template #cell-profit="{ item }">
            {{ formatCurrency(item.price - (item.cost || 0)) }}
          </template>

          <template #cell-stock="{ item }">
            <span :class="{ 'low-stock': item.stock < 10 }">{{
              item.stock
            }}</span>
          </template>

          <template #cell-value="{ item }">
            {{ formatCurrency(item.price * item.stock) }}
          </template>

          <template #cell-category="{ item }">
            {{ item.category || "N/A" }}
          </template>

          <template #cell-actions="{ item }">
            <div class="actions">
              <button
                @click="openEditModal(item)"
                class="action-btn edit-btn"
                title="Edit"
                :disabled="!!item.deleted_at"
              >
                <Edit2 class="icon-sm" />
              </button>
              <button
                @click="handleDelete(item.id)"
                class="action-btn delete-btn"
                title="Delete"
                :disabled="!!item.deleted_at"
              >
                <Trash2 class="icon-sm" />
              </button>
            </div>
          </template>

          <template #pagination>
            <PaginationControls
              v-if="pagination.total > 0"
              :current-page="pagination.page"
              :total-pages="pagination.totalPages"
              :total="pagination.total"
              :limit="pagination.limit"
              @page-change="handlePageChange"
            />
          </template>
        </DataListing>
      </div>

      <!-- Borrowed Tab -->
      <div v-if="activeTab === 'borrowed'" class="content-section">
        <div class="section-header">
          <h2>Borrowed Inventory</h2>
          <div class="header-actions">
            <div class="search-input-wrapper desktop-search">
              <Search class="icon-sm search-icon" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search borrowed items..."
                class="search-input"
              />
              <button
                v-if="searchQuery"
                @click="searchQuery = ''"
                class="clear-search"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <!-- Mobile Search Bar -->
        <div class="search-bar-container mobile-search">
          <div class="search-input-wrapper">
            <Search class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by name, barcode or source..."
              class="search-input"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="clear-search"
            >
              ✕
            </button>
          </div>
          <div class="header-actions">
            <div class="search-input-wrapper desktop-search">
              <Search class="icon-sm search-icon" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search by name, barcode or source..."
                class="search-input"
              />
              <button
                v-if="searchQuery"
                @click="searchQuery = ''"
                class="clear-search"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <DataListing
          :data="borrowedItems"
          :columns="borrowedColumns"
          rowKey="id"
        >
          <template #cell-product="{ item }">
            <strong>{{ item.product_name }}</strong>
            <br />
            <small>{{ item.product_barcode }}</small>
          </template>

          <template #cell-status="{ item }">
            <div class="status-container">
              <span class="status-badge" :class="item.status">{{
                item.status
              }}</span>
              <div
                v-if="
                  item.status !== 'pending' ||
                  (item.returned_quantity === 0 && item.paid_quantity === 0)
                "
                class="return-progress"
              >
                <small v-if="item.returned_quantity > 0"
                  >{{ item.returned_quantity }} returned</small
                >
                <small v-if="item.paid_quantity > 0"
                  >{{ item.paid_quantity }} paid</small
                >
                <small
                  v-if="
                    (item.returned_quantity || 0) === 0 &&
                    (item.paid_quantity || 0) === 0
                  "
                  >0 / {{ item.quantity }} settled</small
                >
                <small
                  v-else-if="
                    (item.returned_quantity || 0) + (item.paid_quantity || 0) <
                    item.quantity
                  "
                  >({{
                    (item.returned_quantity || 0) + (item.paid_quantity || 0)
                  }}
                  / {{ item.quantity }})</small
                >
              </div>
            </div>
          </template>

          <template #cell-date="{ item }">
            <div>
              {{
                item.borrowed_at
                  ? formatDateWithoutTime(item.borrowed_at)
                  : formatDateWithoutTime(item.created_at)
              }}
            </div>
            <small class="text-secondary" style="font-size: 0.8em"
              >Created: {{ formatDate(item.created_at) }}</small
            >
          </template>

          <template #cell-actions="{ item }">
            <div class="actions">
              <button
                @click="openManageBorrowedModal(item)"
                class="action-btn manage-btn"
                title="Manage Returns / Payment"
                v-if="item.status !== 'returned' && item.status !== 'paid'"
              >
                <Check class="icon-sm" />
              </button>
              <button
                @click="openEditBorrowedModal(item)"
                class="action-btn edit-btn"
                title="Edit Details"
                v-if="item.status !== 'returned' && item.status !== 'paid'"
              >
                <Edit2 class="icon-sm" />
              </button>
              <button
                @click="openViewBorrowedModal(item)"
                class="action-btn view-btn"
                title="View Details"
                v-if="item.status === 'returned' || item.status === 'paid'"
              >
                <Eye class="icon-sm" />
              </button>
            </div>
          </template>

          <template #empty> No borrowed items recorded. </template>
        </DataListing>
      </div>

      <!-- Loaned Tab -->
      <div v-if="activeTab === 'loaned'" class="content-section">
        <div class="section-header">
          <h2>Loaned Inventory</h2>
          <div class="header-actions">
            <div class="search-input-wrapper desktop-search">
              <Search class="icon-sm search-icon" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search by name, barcode or borrower..."
                class="search-input"
              />
              <button
                v-if="searchQuery"
                @click="searchQuery = ''"
                class="clear-search"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <!-- Mobile Search Bar -->
        <div class="search-bar-container mobile-search">
          <div class="search-input-wrapper">
            <Search class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by name, barcode or borrower..."
              class="search-input"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="clear-search"
            >
              ✕
            </button>
          </div>
        </div>

        <DataListing :data="loans" :columns="loanedColumns" rowKey="id">
          <template #cell-borrower="{ item }">
            <strong>{{ item.borrower_name }}</strong>
            <div v-if="item.borrower_contact">
              <small>{{ item.borrower_contact }}</small>
            </div>
          </template>

          <template #cell-items="{ item }">
            <ul class="loan-items-list">
              <li v-for="loanItem in item.items" :key="loanItem.product_id">
                {{ loanItem.quantity }}x {{ loanItem.product_name }}
              </li>
            </ul>
          </template>

          <template #cell-collateral="{ item }">
            <div v-if="item.collateral">
              <strong>{{ item.collateral }}</strong>
              <div v-if="item.collateral_description">
                <small>{{ item.collateral_description }}</small>
              </div>
            </div>
            <span v-else class="text-secondary">None</span>
          </template>

          <template #cell-status="{ item }">
            <div class="status-container">
              <span class="status-badge" :class="item.status">{{
                item.status
              }}</span>
              <div
                v-if="item.status === 'partially_returned'"
                class="return-progress"
              >
                <small>{{ getLoanReturnProgress(item) }}</small>
              </div>
            </div>
          </template>

          <template #cell-date="{ item }">
            <div>
              {{
                item.loaned_at
                  ? formatDateWithoutTime(item.loaned_at)
                  : formatDateWithoutTime(item.created_at)
              }}
            </div>
            <small class="text-secondary" style="font-size: 0.8em"
              >Created: {{ formatDate(item.created_at) }}</small
            >
          </template>

          <template #cell-actions="{ item }">
            <div class="actions">
              <button
                @click="openManageLoanModal(item)"
                class="action-btn manage-btn"
                title="Manage Returns"
                v-if="item.status !== 'returned'"
              >
                <Check class="icon-sm" />
              </button>
              <button
                @click="openEditLoanModal(item)"
                class="action-btn edit-btn"
                title="Update Details"
                v-if="item.status !== 'returned'"
              >
                <Edit2 class="icon-sm" />
              </button>
              <button
                @click="openViewLoanModal(item)"
                class="action-btn view-btn"
                title="View Details"
                v-if="item.status === 'returned'"
              >
                <Eye class="icon-sm" />
              </button>
            </div>
          </template>

          <template #empty> No active loans. </template>
        </DataListing>
      </div>
    </div>

    <!-- Edit Borrowed Item Modal -->
    <div
      v-if="showEditBorrowedModal"
      class="modal-overlay"
      @click="closeEditBorrowedModal"
    >
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Edit Borrowed Item</h2>
          <button class="close-btn" @click="closeEditBorrowedModal">✕</button>
        </div>
        <form @submit.prevent="handleUpdateBorrowedItem">
          <div class="form-group">
            <label>Product</label>
            <input
              type="text"
              :value="borrowedForm.productName"
              disabled
              class="disabled-input"
            />
          </div>
          <div class="form-group">
            <label>Available Status *</label>
            <select
              v-model="borrowedForm.status"
              disabled
              class="disabled-input"
            >
              <option value="pending">Pending</option>
              <option value="returned">Returned</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div class="form-group">
            <label>Borrowed Date</label>
            <input v-model="borrowedForm.borrowed_at" type="date" />
          </div>
          <div class="form-group">
            <label>Borrowed From *</label>
            <input v-model="borrowedForm.borrowed_from" type="text" required />
          </div>
          <div class="form-group">
            <label>Reason / Notes</label>
            <textarea v-model="borrowedForm.reason" rows="2"></textarea>
          </div>
          <button
            type="submit"
            class="submit-btn"
            :disabled="borrowedStore.loading"
          >
            {{ borrowedStore.loading ? "Updating..." : "Update Record" }}
          </button>
        </form>
      </div>
    </div>

    <!-- Manage Borrowed Item Modal -->
    <div
      v-if="showManageBorrowedModal"
      class="modal-overlay"
      @click="closeManageBorrowedModal"
    >
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Manage Borrowed Item</h2>
          <button class="close-btn" @click="closeManageBorrowedModal">✕</button>
        </div>
        <div class="management-info" v-if="editingBorrowedDetail">
          <p>
            <strong>Product:</strong> {{ editingBorrowedDetail.product_name }}
          </p>
          <p>
            <strong>Borrowed From:</strong>
            {{ editingBorrowedDetail.borrowed_from }}
          </p>
          <p>
            <strong>Total Quantity:</strong>
            {{ editingBorrowedDetail.quantity }}
          </p>
          <p>
            <strong>Settled:</strong>
            {{
              (editingBorrowedDetail.returned_quantity || 0) +
              (editingBorrowedDetail.paid_quantity || 0)
            }}
            ({{ editingBorrowedDetail.returned_quantity || 0 }} ret,
            {{ editingBorrowedDetail.paid_quantity || 0 }} paid)
          </p>
          <p>
            <strong>Remaining:</strong>
            {{
              editingBorrowedDetail.quantity -
              ((editingBorrowedDetail.returned_quantity || 0) +
                (editingBorrowedDetail.paid_quantity || 0))
            }}
          </p>
        </div>

        <div class="management-actions">
          <div class="action-section">
            <h3>Record Return</h3>
            <form @submit.prevent="handleReturnItems" class="inline-form">
              <div class="form-group">
                <label>Quantity to Return</label>
                <input
                  type="number"
                  v-model.number="managementForm.returnQuantity"
                  :max="
                    editingBorrowedDetail.quantity -
                    ((editingBorrowedDetail.returned_quantity || 0) +
                      (editingBorrowedDetail.paid_quantity || 0))
                  "
                  min="1"
                  required
                />
              </div>
              <button
                type="submit"
                class="submit-btn"
                :disabled="
                  borrowedStore.loading ||
                  editingBorrowedDetail.quantity -
                    ((editingBorrowedDetail.returned_quantity || 0) +
                      (editingBorrowedDetail.paid_quantity || 0)) <=
                    0
                "
              >
                {{ borrowedStore.loading ? "Recording..." : "Confirm Return" }}
              </button>
            </form>
          </div>

          <div class="divider">OR</div>

          <div class="action-section">
            <h3>Mark as Paid</h3>
            <div class="inline-form">
              <div class="form-group">
                <label>Quantity to Pay For</label>
                <input
                  type="number"
                  v-model.number="managementForm.payQuantity"
                  :max="
                    editingBorrowedDetail.quantity -
                    ((editingBorrowedDetail.returned_quantity || 0) +
                      (editingBorrowedDetail.paid_quantity || 0))
                  "
                  min="1"
                  required
                />
              </div>
              <div class="form-group price-input-group">
                <label>Price per Item</label>
                <input
                  class="price-input"
                  type="number"
                  step="0.01"
                  v-model.number="managementForm.unitPrice"
                  min="0"
                  required
                />
              </div>
              <button
                @click="handleMarkAsPaid"
                class="submit-btn paid-btn"
                :disabled="
                  borrowedStore.loading ||
                  editingBorrowedDetail.quantity -
                    ((editingBorrowedDetail.returned_quantity || 0) +
                      (editingBorrowedDetail.paid_quantity || 0)) <=
                    0
                "
              >
                {{
                  borrowedStore.loading ? "Processing..." : "Confirm Payment"
                }}
              </button>
            </div>
            <p class="hint mt-2" v-if="managementForm.payQuantity > 0">
              This will record an expense of
              {{
                formatCurrency(
                  (Number(managementForm.unitPrice) || 0) *
                    Number(managementForm.payQuantity),
                )
              }}.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- View Borrowed Item Modal -->
    <div
      v-if="showViewBorrowedModal"
      class="modal-overlay"
      @click="closeViewBorrowedModal"
    >
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Borrowed Item Details</h2>
          <button class="close-btn" @click="closeViewBorrowedModal">✕</button>
        </div>
        <div class="management-info" v-if="viewingBorrowedDetail">
          <p>
            <strong>Product:</strong> {{ viewingBorrowedDetail.product_name }}
          </p>
          <p>
            <strong>Borrowed From:</strong>
            {{ viewingBorrowedDetail.borrowed_from }}
          </p>
          <p>
            <strong>Total Quantity:</strong>
            {{ viewingBorrowedDetail.quantity }}
          </p>
          <p>
            <strong>Settled:</strong>
            {{
              (viewingBorrowedDetail.returned_quantity || 0) +
              (viewingBorrowedDetail.paid_quantity || 0)
            }}
            ({{ viewingBorrowedDetail.returned_quantity || 0 }} ret,
            {{ viewingBorrowedDetail.paid_quantity || 0 }} paid)
          </p>
          <p>
            <strong>Status:</strong>
            <span class="status-badge" :class="viewingBorrowedDetail.status">{{
              viewingBorrowedDetail.status
            }}</span>
          </p>
          <p>
            <strong>Date:</strong>
            {{
              viewingBorrowedDetail.borrowed_at
                ? formatDateWithoutTime(viewingBorrowedDetail.borrowed_at)
                : formatDateWithoutTime(viewingBorrowedDetail.created_at)
            }}
          </p>
          <p v-if="viewingBorrowedDetail.paid_amount > 0">
            <strong>Amount Paid:</strong>
            {{ formatCurrency(viewingBorrowedDetail.paid_amount) }}
          </p>
          <p v-if="viewingBorrowedDetail.reason">
            <strong>Reason / Notes:</strong> {{ viewingBorrowedDetail.reason }}
          </p>
        </div>
      </div>
    </div>
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ isEditing ? "Edit Product" : "Add New Product" }}</h2>
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
              <input
                v-model.number="formData.price"
                type="number"
                step="0.01"
                required
              />
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
              <select v-model="formData.categoryId" required>
                <option :value="null">Select Category</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- Image Upload Section -->
          <div class="form-group image-upload-section">
            <label>Product Image</label>
            <div class="image-preview" v-if="imagePreview || formData.image">
              <img
                :src="imagePreview || formData.image"
                alt="Product preview"
              />
              <button
                type="button"
                class="remove-image-btn"
                @click="removeImage"
              >
                <Trash2 class="icon-sm" /> Remove Image
              </button>
            </div>
            <div class="upload-controls" v-else>
              <div class="upload-buttons">
                <button
                  type="button"
                  class="upload-opt-btn"
                  @click="$refs.imageInput.click()"
                >
                  <ImageIcon class="icon-md" />
                  <span>Browse Files</span>
                </button>
                <button
                  type="button"
                  class="upload-opt-btn camera-btn"
                  @click="$refs.cameraInput.click()"
                >
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
            {{ isEditing ? "Update Product" : "Add Product" }}
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
    <div
      v-if="showEditLoanModal"
      class="modal-overlay"
      @click.self="closeEditLoanModal"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h2>Update Loan</h2>
          <button class="close-btn" @click="closeEditLoanModal">✕</button>
        </div>

        <form @submit.prevent="handleUpdateLoan">
          <div class="form-group">
            <label>Status</label>
            <select v-model="loanForm.status" disabled class="disabled-input">
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
            <textarea
              v-model="loanForm.collateral_description"
              rows="2"
            ></textarea>
          </div>

          <button
            type="submit"
            class="submit-btn"
            :disabled="loanStore.loading"
          >
            {{ loanStore.loading ? "Updating..." : "Update Loan" }}
          </button>
        </form>
      </div>
    </div>

    <!-- Manage Loan Modal -->
    <div
      v-if="showManageLoanModal"
      class="modal-overlay"
      @click.self="closeManageLoanModal"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h2>Manage Loan - {{ editingLoanDetail?.borrower_name }}</h2>
          <button class="close-btn" @click="closeManageLoanModal">✕</button>
        </div>

        <div class="management-info" v-if="editingLoanDetail">
          <p>
            <strong>Borrower:</strong> {{ editingLoanDetail.borrower_name }}
          </p>
          <p v-if="editingLoanDetail.collateral">
            <strong>Collateral:</strong> {{ editingLoanDetail.collateral }}
          </p>
          <p>
            <strong>Date:</strong>
            {{ formatDate(editingLoanDetail.created_at) }}
          </p>
        </div>

        <div class="management-actions">
          <div
            v-for="item in editingLoanDetail?.items"
            :key="item.product_id"
            class="action-section"
          >
            <h3>{{ item.product_name }}</h3>
            <p class="hint">
              {{ item.returned_quantity || 0 }} / {{ item.quantity }} returned
            </p>

            <div
              v-if="item.returns && item.returns.length > 0"
              class="returns-history"
            >
              <h4>Return History:</h4>
              <ul>
                <li v-for="ret in item.returns" :key="ret.id">
                  <span v-if="ret.replacement_product_id">
                    Verified: {{ ret.quantity }} substituted with
                    <strong>{{ ret.replacement_name }}</strong>
                  </span>
                  <span v-else>
                    Verified: {{ ret.quantity }} returned as original
                  </span>
                  <small class="text-secondary">
                    ({{ formatDate(ret.created_at) }})
                  </small>
                </li>
              </ul>
            </div>

            <form
              @submit.prevent="handleReturnLoanItems(item)"
              class="inline-form"
              v-if="(item.returned_quantity || 0) < item.quantity"
            >
              <div class="form-group">
                <label>Qty to Return</label>
                <input
                  class="price-input"
                  type="number"
                  v-model.number="managementLoanForm[item.product_id].quantity"
                  :max="item.quantity - (item.returned_quantity || 0)"
                  min="1"
                  required
                />
              </div>

              <div class="substitution-section">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    v-model="managementLoanForm[item.product_id].isSubstitution"
                  />
                  Substitute Item?
                </label>

                <div
                  v-if="managementLoanForm[item.product_id].isSubstitution"
                  class="form-group"
                >
                  <label>Replace with:</label>
                  <SearchableSelect
                    v-model="
                      managementLoanForm[item.product_id].replacementProductId
                    "
                    :options="
                      products.map((p) => ({
                        ...p,
                        subLabel: `Stock: ${p.stock}`,
                      }))
                    "
                    labelKey="name"
                    valueKey="id"
                    placeholder="Select Product"
                  />
                </div>
              </div>

              <button
                type="submit"
                class="submit-btn"
                :disabled="loanStore.loading"
              >
                {{ loanStore.loading ? "Recording..." : "Return" }}
              </button>
            </form>
            <div v-else class="text-success">
              <Check class="icon-sm" /> All items returned
            </div>
          </div>

          <div class="divider">OR</div>

          <button
            @click="handleReturnAllLoan"
            class="submit-btn"
            :disabled="
              loanStore.loading ||
              editingLoanDetail?.items.every(
                (item) => (item.returned_quantity || 0) >= item.quantity,
              )
            "
          >
            {{
              loanStore.loading
                ? "Processing..."
                : "Return All Outstanding Items"
            }}
          </button>
        </div>
      </div>
    </div>

    <!-- View Loan Modal -->
    <div
      v-if="showViewLoanModal"
      class="modal-overlay"
      @click.self="closeViewLoanModal"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h2>Loan Details - {{ viewingLoanDetail?.borrower_name }}</h2>
          <button class="close-btn" @click="closeViewLoanModal">✕</button>
        </div>

        <div class="management-info" v-if="viewingLoanDetail">
          <p>
            <strong>Borrower:</strong> {{ viewingLoanDetail.borrower_name }}
          </p>
          <p v-if="viewingLoanDetail.borrower_contact">
            <strong>Contact:</strong> {{ viewingLoanDetail.borrower_contact }}
          </p>
          <p v-if="viewingLoanDetail.collateral">
            <strong>Collateral:</strong> {{ viewingLoanDetail.collateral }}
          </p>
          <p v-if="viewingLoanDetail.collateral_description">
            <strong>Description:</strong>
            {{ viewingLoanDetail.collateral_description }}
          </p>
          <p>
            <strong>Status:</strong>
            <span class="status-badge" :class="viewingLoanDetail.status">{{
              viewingLoanDetail.status
            }}</span>
          </p>
          <p>
            <strong>Date:</strong>
            {{
              viewingLoanDetail.loaned_at
                ? formatDateWithoutTime(viewingLoanDetail.loaned_at)
                : formatDateWithoutTime(viewingLoanDetail.created_at)
            }}
          </p>
        </div>

        <div class="management-actions" v-if="viewingLoanDetail">
          <div
            v-for="item in viewingLoanDetail.items"
            :key="item.product_id"
            class="action-section"
          >
            <h3>{{ item.quantity }}x {{ item.product_name }}</h3>
            <p class="hint">
              {{ item.returned_quantity || 0 }} / {{ item.quantity }} returned
            </p>

            <div
              v-if="item.returns && item.returns.length > 0"
              class="returns-history"
            >
              <h4>Return History:</h4>
              <ul>
                <li v-for="ret in item.returns" :key="ret.id">
                  <span v-if="ret.replacement_product_id">
                    Verified: {{ ret.quantity }} substituted with
                    <strong>{{ ret.replacement_name }}</strong>
                  </span>
                  <span v-else>
                    Verified: {{ ret.quantity }} returned as original
                  </span>
                  <small class="text-secondary">
                    ({{ formatDate(ret.created_at) }})
                  </small>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useAuthStore } from "../stores/authStore";
import { useProductStore } from "../stores/productStore";
import { useCategoryStore } from "../stores/categoryStore";
import { useSettingsStore } from "../stores/settingsStore";
import { formatCurrency } from "../utils/currency";
import {
  Edit2,
  Trash2,
  Package,
  Download,
  Upload,
  Search,
  Image as ImageIcon,
  Camera,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingDown,
  Check,
  Eye,
} from "lucide-vue-next";
import PaginationControls from "../components/PaginationControls.vue";
import BulkUploadModal from "../components/BulkUploadModal.vue";
import SearchableSelect from "../components/SearchableSelect.vue";
import DataListing from "../components/DataListing.vue";
import * as XLSX from "xlsx";
import { apiFetch } from "../utils/api";
import { useDialogStore } from "../stores/dialogStore";
import { useBorrowedStore } from "../stores/borrowedStore";
import { useLoanStore } from "../stores/loanStore";
import { generateBarcode } from "../utils/stringUtils";
const productStore = useProductStore();
const categoryStore = useCategoryStore();
const settingsStore = useSettingsStore();
const dialogStore = useDialogStore();
const borrowedStore = useBorrowedStore();
const loanStore = useLoanStore();

const authStore = useAuthStore();
const currentUser = computed(() => authStore.currentUser);
const isAdmin = computed(() => currentUser.value?.role === "admin");
const isCashier = computed(() => currentUser.value?.role === "cashier");

const computedInventoryColumns = computed(() => {
  const cols = [
    { key: "name", label: "Name", primary: true },
    { key: "barcode", label: "Barcode" },
    { key: "price", label: "Price" },
    { key: "cost", label: "Cost" },
    { key: "profit", label: "Expected Profit" },
    { key: "stock", label: "Stock" },
    { key: "value", label: "Total Value" },
    { key: "category", label: "Category" },
  ];
  if (activeTab.value === "inventory") {
    cols.push({ key: "actions", label: "Actions" });
  }
  return cols;
});

const borrowedColumns = [
  { key: "product", label: "Product", primary: true },
  { key: "quantity", label: "Quantity" },
  { key: "borrowed_from", label: "Borrowed From" },
  { key: "reason", label: "Reason", hidden: true },
  { key: "status", label: "Status" },
  { key: "date", label: "Borrowed Date" },
  { key: "actions", label: "Actions" },
];

const loanedColumns = [
  { key: "borrower", label: "Borrower", primary: true },
  { key: "items", label: "Items" },
  { key: "collateral", label: "Collateral" },
  { key: "status", label: "Status" },
  { key: "date", label: "Loaned Date" },
  { key: "actions", label: "Actions" },
];

const products = computed(() => productStore.products);
const categories = computed(() => categoryStore.categories);
const pagination = computed(() => productStore.pagination);
const borrowedItems = computed(() => borrowedStore.borrowedItems);

const loans = computed(() => loanStore.loans);
const activeTab = ref(isCashier.value ? "borrowed" : "inventory"); // inventory, low_stock, borrowed, loaned

const exporting = ref(false);
const searchQuery = ref("");
let searchTimeout = null;

// Watch for search query changes with debounce
watch(searchQuery, (newQuery) => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    if (activeTab.value === "inventory" || activeTab.value === "low_stock") {
      await productStore.fetchProducts({
        page: 1,
        limit: 20,
        low_stock: activeTab.value === "low_stock",
        search: newQuery,
      });
    } else if (activeTab.value === "borrowed") {
      await borrowedStore.fetchBorrowedItems(newQuery);
    } else if (activeTab.value === "loaned") {
      await loanStore.fetchLoans(newQuery);
    }
  }, 300);
});

// Watch for tab changes to fetch appropriate data
watch(activeTab, async (newTab) => {
  searchQuery.value = "";

  if (newTab === "inventory") {
    await productStore.fetchProducts({
      page: 1,
      limit: 20,
      search: searchQuery.value,
    });
  } else if (newTab === "low_stock") {
    await productStore.fetchProducts({
      page: 1,
      limit: 20,
      low_stock: true,
      search: searchQuery.value,
    });
  } else if (newTab === "borrowed") {
    await borrowedStore.fetchBorrowedItems(searchQuery.value);
  } else if (newTab === "loaned") {
    await loanStore.fetchLoans(searchQuery.value);
  }
});

async function handlePageChange(page) {
  const params = { page, limit: 20 };
  if (activeTab.value === "low_stock") {
    params.low_stock = true;
  }
  if (searchQuery.value) {
    params.search = searchQuery.value;
  }
  await productStore.fetchProducts(params);
}

async function exportToExcel() {
  exporting.value = true;
  try {
    const allProducts = await productStore.getAllProducts();

    const businessName = settingsStore.businessName;
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();

    const data = [
      [businessName],
      [`Stock as at ${date} ${time}`],
      [],
      [
        "Name",
        "Barcode",
        "Price",
        "Cost",
        "Expected Profit",
        "Stock",
        "Total Value",
        "Category",
      ],
    ];

    allProducts.forEach((p) => {
      data.push([
        p.name,
        p.barcode || "N/A",
        p.price,
        p.cost || 0,
        p.price - (p.cost || 0),
        p.stock,
        p.price * p.stock,
        p.category || "N/A",
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");

    XLSX.writeFile(wb, `Inventory_${date.replace(/\//g, "-")}.xlsx`);

    dialogStore.success("Inventory exported successfully");
  } catch (error) {
    console.error("Export failed:", error);
    dialogStore.error("Export failed: " + error.message);
  } finally {
    exporting.value = false;
  }
}

// Borrowed Item Edit Logic
const showEditBorrowedModal = ref(false);
const showViewBorrowedModal = ref(false);
const editingBorrowedDetail = ref(null);
const viewingBorrowedDetail = ref(null);

function openViewBorrowedModal(item) {
  viewingBorrowedDetail.value = item;
  showViewBorrowedModal.value = true;
}

function closeViewBorrowedModal() {
  showViewBorrowedModal.value = false;
  viewingBorrowedDetail.value = null;
}

const borrowedForm = ref({
  productName: "",
  borrowed_from: "",
  reason: "",
  status: "pending",
  borrowed_at: "",
});

function openEditBorrowedModal(item) {
  editingBorrowedDetail.value = item;
  borrowedForm.value = {
    productName: item.product_name,
    borrowed_from: item.borrowed_from,
    reason: item.reason,
    status: item.status || "pending",
    borrowed_at: item.borrowed_at || "",
  };
  showEditBorrowedModal.value = true;
}

function closeEditBorrowedModal() {
  showEditBorrowedModal.value = false;
  editingBorrowedDetail.value = null;
}

async function handleUpdateBorrowedItem() {
  if (!editingBorrowedDetail.value) return;

  try {
    const updates = {
      borrowed_from: borrowedForm.value.borrowed_from,
      reason: borrowedForm.value.reason,
      borrowed_at: borrowedForm.value.borrowed_at || null,
    };

    await borrowedStore.updateBorrowedItem(
      editingBorrowedDetail.value.id,
      updates,
    );
    dialogStore.success("Borrowed item updated");
    closeEditBorrowedModal();
  } catch (error) {
    dialogStore.error("Update failed: " + error.message);
  }
}

// Manage Borrowed Modal Logic
const showManageBorrowedModal = ref(false);
const managementForm = ref({
  returnQuantity: 1,
  payQuantity: 1,
  unitPrice: 0,
});

function openManageBorrowedModal(item) {
  editingBorrowedDetail.value = item;
  const remaining =
    item.quantity - ((item.returned_quantity || 0) + (item.paid_quantity || 0));
  managementForm.value.returnQuantity = remaining > 0 ? remaining : 1;
  managementForm.value.payQuantity = remaining > 0 ? remaining : 1;
  managementForm.value.unitPrice = item.product_price || 0;
  showManageBorrowedModal.value = true;
}

function closeManageBorrowedModal() {
  showManageBorrowedModal.value = false;
  editingBorrowedDetail.value = null;
}

async function handleReturnItems() {
  if (!editingBorrowedDetail.value) return;

  try {
    await borrowedStore.manageBorrowedItem(
      editingBorrowedDetail.value.id,
      "return",
      {
        returned_quantity: managementForm.value.returnQuantity,
      },
    );
    dialogStore.success("Return recorded successfully");
    closeManageBorrowedModal();
  } catch (error) {
    dialogStore.error("Operation failed: " + error.message);
  }
}

async function handleMarkAsPaid() {
  if (!editingBorrowedDetail.value) return;

  const confirmed = await dialogStore.confirm(
    `Are you sure you want to mark ${managementForm.value.payQuantity} items as paid? This will record an expense.`,
  );

  if (!confirmed) return;

  try {
    await borrowedStore.manageBorrowedItem(
      editingBorrowedDetail.value.id,
      "pay",
      {
        paid_quantity: managementForm.value.payQuantity,
        unitPrice: managementForm.value.unitPrice,
      },
    );
    dialogStore.success("Payment recorded and expense created");
    closeManageBorrowedModal();
  } catch (error) {
    dialogStore.error("Operation failed: " + error.message);
  }
}

// Loan Edit Logic
const showEditLoanModal = ref(false);
const showManageLoanModal = ref(false);
const showViewLoanModal = ref(false);
const editingLoanDetail = ref(null);
const viewingLoanDetail = ref(null);

function openViewLoanModal(loan) {
  viewingLoanDetail.value = loan;
  showViewLoanModal.value = true;
}

function closeViewLoanModal() {
  showViewLoanModal.value = false;
  viewingLoanDetail.value = null;
}
const loanForm = ref({
  borrower_name: "",
  borrower_contact: "",
  collateral: "",
  collateral_description: "",
  status: "active",
});
const managementLoanForm = ref({});

function getLoanReturnProgress(loan) {
  if (!loan || !loan.items) return "0 / 0 returned";
  const total = loan.items.reduce((sum, i) => sum + i.quantity, 0);
  const returned = loan.items.reduce(
    (sum, i) => sum + (i.returned_quantity || 0),
    0,
  );
  return `${returned} / ${total} returned`;
}

function openManageLoanModal(loan) {
  editingLoanDetail.value = loan;
  managementLoanForm.value = {};
  loan.items.forEach((item) => {
    managementLoanForm.value[item.product_id] = {
      quantity: item.quantity - (item.returned_quantity || 0),
      isSubstitution: false,
      replacementProductId: "",
    };
  });
  showManageLoanModal.value = true;
}

function closeManageLoanModal() {
  showManageLoanModal.value = false;
  editingLoanDetail.value = null;
}

async function handleReturnLoanItems(item) {
  const formData = managementLoanForm.value[item.product_id];
  const qty = formData.quantity;

  if (!qty || qty <= 0) return;

  const payload = {
    product_id: item.product_id,
    quantity: qty,
  };

  if (formData.isSubstitution && formData.replacementProductId) {
    payload.replacement_product_id = formData.replacementProductId;
  }

  try {
    await loanStore.updateLoan(editingLoanDetail.value.id, {
      action: "return_items",
      items_to_return: [payload],
    });
    dialogStore.success("Items returned");
    // Refresh local detail from store
    const updatedLoan = loanStore.loans.find(
      (l) => l.id === editingLoanDetail.value.id,
    );
    if (updatedLoan) {
      editingLoanDetail.value = updatedLoan;
      // Reset form for this item
      const remaining = item.quantity - (item.returned_quantity || 0) - qty;
      // Note: item.returned_quantity is old. updatedLoan has new values.
      const updatedItem = updatedLoan.items.find(
        (i) => i.product_id === item.product_id,
      );

      managementLoanForm.value[item.product_id] = {
        quantity: updatedItem
          ? updatedItem.quantity - (updatedItem.returned_quantity || 0)
          : 0,
        isSubstitution: false,
        replacementProductId: "",
      };
    }
  } catch (error) {
    dialogStore.error("Operation failed: " + error.message);
  }
}

async function handleReturnAllLoan() {
  const confirmed = await dialogStore.confirm(
    "Are you sure you want to return all outstanding items for this loan?",
  );
  if (!confirmed) return;

  try {
    await loanStore.updateLoan(editingLoanDetail.value.id, {
      action: "return_all",
      status: "returned",
    });
    dialogStore.success("All items returned");
    closeManageLoanModal();
  } catch (error) {
    dialogStore.error("Operation failed: " + error.message);
  }
}

function openEditLoanModal(loan) {
  editingLoanDetail.value = loan;
  loanForm.value = {
    borrower_name: loan.borrower_name,
    borrower_contact: loan.borrower_contact,
    collateral: loan.collateral,
    collateral_description: loan.collateral_description,
    status: loan.status || "active",
  };
  showEditLoanModal.value = true;
}

function closeEditLoanModal() {
  showEditLoanModal.value = false;
  editingLoanDetail.value = null;
}

async function handleUpdateLoan() {
  if (!editingLoanDetail.value) return;

  try {
    const updates = { ...loanForm.value };
    // If status changed to returned, backend handles restocking?
    // Current backend logic supports it if action is 'return_all' or if we just set status.
    // Let's simple update for now, standard fields.

    await loanStore.updateLoan(editingLoanDetail.value.id, updates);
    dialogStore.success("Loan updated");
    closeEditLoanModal();
  } catch (error) {
    dialogStore.error("Update failed: " + error.message);
  }
}

const showModal = ref(false);
const showBulkUploadModal = ref(false);
const isEditing = ref(false);
const editingId = ref(null);

const formData = ref({
  name: "",
  barcode: "",
  price: 0,
  cost: 0,
  stock: 0,
  categoryId: null,
  image: null,
});

const imageInput = ref(null);
const pendingImageFile = ref(null);
const imagePreview = ref(null);

function openAddModal() {
  isEditing.value = false;
  editingId.value = null;
  formData.value = {
    name: "",
    barcode: generateBarcode(),
    price: 0,
    cost: 0,
    stock: 0,
    categoryId: null,
    image: null,
  };
  showModal.value = true;
}

function openEditModal(product) {
  isEditing.value = true;
  editingId.value = product.id;
  formData.value = {
    ...product,
    categoryId: product.categoryId, // Ensure categoryId is explicitly set
  };
  pendingImageFile.value = null;
  imagePreview.value = null;
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  if (imageInput.value) {
    imageInput.value.value = "";
  }
}

function handleImageSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    dialogStore.error("Image too large. Please select an image under 2MB.");
    event.target.value = "";
    return;
  }

  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    dialogStore.error(
      "Invalid file type. Please select a JPG, PNG, or WebP image.",
    );
    event.target.value = "";
    return;
  }

  pendingImageFile.value = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.value = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function removeImage() {
  if (formData.value.image && editingId.value) {
    const filename = formData.value.image.split("/").pop();
    try {
      const response = await apiFetch("/api/products/image", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: editingId.value, filename }),
      });
      if (!response.ok) throw new Error("Failed to delete image");
    } catch (err) {
      console.error("Image delete error:", err);
    }
  }

  formData.value.image = null;
  pendingImageFile.value = null;
  imagePreview.value = null;
  if (imageInput.value) {
    imageInput.value.value = "";
  }
}

async function uploadImage(productId) {
  if (!pendingImageFile.value) return null;

  const uploadFormData = new FormData();
  uploadFormData.append("image", pendingImageFile.value);
  uploadFormData.append("productId", productId);

  const response = await apiFetch("/api/products/image", {
    method: "POST",
    body: uploadFormData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to upload image");
  }

  const result = await response.json();
  return result.imageUrl;
}

async function handleSubmit() {
  try {
    if (isEditing.value) {
      await productStore.updateProduct(editingId.value, formData.value);
      if (pendingImageFile.value) {
        await uploadImage(editingId.value);
        await productStore.fetchProducts({ page: 1, limit: 20 });
      }
      dialogStore.success("Product updated successfully");
    } else {
      const result = await productStore.addProduct(formData.value);
      if (pendingImageFile.value && result && result.id) {
        await uploadImage(result.id);
        await productStore.fetchProducts({ page: 1, limit: 20 });
      }
      dialogStore.success("Product added successfully");
    }

    pendingImageFile.value = null;
    imagePreview.value = null;
    closeModal();
  } catch (error) {
    dialogStore.error("Operation failed: " + error.message);
  }
}

async function handleDelete(id) {
  const confirmed = await dialogStore.confirm(
    "Are you sure you want to delete this product?",
  );
  if (!confirmed) return;

  try {
    await productStore.deleteProduct(id);
    dialogStore.success("Product deleted successfully");
  } catch (error) {
    dialogStore.error("Delete failed: " + error.message);
  }
}

function handleBulkImported() {
  // handled by store
}

onMounted(async () => {
  await productStore.fetchProducts({ page: 1, limit: 20 });
  await categoryStore.fetchCategories();
  await borrowedStore.fetchBorrowedItems();
});

function formatDate(dateString) {
  if (!dateString) return "N/A";
  if (typeof dateString === "string") {
    dateString = dateString.replace(" ", "T");
  }
  return (
    new Date(dateString).toLocaleDateString() +
    " " +
    new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}

function formatDateWithoutTime(dateString) {
  if (!dateString) return "N/A";
  if (typeof dateString === "string") {
    dateString = dateString.replace(" ", "T");
  }
  return new Date(dateString).toLocaleDateString();
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
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
  align-items: center;
}

/* Search Bar Styling */
.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.desktop-search {
  flex: 1;
  min-width: 250px;
  max-width: 350px;
}

.mobile-search {
  display: none;
  margin-bottom: var(--spacing-md);
}

.search-icon {
  position: absolute;
  left: 10px;
  width: 16px;
  height: 16px;
  color: var(--text-secondary);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.45rem 2.2rem 0.45rem 2.2rem;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: var(--bg-white);
  transition: all 0.2s ease;
  height: 36px;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.clear-search {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.clear-search:hover {
  color: var(--danger-bg);
}

.add-btn,
.export-btn,
.upload-btn {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  white-space: nowrap;
}

@media (max-width: 1024px) {
  .desktop-search {
    min-width: 200px;
  }
}

@media (max-width: 768px) {
  .desktop-search {
    display: none;
  }
  .mobile-search {
    display: flex;
  }
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }
  .header-actions {
    justify-content: flex-end;
  }
}

.add-btn {
  padding: 0.3rem 1rem;
  background: var(--primary-gradient);
  color: var(--text-white);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.export-btn,
.upload-btn {
  padding: 0.3rem 1rem;
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

.export-btn:hover,
.upload-btn:hover {
  background: var(--bg-hover);
  border-color: var(--text-secondary);
}

.export-btn:disabled,
.add-btn:disabled {
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

.low-stock {
  color: var(--danger-bg);
  font-weight: 600;
}
.actions {
  display: flex;
  gap: 0.5rem;
}

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
  backdrop-filter: blur(4px);
}
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

@keyframes slideIn {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
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
  font-size: var(--font-size-xl);
  cursor: pointer;
  color: var(--text-secondary);
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
.form-group select,
.form-group textarea {
  width: 100%;
  padding: var(--spacing-md);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  background-color: var(--bg-white);
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus,
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

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

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
    align-items: stretch;
  }

  .desktop-search {
    display: none;
  }

  .mobile-search {
    display: block;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

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

.action-btn.delete-btn {
  color: #ef4444;
}

.action-btn.manage-btn {
  background-color: #10b981;
  color: white;
  border-radius: var(--radius-md);
  padding: 0.4rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.action-btn.manage-btn:hover {
  background-color: #059669;
  transform: scale(1.1);
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
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.05) 0%,
    rgba(118, 75, 162, 0.05) 100%
  );
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

.status-badge.partial {
  background-color: #ffedd5;
  color: #c2410c; /* Orange */
  border: 1px solid #fed7aa;
}

.status-badge.settled {
  background-color: #e0e7ff;
  color: #4338ca; /* Indigo/Settled */
  border: 1px solid #c7d2fe;
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

.status-container {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.return-progress {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.management-info {
  background: var(--bg-hover);
  padding: 1rem;
  border-radius: var(--radius-md);
  margin-bottom: 1.5rem;
}

.management-info p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.management-actions {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.action-section {
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.action-section h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.inline-form {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
}

.inline-form .form-group {
  margin-bottom: 0;
  flex: 1;
}

.inline-form .price-input-group {
  flex: 2;
}

.price-input {
  min-width: 80px;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  color: var(--text-secondary);
  font-weight: 600;
}

.divider::before,
.divider::after {
  content: "";
  flex: 1;
  border-bottom: 1px solid var(--border-color);
}

.divider:not(:empty)::before {
  margin-right: 0.5em;
}

.divider:not(:empty)::after {
  margin-left: 0.5em;
}

.paid-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.paid-btn:hover {
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.hint {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.substitution-section {
  padding: 0.75rem;
  background: var(--bg-hover);
  border-radius: var(--radius-md);
  border: 1px dashed var(--border-color);
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 200px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-primary);
  cursor: pointer;
  margin: 0;
  white-space: nowrap;
}

.substitution-section .form-group {
  margin-top: 0.75rem;
}

.product-select {
  width: 100%;
  padding: 0.5rem;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-white);
  color: var(--text-primary);
}

.returns-history {
  margin: 0.5rem 0 1rem;
  padding: 0.5rem;
  background: var(--bg-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
}

.returns-history h4 {
  margin: 0 0 0.25rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.returns-history ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.returns-history li {
  display: flex;
  justify-content: space-between;
  padding: 0.2rem 0;
  border-bottom: 1px dashed var(--border-color);
}

.returns-history li:last-child {
  border-bottom: none;
}

@media (max-width: 768px) {
  .inline-form {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .inline-form .form-group,
  .substitution-section {
    width: 100%;
  }

  .inline-form .submit-btn {
    width: 100%;
    margin-top: 0.5rem;
  }
}
</style>
