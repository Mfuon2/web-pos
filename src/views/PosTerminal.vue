<template>
  <div class="pos-terminal">
    <!-- Products Section -->
    <div class="products-section" :class="{ 'mobile-hidden': showCartMobile }">
      <div class="controls">
        <input 
          v-model="searchQuery" 
          placeholder="🔍 Search products or scan barcode..." 
          class="search-bar"
          @keyup.enter="handleBarcodeSearch"
        />
        <select v-model="selectedCategory" class="category-filter">
          <option value="">All Categories</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>

      <div v-if="loading" class="loading">Loading products...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      
      <div v-else class="products-grid">
        <ProductCard 
          v-for="product in filteredProducts" 
          :key="product.id" 
          :product="product" 
          @add-to-cart="addToCart" 
        />
      </div>
    </div>

    <!-- Cart Section (Sidebar on Desktop, Full Screen Overlay on Mobile) -->
    <div class="cart-section" :class="{ 'mobile-visible': showCartMobile }">
      <div class="cart-header">
        <h2>
          <ShoppingCart class="header-icon" />
          Current Sale
        </h2>
        <button class="close-cart-btn mobile-only" @click="showCartMobile = false">
          <X class="icon-sm" />
        </button>
      </div>
      
      <div class="cart-items">
        <div v-if="cart.length === 0" class="empty-cart">
          Cart is empty
        </div>
        <div v-else v-for="item in cart" :key="item.product_id" class="cart-item">
          <div class="item-info">
            <h4>{{ item.name }}</h4>
            <p>{{ formatCurrency(item.price) }} x {{ item.quantity }}</p>
          </div>
          <div class="item-actions">
            <button @click="updateQuantity(item.product_id, -1)">-</button>
            <span>{{ item.quantity }}</span>
            <button @click="updateQuantity(item.product_id, 1)">+</button>
            <button @click="removeFromCart(item.product_id)" class="delete-btn">
              <Trash2 class="icon-sm" />
            </button>
          </div>
        </div>
      </div>

      <div class="cart-footer">
        <div class="total">
          <span>Total:</span>
          <span>{{ formatCurrency(cartTotal) }}</span>
        </div>
        
        <div class="payment-methods">
          <button 
            class="pay-btn"
            :class="{ active: paymentMethod === 'cash' }"
            @click="paymentMethod = 'cash'"
          >
            <Banknote class="icon-sm" />
            Cash
          </button>
          <button 
            class="pay-btn"
            :class="{ active: paymentMethod === 'card' }"
            @click="paymentMethod = 'card'"
          >
            <CreditCard class="icon-sm" />
            Card
          </button>
        </div>

        <button 
          class="checkout-btn" 
          @click="handleCheckout"
          :disabled="cart.length === 0 || processing"
        >
          {{ processing ? 'Processing...' : 'Complete Sale' }}
        </button>
      </div>
    </div>

    <!-- Mobile Bottom Bar (Only visible on mobile when cart is hidden) -->
    <div class="mobile-bottom-bar mobile-only" v-if="!showCartMobile">
      <div class="cart-summary" @click="showCartMobile = true">
        <span class="cart-count-badge" v-if="cartItemCount > 0">{{ cartItemCount }}</span>
        <span class="cart-total-preview">Total: {{ formatCurrency(cartTotal) }}</span>
        <button class="view-cart-btn">
          <ShoppingCart class="icon-sm" />
          View Cart
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useProductStore } from '../stores/productStore'
import { useCartStore } from '../stores/cartStore'
import ProductCard from '../components/ProductCard.vue'
import { ShoppingCart, Trash2, Banknote, CreditCard, X } from 'lucide-vue-next'
import { formatCurrency } from '../utils/currency'

import { useDialogStore } from '../stores/dialogStore'

const productStore = useProductStore()
const cartStore = useCartStore()
const dialogStore = useDialogStore()

const searchQuery = ref('')
const selectedCategory = ref('')
const paymentMethod = ref('cash')
const processing = ref(false)
const showCartMobile = ref(false)

const products = computed(() => productStore.products)
const loading = computed(() => productStore.loading)
const error = computed(() => productStore.error)
const cart = computed(() => cartStore.items)
const cartTotal = computed(() => cartStore.total)
const cartItemCount = computed(() => cart.value.reduce((sum, item) => sum + item.quantity, 0))

const categories = computed(() => {
  const cats = new Set(products.value.map(p => p.category).filter(Boolean))
  return Array.from(cats)
})

const filteredProducts = computed(() => {
  return products.value.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         (product.barcode && product.barcode.includes(searchQuery.value))
    const matchesCategory = !selectedCategory.value || product.category === selectedCategory.value
    const isNotDeleted = !product.deleted_at
    return matchesSearch && matchesCategory && isNotDeleted
  })
})

function addToCart(product) {
  cartStore.addItem(product)
  // Optional: Show a toast notification here
}

function updateQuantity(productId, change) {
  const item = cart.value.find(i => i.product_id === productId)
  if (item) {
    const newQuantity = item.quantity + change
    cartStore.updateQuantity(productId, newQuantity)
  }
}

