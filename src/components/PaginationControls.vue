<template>
  <div class="pagination-controls" v-if="totalPages > 1">
    <div class="pagination-info">
      Showing {{ startItem }} to {{ endItem }} of {{ total }} results
    </div>
    <div class="pagination-buttons">
      <button 
        class="page-btn" 
        :disabled="currentPage === 1"
        @click="$emit('page-change', currentPage - 1)"
      >
        Previous
      </button>
      
      <div class="page-numbers">
        <button 
          v-for="page in displayedPages" 
          :key="page"
          class="page-number"
          :class="{ active: currentPage === page }"
          @click="$emit('page-change', page)"
        >
          {{ page }}
        </button>
      </div>

      <button 
        class="page-btn" 
        :disabled="currentPage === totalPages"
        @click="$emit('page-change', currentPage + 1)"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  limit: {
    type: Number,
    default: 20
  },
  total: {
    type: Number,
    required: true
  }
})

defineEmits(['page-change'])

const startItem = computed(() => ((props.currentPage - 1) * props.limit) + 1)
const endItem = computed(() => Math.min(props.currentPage * props.limit, props.total))

const displayedPages = computed(() => {
  const delta = 2
  const range = []
  for (let i = Math.max(2, props.currentPage - delta); i <= Math.min(props.totalPages - 1, props.currentPage + delta); i++) {
    range.push(i)
  }

  if (props.currentPage - delta > 2) {
    range.unshift('...')
  }
  if (props.currentPage + delta < props.totalPages - 1) {
    range.push('...')
  }

  range.unshift(1)
  if (props.totalPages > 1) {
    range.push(props.totalPages)
  }

  return range.filter((val, index, self) => typeof val === 'number' || (val === '...' && self[index - 1] !== '...'))
})
</script>

<style scoped>
.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--bg-white);
  border-top: 1px solid var(--border-color);
  flex-wrap: wrap;
  gap: 1rem;
}

.pagination-info {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.pagination-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  background: var(--bg-white);
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--text-primary);
  font-weight: 500;
  transition: all 0.2s;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--bg-hover);
}

.page-btn:not(:disabled):hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

.page-number {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--text-secondary);
  background: transparent;
  transition: all 0.2s;
}

.page-number:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.page-number.active {
  background: var(--primary-color);
  color: var(--text-white);
  font-weight: 600;
}

@media (max-width: 640px) {
  .pagination-controls {
    flex-direction: column;
    justify-content: center;
  }
  
  .page-numbers {
    display: none; /* Hide page numbers on very small screens if needed, or adjust */
  }
}
</style>
