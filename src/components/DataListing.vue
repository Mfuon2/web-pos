<template>
  <div class="data-listing-container">
    <div class="listing-toolbar">
      <div class="toolbar-left">
        <!-- Optional: search input can be passed via slot -->
        <slot name="search"></slot>
      </div>
      <div class="toolbar-right">
        <!-- Column selector -->
        <div class="dropdown" ref="columnDropdownRef">
          <button
            @click="showColumnDropdown = !showColumnDropdown"
            class="toolbar-btn"
          >
            <LayoutList class="icon-sm" />
            <span class="btn-text" v-if="!isMobile">Columns</span>
          </button>
          <div v-if="showColumnDropdown" class="dropdown-menu">
            <div class="dropdown-header">Visible Columns</div>
            <label
              v-for="col in internalColumns"
              :key="col.key"
              class="dropdown-item checkbox-label"
              :class="{ disabled: col.primary }"
            >
              <input
                type="checkbox"
                v-model="col.visible"
                :disabled="col.primary"
              />
              {{ col.label }}
            </label>
          </div>
        </div>

        <!-- View mode toggle -->
        <div class="view-toggles">
          <button
            @click="userViewMode = 'table'"
            class="toolbar-btn icon-btn"
            :class="{ active: computedViewMode === 'table' }"
            title="Table View"
          >
            <Table class="icon-sm" />
          </button>
          <button
            @click="userViewMode = 'grid'"
            class="toolbar-btn icon-btn"
            :class="{ active: computedViewMode === 'grid' }"
            title="Grid View"
          >
            <LayoutGrid class="icon-sm" />
          </button>
        </div>
      </div>
    </div>

    <!-- Table View -->
    <div v-if="computedViewMode === 'table'" class="table-container">
      <table>
        <thead>
          <tr>
            <th
              v-for="col in visibleColumns"
              :key="col.key"
              :class="`align-${col.align || 'left'}`"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-for="item in data" :key="item[rowKey]">
            <tr
              :class="getRowClass(item)"
              @click="$emit('rowClick', item)"
              style="cursor: pointer"
            >
              <td
                v-for="col in visibleColumns"
                :key="col.key"
                :class="`align-${col.align || 'left'}`"
              >
                <slot :name="`cell-${col.key}`" :item="item">
                  {{ item[col.key] }}
                </slot>
              </td>
            </tr>
            <tr
              v-if="$slots.expandedRow && expandedKeys.includes(item[rowKey])"
              class="expanded-row-wrapper"
            >
              <td :colspan="visibleColumns.length" style="padding: 0">
                <slot name="expandedRow" :item="item"></slot>
              </td>
            </tr>
          </template>
          <tr v-if="data.length === 0">
            <td :colspan="visibleColumns.length" class="empty-state">
              <slot name="empty">No items found.</slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Grid View -->
    <div v-else class="grid-container">
      <div
        v-for="item in data"
        :key="item[rowKey]"
        class="grid-card"
        :class="getRowClass(item)"
        @click="$emit('rowClick', item)"
        style="cursor: pointer"
      >
        <div class="card-header" v-if="primaryColumn">
          <div class="primary-content">
            <slot :name="`cell-${primaryColumn.key}`" :item="item">
              <strong>{{ item[primaryColumn.key] }}</strong>
            </slot>
          </div>
          <!-- Optionally move actions to the top right of the card -->
          <div
            class="card-actions"
            v-if="hasVisibleColumn('actions')"
            @click.stop
          >
            <slot name="cell-actions" :item="item"></slot>
          </div>
        </div>

        <div class="card-body">
          <template v-for="col in visibleColumns" :key="col.key">
            <div
              class="grid-row"
              v-if="col.key !== primaryColumn?.key && col.key !== 'actions'"
            >
              <span class="grid-label">{{ col.label }}</span>
              <span class="grid-value" :class="`align-${col.align || 'left'}`">
                <slot :name="`cell-${col.key}`" :item="item">
                  {{ item[col.key] }}
                </slot>
              </span>
            </div>
          </template>
        </div>

        <div
          v-if="$slots.expandedRow && expandedKeys.includes(item[rowKey])"
          class="card-expanded"
        >
          <slot name="expandedRow" :item="item"></slot>
        </div>
      </div>
      <div v-if="data.length === 0" class="empty-state card">
        <slot name="empty">No items found.</slot>
      </div>
    </div>

    <div class="listing-footer">
      <slot name="pagination"></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { Table, LayoutGrid, LayoutList } from "lucide-vue-next";

