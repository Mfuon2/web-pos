<template>
  <div class="product-card" @click="$emit('add-to-cart', product)">
    <div class="card-content">
      <!-- Product Image or Icon -->
      <div class="product-image-area">
        <img 
          v-if="product.image" 
          :src="product.image" 
          :alt="product.name"
          class="product-image"
        />
        <div v-else class="product-icon-wrapper">
          <component :is="getCategoryIcon(product.category)" class="product-icon" />
        </div>
      </div>
      
      <!-- Product Name at Bottom -->
      <div class="product-name">
        <h3>{{ product.name }}</h3>
      </div>
      
      <!-- Stock Badge -->
      <div class="stock-badge" :class="{ 'low-stock': product.stock < 10 }">
        {{ product.stock }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { Smartphone, Coffee, Utensils, ShoppingBag, Home, Package, Wine, Beer, GlassWater } from 'lucide-vue-next'

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

function getCategoryIcon(category) {
  const iconMap = {
    'Electronics': Smartphone,
    'Food': Utensils,
    'Beverages': Coffee,
    'Snacks': ShoppingBag,
    'Household': Home,
    'Alcohol': Wine,
    'Beer': Beer,
    'Cocktails': GlassWater,
    'Other': Package
  }
  return iconMap[category] || Package
}
</script>

<style scoped>
.product-card {
  background: var(--bg-white);
  border-radius: var(--radius-lg);
  min-height: 140px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid var(--border-color);
  overflow: hidden;
  user-select: none;
}

.product-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-color);
}

.product-card:active {
  transform: scale(0.98);
}

.card-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
}

/* Image/Icon Area - Takes up most of the card */
.product-image-area {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  min-height: 80px;
}

.product-image {
  width: 100%;
  height: 100%;
  max-height: 90px;
  object-fit: contain;
  border-radius: var(--radius-md);
}

.product-icon-wrapper {
  background: var(--bg-hover);
  padding: 1rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.product-card:hover .product-icon-wrapper {
  background: var(--primary-light);
}

.product-icon {
  width: 28px;
  height: 28px;
  color: var(--primary-color);
}

/* Product Name at Bottom */
.product-name {
  width: 100%;
  padding: 0.5rem;
  background: var(--bg-hover);
  border-top: 1px solid var(--border-color);
}

.product-name h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.3;
  text-align: center;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
}

/* Stock Badge */
.stock-badge {
  position: absolute;
  top: 0.35rem;
  right: 0.35rem;
  font-size: var(--font-size-xs);
  font-weight: 500;
  padding: 0.1rem 0.35rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  color: var(--text-secondary);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.stock-badge.low-stock {
  background: var(--danger-bg);
  color: var(--text-white);
}
</style>
