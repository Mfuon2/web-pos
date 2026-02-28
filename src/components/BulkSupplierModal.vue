<template>
  <div class="modal-overlay">
    <div class="modal-content bulk-modal">
      <div class="modal-header">
        <div class="header-title">
          <UploadCloud class="icon-md" />
          <h2>Bulk Add Suppliers</h2>
        </div>
        <button @click="$emit('close')" class="close-btn">
          <X class="icon-sm" />
        </button>
      </div>

      <!-- Stepper Progress -->
      <div class="stepper-progress">
        <div class="step" :class="{ active: step >= 1, completed: step > 1 }">
          <div class="step-icon">1</div>
          <span>Upload</span>
        </div>
        <div class="step-line" :class="{ completed: step > 1 }"></div>
        <div class="step" :class="{ active: step >= 2, completed: step > 2 }">
          <div class="step-icon">2</div>
          <span>Verify</span>
        </div>
      </div>

      <!-- Step 1: Upload -->
      <div v-if="step === 1" class="step-content">
        <div class="template-section">
          <p>
            Download the template, fill it with your suppliers, and upload it
            back.
          </p>
          <button @click="downloadTemplate" class="download-link-btn">
            <Download class="icon-sm" />
            Download Excel Template
          </button>
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
      </div>

      <!-- Step 2: Verify -->
      <div v-if="step === 2" class="step-content">
        <div class="verification-stats">
          <div class="stat-item">
            <span class="stat-value">{{ parsedData.length }}</span>
            <span class="stat-label">Total found</span>
          </div>
          <div class="stat-item warning">
            <span class="stat-value">{{ flaggedCount }}</span>
            <span class="stat-label">Requires Attention</span>
          </div>
          <div class="stat-item success">
            <span class="stat-value">{{ validCount }}</span>
            <span class="stat-label">Ready to add</span>
          </div>
        </div>

        <div class="verification-list">
          <div
            v-for="(item, index) in parsedData"
            :key="index"
            class="verification-item"
            :class="item.status"
          >
            <div class="item-info">
              <div class="item-main">
                <span class="item-name">{{ item.name }}</span>
                <span
                  v-if="item.status === 'duplicate'"
                  class="badge badge-error"
                  >Already exists</span
                >
                <span v-if="item.status === 'fuzzy'" class="badge badge-warning"
                  >Similar to: {{ item.matchedWith.name }}</span
                >
                <span v-if="item.status === 'valid'" class="badge badge-success"
                  >New Supplier</span
                >
                <span
                  v-if="item.status === 'ignored'"
                  class="badge badge-secondary"
                  >Ignored</span
                >
              </div>
              <p class="item-desc">
                {{ item.contactPerson ? "Contact: " + item.contactPerson : "" }}
                {{ item.phone ? " | Phone: " + item.phone : "" }}
                {{ item.email ? " | Email: " + item.email : "" }}
              </p>
            </div>

            <div class="item-actions">
              <button
                v-if="item.status === 'duplicate'"
                @click="resolveConflict(index, 'update')"
                class="action-btn-sm primary"
                title="Update existing record with this info"
              >
                Update Existing
              </button>
              <button
                v-if="item.status === 'fuzzy'"
                @click="resolveConflict(index, 'update')"
                class="action-btn-sm warning"
                title="Rename this to match existing"
              >
                Use Existing
              </button>
              <button
                v-if="item.status !== 'valid' && item.status !== 'ignored'"
                @click="resolveConflict(index, 'ignore')"
                class="action-btn-sm secondary"
              >
                Skip
              </button>
              <button
                v-if="item.status === 'fuzzy'"
                @click="resolveConflict(index, 'valid')"
                class="action-btn-sm success"
              >
                Add as New
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
        <button v-if="step === 2" @click="step = 1" class="secondary-btn">
          Back
        </button>
        <button v-if="step === 1" @click="$emit('close')" class="secondary-btn">
          Cancel
        </button>
        <button
          v-if="step === 2"
          @click="submitBulk"
          class="submit-btn"
          :disabled="validCount === 0 || loading"
        >
          {{ loading ? "Processing..." : `Add ${validCount} Suppliers` }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import {
  X,
  UploadCloud,
  Download,
  FileSpreadsheet,
  Check,
  AlertCircle,
  ChevronRight,
} from "lucide-vue-next";
import * as XLSX from "xlsx";
import { isAlmostMatch } from "../utils/stringUtils";
import { useSupplierStore } from "../stores/supplierStore";
import { useDialogStore } from "../stores/dialogStore";

const supplierStore = useSupplierStore();
const dialogStore = useDialogStore();
const emit = defineEmits(["close", "success"]);

const step = ref(1);
const isDragging = ref(false);
const loading = ref(false);
const parsedData = ref([]);

const flaggedCount = computed(
  () =>
    parsedData.value.filter(
      (i) => i.status === "duplicate" || i.status === "fuzzy",
    ).length,
);
const validCount = computed(
  () => parsedData.value.filter((i) => i.status === "valid").length,
);

function downloadTemplate() {
  const ws = XLSX.utils.json_to_sheet([
    {
      Name: "Supplier A",
      "Contact Person": "John Doe",
      Phone: "0712345678",
      Email: "john@suppliera.com",
      Address: "123 Industrial Area",
    },
    {
      Name: "Supplier B",
      "Contact Person": "Jane Smith",
      Phone: "0722345678",
      Email: "jane@supplierb.com",
      Address: "456 Business Park",
    },
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Suppliers");
  XLSX.writeFile(wb, "supplier_template.xlsx");
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

      processParsedData(json);
    } catch (err) {
      dialogStore.error("Failed to parse Excel file: " + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

function processParsedData(data) {
  const existingSuppliers = supplierStore.suppliers;

  parsedData.value = data
    .map((row) => {
      const name = (row.Name || row.name || "").toString().trim();
      const contactPerson = (
        row["Contact Person"] ||
        row.contactPerson ||
        row.contact_person ||
        row.Contact ||
        ""
      )
        .toString()
        .trim();
      const phone = (row.Phone || row.phone || "").toString().trim();
      const email = (row.Email || row.email || "").toString().trim();
      const address = (row.Address || row.address || "").toString().trim();

      if (!name) return null;

      // Check for exact duplicate
      const exactMatch = existingSuppliers.find(
        (s) => s.name.toLowerCase() === name.toLowerCase(),
      );
      if (exactMatch) {
        return {
          name,
          contactPerson,
          phone,
          email,
          address,
          status: "duplicate",
          matchedWith: exactMatch,
          originalName: name,
        };
      }

      // Check for fuzzy match
      const fuzzyMatch = existingSuppliers.find((s) =>
        isAlmostMatch(s.name, name),
      );
      if (fuzzyMatch) {
        return {
          name,
          contactPerson,
          phone,
          email,
          address,
          status: "fuzzy",
          matchedWith: fuzzyMatch,
          originalName: name,
        };
      }

      return {
        name,
        contactPerson,
        phone,
        email,
        address,
        status: "valid",
        originalName: name,
      };
    })
    .filter(Boolean);

  if (parsedData.value.length === 0) {
    dialogStore.error("No valid suppliers found in the file.");
    return;
  }

  step.value = 2;
}

function resolveConflict(index, action) {
  const item = parsedData.value[index];
  if (action === "update") {
    item.status = "valid";
    item.isUpdate = true;
    item.isResolved = true;
  } else if (action === "ignore") {
    item.status = "ignored";
    item.isResolved = true;
  } else if (action === "valid") {
    item.status = "valid";
    item.isResolved = true;
  }
}

async function submitBulk() {
  loading.value = true;
  try {
    const toAdd = parsedData.value.filter((i) => i.status === "valid");
    let successCount = 0;

    for (const item of toAdd) {
      try {
        if (item.isUpdate && item.matchedWith) {
          await supplierStore.updateSupplier(item.matchedWith.id, {
            name: item.matchedWith.name,
            contactPerson: item.contactPerson || item.matchedWith.contactPerson,
            phone: item.phone || item.matchedWith.phone,
            email: item.email || item.matchedWith.email,
            address: item.address || item.matchedWith.address,
          });
        } else {
          await supplierStore.addSupplier({
            name: item.name,
            contactPerson: item.contactPerson,
            phone: item.phone,
            email: item.email,
            address: item.address,
          });
        }
        successCount++;
      } catch (err) {
        console.error(`Failed to add ${item.name}:`, err);
      }
    }

    dialogStore.success(`Successfully processed ${successCount} suppliers`);
    emit("success");
    emit("close");
  } catch (error) {
    dialogStore.error("Bulk addition failed: " + error.message);
  } finally {
    loading.value = false;
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
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

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bulk-modal {
  max-width: 650px;
}

.modal-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.stepper-progress {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg) 0;
  gap: var(--spacing-sm);
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
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
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid currentColor;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
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
  width: 60px;
  background: #e2e8f0;
  margin-bottom: 20px;
}

.step-line.completed {
  background: var(--success-color);
}

.template-section {
  text-align: center;
  margin-bottom: var(--spacing-lg);
}

.download-link-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  background: none;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.download-link-btn:hover {
  background: var(--primary-color);
  color: white;
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
  margin: 0 auto var(--spacing-md);
}

.file-type {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

.verification-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.stat-item {
  background: #f8fafc;
  padding: var(--spacing-sm);
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
  gap: var(--spacing-sm);
  max-height: 400px;
  overflow-y: auto;
  padding-right: 4px;
}

.verification-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm);
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.verification-item.duplicate {
  border-left: 4px solid var(--error-color);
}
.verification-item.fuzzy {
  border-left: 4px solid var(--warning-color);
}
.verification-item.valid {
  border-left: 4px solid var(--success-color);
}

.item-main {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.item-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.item-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin: 2px 0 0 0;
}

.badge {
  font-size: 0.7rem;
  padding: 1px 6px;
  border-radius: 10px;
  font-weight: 500;
}

.badge-error {
  background: #fee2e2;
  color: #b91c1c;
}
.badge-warning {
  background: #fef3c7;
  color: #92400e;
}
.badge-success {
  background: #dcfce7;
  color: #166534;
}
.badge-secondary {
  background: #f1f5f9;
  color: #475569;
}

.item-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.action-btn-sm {
  padding: 4px 8px;
  font-size: 0.75rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn-sm:hover {
  background: #f8fafc;
}

.action-btn-sm.primary {
  color: var(--primary-color);
  border-color: var(--primary-color);
}
.action-btn-sm.warning {
  color: var(--warning-color);
  border-color: var(--warning-color);
}
.action-btn-sm.success {
  color: var(--success-color);
  border-color: var(--success-color);
}

.text-success {
  color: var(--success-color);
}
.text-secondary {
  color: var(--text-secondary);
}

.modal-footer {
  margin-top: var(--spacing-lg);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: var(--text-secondary);
  transition: color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: var(--text-primary);
}

.submit-btn {
  padding: 0.75rem 1.5rem;
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

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.secondary-btn {
  padding: 0.75rem 1.5rem;
  background: white;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.secondary-btn:hover {
  background: var(--bg-hover);
}
</style>
