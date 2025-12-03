<template>
  <div class="product-card" @click="$emit('add-to-cart', product)">
    <div class="card-content">
      <div class="product-icon-wrapper">
        <component :is="getCategoryIcon(product.category)" class="product-icon" />
      </div>
      <div class="product-info">
        <h3>{{ product.name }}</h3>
        <p class="price">{{ formatCurrency(product.price) }}</p>
      </div>
      <div class="stock-badge" :class="{ 'low-stock': product.stock < 10 }">
        {{ product.stock }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { Smartphone, Coffee, Utensils, ShoppingBag, Home, Package, Wine, Beer, GlassWater } from 'lucide-vue-next'
import { formatCurrency } from '../utils/currency'

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
  aspect-ratio: 1;
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
  justify-content: center;
  padding: 1rem;
  gap: 0.5rem;
}

.product-icon-wrapper {
  background: var(--bg-hover);
  padding: 0.75rem;
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
  width: 24px;
  height: 24px;
  color: var(--primary-color);
}

.product-info {
  text-align: center;
  width: 100%;
}

.product-card h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.price {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--primary-color);
  margin: 0;
}

.stock-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.4rem;
  border-radius: 10px;
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.stock-badge.low-stock {
  background: var(--danger-bg);
  color: var(--text-white);
}
</style>
