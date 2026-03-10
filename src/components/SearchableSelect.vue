<template>
  <div class="searchable-select" ref="containerRef">
    <div
      class="select-trigger"
      @click="toggleDropdown"
      :class="{ 'is-open': isOpen, 'is-disabled': disabled }"
    >
      <span class="selected-text" v-if="selectedOption">
        {{ selectedOption[labelKey] }}
      </span>
      <span class="placeholder-text" v-else>
        {{ placeholder }}
      </span>
      <ChevronDown class="icon-sm dropdown-icon" />
    </div>

    <div class="dropdown-menu" v-if="isOpen">
      <div class="search-header">
        <div class="search-input-wrapper">
          <Search class="icon-sm search-icon" />
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Type to search..."
            ref="searchInputRef"
            @click.stop
          />
        </div>
      </div>

      <ul class="options-list">
        <li v-if="filteredOptions.length === 0" class="no-results">
          No results found
        </li>
        <li
          v-for="option in filteredOptions"
          :key="option[valueKey]"
          class="option-item"
          :class="{ 'is-selected': modelValue === option[valueKey] }"
          @click="selectOption(option)"
        >
          <span class="option-main-label">{{ option[labelKey] }}</span>
          <span v-if="option.subLabel" class="option-sublabel">
            {{ option.subLabel }}
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { ChevronDown, Search } from "lucide-vue-next";

const props = defineProps({
  modelValue: {
    type: [String, Number, Object],
    default: null,
  },
  options: {
    type: Array,
    required: true,
  },
  labelKey: {
    type: String,
    default: "name",
  },
  valueKey: {
    type: String,
    default: "id",
  },
  placeholder: {
    type: String,
    default: "Select an option",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

const isOpen = ref(false);
const searchQuery = ref("");
const containerRef = ref(null);
const searchInputRef = ref(null);

const selectedOption = computed(() => {
  return props.options.find((opt) => opt[props.valueKey] === props.modelValue);
});

const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options;

  const query = searchQuery.value.toLowerCase();
  return props.options.filter((opt) => {
    const label = String(opt[props.labelKey] || "").toLowerCase();
    const subLabel = String(opt.subLabel || "").toLowerCase();
    return label.includes(query) || subLabel.includes(query);
  });
});

function toggleDropdown() {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    searchQuery.value = "";
    nextTick(() => {
      if (searchInputRef.value) {
        searchInputRef.value.focus();
      }
    });
  }
}

function closeDropdown() {
  isOpen.value = false;
}

function selectOption(option) {
  emit("update:modelValue", option[props.valueKey]);
  closeDropdown();
}

function handleClickOutside(event) {
  if (containerRef.value && !containerRef.value.contains(event.target)) {
    closeDropdown();
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
.searchable-select {
  position: relative;
  width: 100%;
}

.select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.6rem;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: var(--radius-md, 6px);
  background-color: var(--bg-white, #ffffff);
  cursor: pointer;
  min-height: 42px;
}

.select-trigger.is-disabled {
  background-color: #f1f5f9;
  cursor: not-allowed;
  opacity: 0.7;
}

.placeholder-text {
  color: #94a3b8;
}

.dropdown-icon {
  color: #64748b;
  width: 16px;
  height: 16px;
  transition: transform 0.2s;
}

.select-trigger.is-open .dropdown-icon {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 300px;
  margin-top: 4px;
  background-color: white;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: var(--radius-md, 6px);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 50;
  display: flex;
  flex-direction: column;
}

.search-header {
  display: flex;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  gap: 8px;
}

.search-input-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 8px;
  color: #94a3b8;
  width: 16px;
  height: 16px;
}

.search-input-wrapper input {
  width: 100%;
  padding: 6px 8px 6px 30px;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 4px;
  font-size: 0.875rem;
  outline: none;
}

.search-input-wrapper input:focus {
  border-color: var(--primary-color, #3b82f6);
}

.close-search-btn {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 8px;
}

.options-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  max-height: 200px;
}

.option-item {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
}

.option-item.is-selected {
  background-color: #eff6ff;
  color: #2563eb;
  font-weight: 500;
}

.option-sublabel {
  font-size: 0.75rem;
  color: #64748b;
  margin-left: 8px;
}

.no-results {
  padding: 12px;
  text-align: center;
  color: #94a3b8;
  font-size: 0.875rem;
}
</style>