function removeFromCart(productId) {
  cartStore.removeItem(productId)
}

function handleBarcodeSearch() {
  const product = products.value.find(p => p.barcode === searchQuery.value)
  if (product) {
    addToCart(product)
    searchQuery.value = ''
  }
}

async function handleCheckout() {
  if (cart.value.length === 0) return
  
  // Confirm before completing the sale
  const confirmed = await dialogStore.confirm(
    `Complete sale of ${formatCurrency(cartTotal.value)} via ${paymentMethod.value}?`
  )
  
  if (!confirmed) return
  
  processing.value = true
  try {
    await cartStore.checkout(paymentMethod.value)
    dialogStore.success('Sale completed successfully!')
    productStore.fetchProducts()
    showCartMobile.value = false // Close cart on mobile after sale
  } catch (err) {
    dialogStore.error('Checkout failed: ' + err.message)
  } finally {
    processing.value = false
  }
}

onMounted(() => {
  productStore.fetchProducts()
})
</script>

<style scoped>
.pos-terminal {
  display: flex;
  height: calc(100vh - 80px); /* Adjust based on navbar height */
  overflow: hidden;
  max-width: 1600px;
  margin: 0 auto;
}

/* Products Section */
.products-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  overflow: hidden;
}

.controls {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.search-bar {
  flex: 1;
  min-width: 200px;
  padding: 0.5rem 0.75rem;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  box-shadow: var(--shadow-sm);
  font-weight: 400;
}

.search-bar:focus {
  outline: none;
  border-color: var(--primary-color);
}

.category-filter {
  padding: 0.5rem 0.75rem;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: var(--bg-white);
  min-width: 120px;
  cursor: pointer;
  font-weight: 400;
}

.category-filter:focus {
  outline: none;
  border-color: var(--primary-color);
}

.categories {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.category-btn {
  padding: 0.35rem 0.75rem;
  background: var(--bg-white);
  border: var(--border-width) solid var(--border-color);
  border-radius: 16px;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;
  font-size: var(--font-size-xs);
  font-weight: 500;
}

.category-btn.active {
  background: var(--primary-color);
  color: var(--text-white);
  border-color: var(--primary-color);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 0.5rem;
  overflow-y: auto;
  padding: 0.5rem;
  align-content: start;
}

.product-card-wrapper {
  cursor: pointer;
  transition: transform 0.2s;
}

.product-card-wrapper:hover {
  transform: translateY(-4px);
}

/* Cart Section */
.cart-section {
  width: 400px;
  background: var(--bg-white);
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--border-color);
  box-shadow: -4px 0 12px rgba(0,0,0,0.05);
}

.cart-header {
  padding: 1.5rem;
  border-bottom: var(--border-width) solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cart-header h2 {
  margin: 0;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-icon {
  width: 24px;
  height: 24px;
  color: var(--primary-color);
}

.icon-sm {
  width: 18px;
  height: 18px;
}

.close-cart-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: var(--text-secondary);
}

.close-cart-btn:hover {
  color: var(--text-primary);
}

.cart-items {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--bg-hover);
  border-radius: var(--radius-md);
  margin-bottom: 0.5rem;
}

.item-info h4 {
  margin: 0 0 0.25rem 0;
  color: var(--text-primary);
}

.item-info p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.item-actions button {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: var(--border-width) solid var(--border-color);
  background: var(--bg-white);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.item-actions span {
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}

.cart-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
  background: var(--bg-hover);
}

.total {
  display: flex;
  justify-content: space-between;
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
}

.payment-methods {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.pay-btn {
  padding: 1rem;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--bg-white);
  border: var(--border-width) solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.pay-btn.active {
  background: var(--primary-color);
  color: var(--text-white);
  border-color: var(--primary-color);
}

.checkout-btn {
  width: 100%;
  padding: 1rem;
  background: var(--success-text);
  color: var(--text-white);
  border: none;
  border-radius: var(--radius-md);
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;
}

.checkout-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.checkout-btn:not(:disabled):hover {
  transform: translateY(-2px);
}

.empty-cart {
  text-align: center;
  color: var(--text-secondary);
  margin-top: 2rem;
}

.mobile-bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--bg-white);
  padding: 1rem;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
  z-index: 100;
}

.cart-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--primary-color);
  color: var(--text-white);
  padding: 1rem;
  border-radius: var(--radius-md);
  cursor: pointer;
}

.cart-count-badge {
  background: var(--bg-white);
  color: var(--primary-color);
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-weight: bold;
  font-size: 0.9rem;
}

.view-cart-btn {
  background: none;
  border: none;
  color: var(--text-white);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.close-cart-btn {
  display: none;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .cart-section {
    width: 350px;
  }
}

@media (max-width: 768px) {
  .pos-terminal {
    flex-direction: column;
    height: calc(100vh - 60px);
  }

  .cart-section {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    z-index: 200;
    transform: translateY(100%);
    transition: transform 0.3s ease-in-out;
  }

  .cart-section.mobile-visible {
    transform: translateY(0);
  }

  .close-cart-btn {
    display: block;
  }

  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    padding-bottom: 80px; /* Space for bottom bar */
  }
}
</style>
