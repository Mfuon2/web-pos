<template>
  <div class="modal-overlay">
    <div class="modal-content large-modal">
      <div class="modal-header">
        <div class="header-title">
          <UploadCloud v-if="step === 1" class="icon-md" />
          <CheckCircle v-else class="icon-md" />
          <h2>Record Purchase Order</h2>
        </div>
        <button class="close-btn" @click="$emit('close')">
          <X class="icon-sm" />
        </button>
      </div>

      <!-- Stepper Progress -->
      <div class="stepper-progress">
        <div class="step" :class="{ active: step >= 1, completed: step > 1 }">
          <div class="step-icon">1</div>
          <span>Details & Upload</span>
        </div>
        <div class="step-line" :class="{ completed: step > 1 }"></div>
        <div class="step" :class="{ active: step >= 2, completed: step > 2 }">
          <div class="step-icon">2</div>
          <span>Verify Items</span>
        </div>
      </div>

      <!-- Step 1: Basic Info & Upload -->
      <div v-if="step === 1" class="step-content">
        <div class="form-grid">
          <div class="form-group">
            <label>Supplier (Optional)</label>
            <select v-model="formData.supplier_id">
              <option :value="null">No Supplier</option>
              <option
                v-for="supplier in suppliers"
                :key="supplier.id"
                :value="supplier.id"
              >
                {{ supplier.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Status</label>
            <select v-model="formData.status" required>
              <option value="pending">Pending</option>
              <option value="received">Received</option>
            </select>
          </div>

          <div class="form-group">
            <label>Date</label>
            <input v-model="formData.date" type="date" required />
          </div>

          <div class="form-group">
            <label>Notes</label>
            <textarea
              v-model="formData.notes"
              rows="1"
              placeholder="Invoice #, etc."
            ></textarea>
          </div>
        </div>

        <div class="template-section">
          <div class="section-desc">
            <p>
              Upload an Excel file with the products purchased. Columns:
              <strong>Product Name, Quantity, Price</strong>
            </p>
            <button @click="downloadTemplate" class="download-link-btn">
              <Download class="icon-sm" />
              Download Template
            </button>
          </div>
        </div>

        <div
          class="upload-area"
          :class="{ dragging: isDragging }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleFileUpload"
        >
          <input
            type="file"
            ref="fileInput"
            @change="handleFileUpload"
            accept=".xlsx, .xls"
            style="display: none"
          />
          <div class="upload-placeholder" @click="$refs.fileInput.click()">
            <FileSpreadsheet class="upload-icon" />
            <p><strong>Click to upload</strong> or drag and drop</p>
            <p class="file-type">Excel files only (.xlsx, .xls)</p>
          </div>
        </div>

        <div class="divider">
          <span>OR</span>
        </div>

        <button @click="startManualEntry" class="manual-entry-btn">
          <Plus class="icon-sm" /> Enter Products Manually
        </button>
      </div>

      <!-- Step 2: Verification -->
      <div v-if="step === 2" class="step-content">
        <div class="verification-stats">
          <div class="stat-item">
            <span class="stat-value">{{ parsedItems.length }}</span>
            <span class="stat-label">Items Found</span>
          </div>
          <div class="stat-item warning">
            <span class="stat-value">{{ flaggedCount }}</span>
            <span class="stat-label">Need Matching</span>
          </div>
          <div class="stat-item success">
            <span class="stat-value">{{ formatCurrency(computedTotal) }}</span>
            <span class="stat-label">Total Amount</span>
          </div>
        </div>

        <div class="list-header">
          <h3>Verification List</h3>
          <button @click="openAddModal" class="secondary-btn add-item-btn">
            <Plus class="icon-sm" /> Add Item
          </button>
        </div>

        <div class="verification-list">
          <div
            v-for="(item, index) in parsedItems"
            :key="index"
            class="verification-item"
            :class="item.status"
          >
            <div class="item-info">
              <div class="item-main">
                <span class="item-name">{{ item.name }}</span>
                <span
                  v-if="item.status === 'fuzzy'"
                  class="badge badge-warning"
                >
                  {{ item.suggestions.length }} suggestions found
                </span>
                <span v-if="item.status === 'new'" class="badge badge-info">
                  New Product
                </span>
                <span
                  v-if="item.status === 'valid'"
                  class="badge badge-success"
                >
                  Matched
                </span>
              </div>
              <div
                class="suggestion-selector"
                v-if="
                  item.status === 'fuzzy' ||
                  (item.status === 'valid' && item.suggestions.length > 1)
                "
              >
                <label>Select match:</label>
                <select v-model="item.matchedWith" class="match-select">
                  <option
                    v-for="sug in item.suggestions"
                    :key="sug.id"
                    :value="sug"
                  >
                    {{ sug.name }} (Stock: {{ sug.stock || 0 }})
                  </option>
                </select>
              </div>
              <div
                v-else-if="item.status === 'valid' || item.status === 'fuzzy'"
                class="matched-text"
              >
                Matched with: <strong>{{ item.matchedWith?.name }}</strong>
              </div>
              <div class="item-meta">
                Qty: {{ item.quantity }} | Price:
                {{ formatCurrency(item.cost) }}
              </div>
            </div>

            <div class="item-actions">
              <button
                v-if="item.status === 'fuzzy'"
                @click="resolveConflict(index, 'match')"
                class="action-btn-sm success"
                title="Use existing product"
              >
                Use Existing
              </button>
              <button
                v-if="item.status === 'fuzzy' || item.status === 'valid'"
                @click="resolveConflict(index, 'new')"
                class="action-btn-sm info"
                title="Add as a new product"
              >
                Add as New
              </button>
              <button
                v-if="item.status !== 'ignored'"
                @click="resolveConflict(index, 'ignore')"
                class="action-btn-sm secondary"
              >
                Skip
              </button>
              <Check
                v-if="item.status === 'valid'"
                class="icon-sm text-success"
              />
              <X
                v-if="item.status === 'ignored'"
                class="icon-sm text-secondary"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button
          v-if="step === 2"
          @click="step = 1"
          class="secondary-btn"
          :disabled="loading || isSubmitting"
        >
          Back
        </button>
        <button v-if="step === 1" @click="$emit('close')" class="secondary-btn">
          Cancel
        </button>
        <button
          v-if="step === 2"
          @click="handleSubmit"
          class="submit-btn"
          :disabled="validItemsCount === 0 || loading || isSubmitting"
        >
          {{
            loading || isSubmitting ? "Processing..." : `Record PO (${validItemsCount} items)`
          }}
        </button>
      </div>
    </div>
  </div>

  <!-- Add Product Dialog (Nested) -->
  <div v-if="showAddModal" class="modal-overlay nested-overlay">
    <div class="modal-content small-modal">
      <div class="modal-header">
        <h3 style="margin: 0; font-size: 1.25rem">Add Product</h3>
        <button class="close-btn" @click="showAddModal = false">
          <X class="icon-sm" />
        </button>
      </div>
      <div class="form-group mb-3">
        <label>Action</label>
        <select v-model="manualItem.type">
          <option value="existing">Existing Product</option>
          <option value="new">New Product</option>
        </select>
      </div>

      <div class="form-group mb-3" v-if="manualItem.type === 'existing'">
        <label>Select Product</label>
        <select v-model="manualItem.matchedWith" required>
          <option v-for="p in sortedProducts" :key="p.id" :value="p">
            {{ p.name }} (Stock: {{ p.stock }})
          </option>
        </select>
      </div>
      <div class="form-group mb-3" v-if="manualItem.type === 'new'">
        <label>Product Name</label>
        <input v-model="manualItem.name" type="text" required />
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>Quantity</label>
          <input
            v-model.number="manualItem.quantity"
            type="number"
            min="1"
            required
          />
        </div>
        <div class="form-group">
          <label>Cost</label>
          <input
            v-model.number="manualItem.cost"
            type="number"
            min="0"
            required
          />
        </div>
      </div>

      <div class="modal-footer">
        <button @click="showAddModal = false" class="secondary-btn">
          Cancel
        </button>
        <button
          @click="addManualProduct"
          class="submit-btn"
          :disabled="!isManualItemValid"
        >
          Add
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useSupplierStore } from "../stores/supplierStore";
import { useProductStore } from "../stores/productStore";
import { useDialogStore } from "../stores/dialogStore";
import {
  X,
  UploadCloud,
  Download,
  FileSpreadsheet,
  Check,
  CheckCircle,
  Plus,
} from "lucide-vue-next";
import * as XLSX from "xlsx";
import { isAlmostMatch, generateBarcode } from "../utils/stringUtils";
import { formatCurrency } from "../utils/currency";

const props = defineProps({
  isSubmitting: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "save"]);
const supplierStore = useSupplierStore();
const productStore = useProductStore();
const dialogStore = useDialogStore();

const suppliers = computed(() => supplierStore.suppliers);
const products = computed(() => productStore.products);

const step = ref(1);
const isDragging = ref(false);
const loading = ref(false);
const parsedItems = ref([]);

const showAddModal = ref(false);
const manualItem = ref({
  type: "existing",
  matchedWith: null,
  name: "",
  quantity: 1,
  cost: 0,
});

const formData = ref({
  supplier_id: null,
  total: 0,
  status: "received",
  notes: "",
  date: new Date().toISOString().split("T")[0],
});

onMounted(async () => {
  await Promise.all([
    supplierStore.fetchSuppliers(),
    productStore.fetchProducts({ limit: 1000 }),
  ]);
});

const flaggedCount = computed(
  () => parsedItems.value.filter((i) => i.status === "fuzzy").length,
);

const validItemsCount = computed(
  () =>
    parsedItems.value.filter((i) => i.status === "valid" || i.status === "new")
      .length,
);

const computedTotal = computed(() => {
  return parsedItems.value
    .filter((i) => i.status === "valid" || i.status === "new")
    .reduce((sum, i) => sum + i.quantity * i.cost, 0);
});

const sortedProducts = computed(() => {
  return [...products.value].sort((a, b) => a.name.localeCompare(b.name));
});

const isManualItemValid = computed(() => {
  if (manualItem.value.quantity <= 0 || manualItem.value.cost < 0) return false;
  if (manualItem.value.type === "existing" && !manualItem.value.matchedWith)
    return false;
  if (manualItem.value.type === "new" && !manualItem.value.name.trim())
    return false;
  return true;
});

function openAddModal() {
  manualItem.value = {
    type: "existing",
    matchedWith: null,
    name: "",
    quantity: 1,
    cost: 0,
  };
  showAddModal.value = true;
}

function addManualProduct() {
  if (!isManualItemValid.value) return;

  if (manualItem.value.type === "existing") {
    parsedItems.value.unshift({
      name: manualItem.value.matchedWith.name,
      quantity: manualItem.value.quantity,
      cost: manualItem.value.cost,
      status: "valid",
      suggestions: [manualItem.value.matchedWith],
      matchedWith: manualItem.value.matchedWith,
    });
  } else {
    parsedItems.value.unshift({
      name: manualItem.value.name,
      quantity: manualItem.value.quantity,
      cost: manualItem.value.cost,
      status: "new",
      suggestions: [],
      matchedWith: null,
    });
  }

  showAddModal.value = false;
}

function startManualEntry() {
  step.value = 2;
  if (parsedItems.value.length === 0) {
    openAddModal();
  }
}

function downloadTemplate() {
  const ws = XLSX.utils.json_to_sheet([
    { "Product Name": "Chrome Vodka 1/4", Quantity: 12, Price: 250 },
    { "Product Name": "Heineken 500ml", Quantity: 24, Price: 180 },
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "PurchaseOrder");
  XLSX.writeFile(wb, "po_template.xlsx");
}

async function handleFileUpload(event) {
  const file = event.target.files?.[0] || event.dataTransfer?.files?.[0];
  if (!file) return;

  isDragging.value = false;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);

      processExcelData(json);
    } catch (err) {
      dialogStore.error("Failed to parse Excel file: " + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

function processExcelData(data) {
  const allProducts = products.value;

  parsedItems.value = data
    .map((row) => {
      const name = (row["Product Name"] || row.name || "").toString().trim();
      const quantity = parseFloat(row["Quantity"] || row.quantity || 0);
      const cost = parseFloat(row["Price"] || row.cost || row.price || 0);

      if (!name || quantity <= 0) return null;

      // 1. Check for exact match first
      const exactMatch = allProducts.find(
        (p) => p.name.toLowerCase() === name.toLowerCase(),
      );

      // 2. Find all fuzzy matches
      const suggestions = allProducts.filter((p) =>
        isAlmostMatch(p.name, name),
      );

      if (exactMatch) {
        return {
          name,
          quantity,
          cost,
          status: "valid",
          suggestions: suggestions.length > 0 ? suggestions : [exactMatch],
          matchedWith: exactMatch,
        };
      }

      if (suggestions.length > 0) {
        return {
          name,
          quantity,
          cost,
          status: "fuzzy",
          suggestions,
          matchedWith: suggestions[0],
        };
      }

      return { name, quantity, cost, status: "new", suggestions: [] };
    })
    .filter(Boolean);

  if (parsedItems.value.length === 0) {
    dialogStore.error("No valid products found in the file.");
    return;
  }

  step.value = 2;
}

function resolveConflict(index, action) {
  const item = parsedItems.value[index];
  if (action === "match") {
    item.status = "valid";
  } else if (action === "new") {
    item.status = "new";
  } else if (action === "ignore") {
    item.status = "ignored";
  }
}

async function handleSubmit() {
  try {
    loading.value = true;
    const finalItems = [];

    for (const item of parsedItems.value) {
      if (item.status === "ignored") continue;

      let productId = item.matchedWith?.id;

      if (item.status === "new") {
        // Create new product
        const newProduct = await productStore.addProduct({
          name: item.name,
          barcode: generateBarcode(),
          price: item.cost * 1.2, // Default 20% markup
          cost: item.cost,
          stock: 0, // Initial stock handled by PO receive logic
          categoryId: null,
        });
        productId = newProduct.id;
      }

      finalItems.push({
        product_id: productId,
        quantity: item.quantity,
        cost: item.cost,
      });
    }

    const dataToSubmit = {
      ...formData.value,
      total: computedTotal.value,
      items: finalItems,
      createdAt: formData.value.date,
      received_at:
        formData.value.status === "received" ? new Date().toISOString() : null,
    };

    emit("save", dataToSubmit);
  } catch (err) {
    dialogStore.error("Failed to process purchase order: " + err.message);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.mb-3 {
  margin-bottom: 1rem;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 1.5rem 0;
  color: #94a3b8;
  font-size: 0.85rem;
  font-weight: 500;
}
.divider::before,
.divider::after {
  content: "";
  flex: 1;
  border-bottom: 1px solid #e2e8f0;
}
.divider:not(:empty)::before {
  margin-right: 0.5em;
}
.divider:not(:empty)::after {
  margin-left: 0.5em;
}
.manual-entry-btn {
  width: 100%;
  padding: 1rem;
  background: white;
  border: 2px dashed #cbd5e1;
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
}
.manual-entry-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: rgba(102, 126, 234, 0.05);
}
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.list-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-primary);
}
.add-item-btn {
  padding: 0.4rem 0.75rem;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.nested-overlay {
  z-index: 1010;
}
.small-modal {
  max-width: 500px;
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
  padding: 1rem;
}

.modal-content {
  background: var(--bg-white);
  border-radius: var(--radius-xl);
  padding: 2rem;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.3s ease;
  max-height: 90vh;
  overflow-y: auto;
}

.large-modal {
  max-width: 800px;
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
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

.header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.modal-header h2 {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--text-primary);
}

.stepper-progress {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  gap: 0.5rem;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.step.active {
  color: var(--primary-color);
  font-weight: 600;
}

.step.completed {
  color: var(--success-color);
}

.step-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid currentColor;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
}

.step.active .step-icon {
  background: var(--primary-gradient);
  color: white;
  border-color: transparent;
}

.step.completed .step-icon {
  background: var(--success-color);
  color: white;
  border-color: var(--success-color);
}

.step-line {
  height: 2px;
  flex: 1;
  max-width: 100px;
  background: #e2e8f0;
  margin-bottom: 15px;
}

.step-line.completed {
  background: var(--success-color);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
}

.template-section {
  background: #f8fafc;
  padding: 1rem;
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
}

.section-desc {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.section-desc p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.download-link-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  white-space: nowrap;
}

.upload-area {
  border: 2px dashed #cbd5e1;
  border-radius: var(--radius-lg);
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-area:hover,
.upload-area.dragging {
  border-color: var(--primary-color);
  background: rgba(102, 126, 234, 0.05);
}

.upload-icon {
  width: 48px;
  height: 48px;
  color: #94a3b8;
  margin: 0 auto 1rem;
}

.verification-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
}

.stat-item.warning {
  background: #fffcf0;
}
.stat-item.success {
  background: #f0fdf4;
}

.stat-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.verification-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 350px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.verification-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.verification-item.valid {
  border-left: 4px solid var(--success-color);
}
.verification-item.fuzzy {
  border-left: 4px solid var(--warning-color);
}
.verification-item.new {
  border-left: 4px solid var(--primary-color);
}
.verification-item.ignored {
  opacity: 0.6;
}

.item-name {
  font-weight: 600;
}
.item-meta {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.badge {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 0.5rem;
  font-weight: 600;
}

.badge-warning {
  background: #fef3c7;
  color: #92400e;
}
.badge-success {
  background: #dcfce7;
  color: #166534;
}
.badge-info {
  background: #e0f2fe;
  color: #0369a1;
}

.item-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn-sm {
  padding: 4px 10px;
  font-size: 0.75rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: white;
  cursor: pointer;
  font-weight: 500;
}

.action-btn-sm.success {
  color: var(--success-color);
  border-color: var(--success-color);
}
.action-btn-sm.info {
  color: var(--primary-color);
  border-color: var(--primary-color);
}

.suggestion-selector {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.match-select {
  padding: 4px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: white;
  font-size: 0.85rem;
  color: var(--text-primary);
  max-width: 250px;
}

.matched-text {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.modal-footer {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.submit-btn {
  padding: 0.75rem 1.5rem;
  background: var(--primary-gradient);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
}

.secondary-btn {
  padding: 0.75rem 1.5rem;
  background: white;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.icon-sm {
  width: 16px;
  height: 16px;
}
.icon-md {
  width: 24px;
  height: 24px;
  color: var(--primary-color);
}
.text-success {
  color: var(--success-color);
}
.text-secondary {
  color: var(--text-secondary);
}
</style>