const props = defineProps({
  data: {
    type: Array,
    required: true,
  },
  columns: {
    type: Array,
    required: true,
    // [ { key, label, primary: bool, hidden: bool, align: 'left'|'center'|'right' } ]
  },
  rowKey: {
    type: String,
    default: "id",
  },
  rowClass: {
    type: Function,
    default: () => "",
  },
  expandedKeys: {
    type: Array,
    default: () => [],
  },
});

defineEmits(["rowClick"]);

// Internal Columns State
const internalColumns = ref([]);

watch(
  () => props.columns,
  (newCols) => {
    // Try to preserve existing visibility state if columns change order but keep same keys
    const oldVisibilities = {};
    internalColumns.value.forEach((col) => {
      oldVisibilities[col.key] = col.visible;
    });

    internalColumns.value = newCols.map((col) => {
      return {
        ...col,
        visible: Object.prototype.hasOwnProperty.call(oldVisibilities, col.key)
          ? oldVisibilities[col.key]
          : !col.hidden || col.primary,
      };
    });
  },
  { immediate: true, deep: true },
);

const visibleColumns = computed(() =>
  internalColumns.value.filter((c) => c.visible),
);
const primaryColumn = computed(
  () =>
    internalColumns.value.find((c) => c.primary) || internalColumns.value[0],
);

function hasVisibleColumn(key) {
  return visibleColumns.value.some((c) => c.key === key);
}

function getRowClass(item) {
  return props.rowClass(item);
}

// View Mode Logic
const userViewMode = ref(null);
const isMobile = ref(false);

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

onMounted(() => {
  checkMobile();
  window.addEventListener("resize", checkMobile);
  document.addEventListener("click", closeDropdown);
});

onUnmounted(() => {
  window.removeEventListener("resize", checkMobile);
  document.removeEventListener("click", closeDropdown);
});

const computedViewMode = computed(() => {
  if (userViewMode.value) return userViewMode.value;
  return isMobile.value ? "grid" : "table";
});

// Dropdown Logic
const showColumnDropdown = ref(false);
const columnDropdownRef = ref(null);

const closeDropdown = (e) => {
  if (columnDropdownRef.value && !columnDropdownRef.value.contains(e.target)) {
    showColumnDropdown.value = false;
  }
};
</script>

<style scoped>
.data-listing-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.listing-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
}

.toolbar-left {
  flex: 1;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-left: auto;
}

.view-toggles {
  display: flex;
  background: var(--bg-hover);
  border-radius: var(--radius-md);
  border: var(--border-width) solid var(--border-color);
  padding: 2px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.4rem 0.75rem;
  background: var(--bg-white);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: var(--bg-hover);
  border-color: var(--primary-color);
}

.icon-btn {
  padding: 0.4rem;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
}

.icon-btn:hover,
.icon-btn.active {
  background: var(--bg-white);
  color: var(--primary-color);
  box-shadow: var(--shadow-sm);
}

.dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: var(--bg-white);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-sm) 0;
  min-width: 180px;
  z-index: 100;
  max-height: 300px;
  overflow-y: auto;
  text-align: left;
}

.dropdown-header {
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
  border-bottom: var(--border-width) solid var(--border-color);
  margin-bottom: var(--spacing-xs);
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  gap: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  user-select: none;
}

.dropdown-item:hover {
  background: var(--bg-hover);
}

.dropdown-item.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.dropdown-item input {
  cursor: pointer;
}

.dropdown-item.disabled input {
  cursor: not-allowed;
}

/* Grid Layout */
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

.grid-card {
  background: var(--bg-white);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.grid-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: var(--border-width) solid var(--border-color);
}

.primary-content {
  flex: 1;
  word-break: break-word;
}

.card-actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
  margin-left: 1rem;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.grid-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: var(--font-size-sm);
  gap: 1rem;
}

.grid-label {
  color: var(--text-secondary);
  font-weight: 500;
  flex-shrink: 0;
}

.grid-value {
  color: var(--text-primary);
  text-align: right;
  word-break: break-word;
}

.align-center {
  text-align: center;
  justify-content: center;
}
.align-right {
  text-align: right;
  justify-content: flex-end;
}
.align-left {
  text-align: left;
  justify-content: flex-start;
}

.card-expanded {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
  width: 100%;
  overflow-x: auto;
}
</style>
