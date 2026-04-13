<template>
  <div class="pos-terminal">
    <!-- Products Section -->
    <div class="products-section" :class="{ 'mobile-hidden': showCartMobile }">
      <div class="controls">
        <input
          type="text"
          inputmode="search"
          ref="searchInputRef"
          v-model="searchQuery"
          placeholder="🔍 Search products or scan barcode..."
          class="search-bar"
          @keyup.enter="handleBarcodeSearch"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
        />
        <select v-model="selectedCategory" class="category-filter">
          <option value="">All Categories</option>
          <option v-for="cat in categories" :key="cat" :value="cat">
            {{ cat }}
          </option>
        </select>
      </div>

      <div v-if="loading" class="loading">Loading products...</div>
      <div v-else-if="error" class="error">{{ error }}</div>

      <div v-else class="products-container">
        <div v-for="group in groupedFilteredProducts" :key="group.category" class="category-group">
          <h3 class="category-title">{{ group.category }}</h3>
          <div class="products-grid">
            <ProductCard
              v-for="product in group.products"
              :key="product.id"
              :product="product"
              @add-to-cart="addToCart"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Cart Section (Sidebar on Desktop, Full Screen Overlay on Mobile) -->
    <div class="cart-section" :class="{ 'mobile-visible': showCartMobile }">
      <div class="cart-header">
        <h2>
          <ShoppingCart class="header-icon" />
          Current Sale
        </h2>
        <button
          class="close-cart-btn mobile-only"
          @click="showCartMobile = false"
        >
          <X class="icon-sm" />
        </button>
      </div>

      <div class="cart-items">
        <div v-if="cart.length === 0" class="empty-cart">Cart is empty</div>
        <div
          v-else
          v-for="item in cart"
          :key="item.product_id"
          class="cart-item"
        >
          <div class="item-info">
            <h4>{{ item.name }}</h4>
            <div class="price-edit-container">
              <div
                v-if="editingPriceId === item.product_id"
                class="price-input-wrapper"
              >
                <input
                  type="number"
                  v-model.number="editingPriceValue"
                  class="price-input"
                  min="0"
                  step="0.01"
                  @keyup.enter="savePrice(item.product_id)"
                  @keyup.esc="cancelEditPrice"
                  v-focus
                />
                <button
                  @click="savePrice(item.product_id)"
                  class="save-price-btn"
                  title="Save Price"
                >
                  <Check class="icon-sm text-success" />
                </button>
                <button
                  @click="cancelEditPrice"
                  class="cancel-price-btn"
                  title="Cancel"
                >
                  <X class="icon-sm text-danger" />
                </button>
              </div>
              <p v-else class="price-display">
                {{ formatCurrency(item.price) }} x {{ item.quantity }}
                <button
                  @click="startEditPrice(item)"
                  class="edit-price-btn"
                  title="Edit Price"
                >
                  <Edit2 class="icon-xs" />
                </button>
              </p>
            </div>
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

        <div class="date-selector">
          <label>
            <Calendar class="icon-sm" />
            Sales Date:
          </label>
          <input
            type="date"
            v-model="saleDate"
            :max="maxDate"
            class="date-input"
          />
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
            :class="{ active: paymentMethod === 'mpesa' }"
            @click="paymentMethod = 'mpesa'"
          >
            <Smartphone class="icon-sm" />
            M-Pesa
          </button>
        </div>

        <button
          class="checkout-btn"
          @click="handleCheckout"
          :disabled="cart.length === 0 || processing || !paymentMethod"
        >
          {{
            processing
              ? "Processing..."
              : !paymentMethod
                ? "Select Payment Method"
                : "Complete Sale"
          }}
        </button>
        <div class="action-buttons-row">
          <button
            class="loan-btn"
            @click="initiateLoan"
            :disabled="processing || cart.length === 0"
            title="Loan out items"
          >
            <ArrowUpRight class="icon-sm" />
            Loan Items
          </button>
          <button
            class="borrow-btn"
            @click="initiateBorrow"
            :disabled="processing || cart.length === 0"
            title="Manually record items as borrowed"
          >
            <ArrowDownLeft class="icon-sm" />
            Borrow Items
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Bottom Bar (Only visible on mobile when cart is hidden) -->
    <div class="mobile-bottom-bar mobile-only" v-if="!showCartMobile">
      <div class="cart-summary" @click="showCartMobile = true">
        <span class="cart-count-badge" v-if="cartItemCount > 0">{{
          cartItemCount
        }}</span>
        <span class="cart-total-preview"
          >Total: {{ formatCurrency(cartTotal) }}</span
        >
        <button class="view-cart-btn">
          <ShoppingCart class="icon-sm" />
          View Cart
        </button>
      </div>
    </div>

    <BorrowedItemModal
      v-if="showBorrowedModal"
      :items="pendingDeficits"
      :borrowedAt="saleDate"
      :isManualBorrow="isManualBorrowing"
      :isSubmitting="isBorrowingProcessing"
      @confirm="handleBorrowingConfirm"
      @close="handleBorrowingClose"
    />

    <LoanModal
      v-if="showLoanModal"
      :items="cart"
      :loading="processing"
      :loanDate="saleDate"
      @confirm="handleLoanConfirm"
      @close="showLoanModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useProductStore } from "../stores/productStore";
import { useCartStore } from "../stores/cartStore";
import ProductCard from "../components/ProductCard.vue";
import {
  ShoppingCart,
  Trash2,
  Banknote,
  Smartphone,
  X,
  Check,
  Edit2,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
} from "lucide-vue-next";
import { formatCurrency } from "../utils/currency";

import { useDialogStore } from "../stores/dialogStore";
import { useBorrowedStore } from "../stores/borrowedStore";
import { useLoanStore } from "../stores/loanStore";
import BorrowedItemModal from "../components/BorrowedItemModal.vue";
import LoanModal from "../components/LoanModal.vue";

const productStore = useProductStore();
const cartStore = useCartStore();
const dialogStore = useDialogStore();
const borrowedStore = useBorrowedStore();
const loanStore = useLoanStore();

const searchQuery = ref("");
const selectedCategory = ref("");
const paymentMethod = ref(null);
const processing = ref(false);
const showCartMobile = ref(false);
const searchInputRef = ref(null);

// Price Editing State
const editingPriceId = ref(null);
const editingPriceValue = ref(0);

const getLocalDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const maxDate = getLocalDate();
const saleDate = ref(getLocalDate());

const products = computed(() => productStore.products);
const loading = computed(() => productStore.loading);
const error = computed(() => productStore.error);
const cart = computed(() => cartStore.items);
const cartTotal = computed(() => cartStore.total);
const cartItemCount = computed(() =>
  cart.value.reduce((sum, item) => sum + item.quantity, 0),
);

const categories = computed(() => {
  const cats = new Set(products.value.map((p) => p.category).filter(Boolean));
  return Array.from(cats);
});

const filteredProducts = computed(() => {
  return products.value.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (product.barcode && product.barcode.includes(searchQuery.value));
    const matchesCategory =
      !selectedCategory.value || product.category === selectedCategory.value;
    const isNotDeleted = !product.deleted_at;
    return matchesSearch && matchesCategory && isNotDeleted;
  });
});

const groupedFilteredProducts = computed(() => {
  const groups = {};
  filteredProducts.value.forEach(product => {
    const cat = product.category || 'Uncategorized';
    if (!groups[cat]) {
      groups[cat] = { category: cat, products: [] };
    }
    groups[cat].products.push(product);
  });
  
  return Object.values(groups).sort((a, b) => {
    if (a.category === 'Uncategorized') return 1;
    if (b.category === 'Uncategorized') return -1;
    return a.category.localeCompare(b.category);
  });
});

function addToCart(product) {
  cartStore.addItem(product);
  // Optional: Show a toast notification here
}

function updateQuantity(productId, change) {
  const item = cart.value.find((i) => i.product_id === productId);
  if (item) {
    const newQuantity = item.quantity + change;
    cartStore.updateQuantity(productId, newQuantity);
  }
}

function removeFromCart(productId) {
  cartStore.removeItem(productId);
}

// Price Editing Methods
function startEditPrice(item) {
  editingPriceId.value = item.product_id;
  editingPriceValue.value = item.price;
}

function savePrice(productId) {
  if (editingPriceValue.value >= 0) {
    cartStore.updateItemPrice(productId, editingPriceValue.value);
  }
  editingPriceId.value = null;
}

function cancelEditPrice() {
  editingPriceId.value = null;
}

function handleBarcodeSearch() {
  const product = products.value.find((p) => p.barcode === searchQuery.value);
  if (product) {
    addToCart(product);
    searchQuery.value = "";
  }
}

async function handleCheckout() {
  if (cart.value.length === 0) return;

  // Check for negative stock
  const deficits = [];
  for (const item of cart.value) {
    const product = products.value.find((p) => p.id === item.product_id);
    if (product && product.stock - item.quantity < 0) {
      deficits.push({
        product: product,
        deficit: item.quantity - Math.max(0, product.stock),
      });
    }
  }

  if (deficits.length > 0) {
    // Start borrowing workflow
    pendingDeficits.value = deficits;
    showBorrowedModal.value = true;
    return;
  }

  // Confirm before completing the sale
  const itemsList = cart.value
    .map(
      (item) =>
        `${item.quantity}x ${item.name} @ ${formatCurrency(item.price)} = ${formatCurrency(item.quantity * item.price)}`,
    )
    .join("\n");

  const confirmed = await dialogStore.confirm(
    `Complete sale via ${paymentMethod.value}?\n\nItems:\n${itemsList}\n\nTotal: ${formatCurrency(cartTotal.value)}`,
  );

  if (!confirmed) return;

  await processCheckout();
}

async function processCheckout(deduct_stock = true) {
  processing.value = true;
  try {
    // 1. Process Sale
    await cartStore.checkout(paymentMethod.value, saleDate.value, deduct_stock);

    dialogStore.success("Sale completed successfully!");
    productStore.fetchProducts();
    paymentMethod.value = null;
    saleDate.value = getLocalDate(); // Reset date
    showCartMobile.value = false;
  } catch (err) {
    dialogStore.error("Checkout failed: " + err.message);
  } finally {
    processing.value = false;
  }
}

// Borrowing Workflow State
const showBorrowedModal = ref(false);
const pendingDeficits = ref([]);
const isManualBorrowing = ref(false);
const isBorrowingProcessing = ref(false);

function initiateBorrow() {
  if (cart.value.length === 0) return;

  pendingDeficits.value = cart.value.map((item) => {
    const product = products.value.find((p) => p.id === item.product_id) || {
      id: item.product_id,
      name: item.name,
    };
    return {
      product: product,
      deficit: item.quantity,
    };
  });
  isManualBorrowing.value = true;
  showBorrowedModal.value = true;
}

async function handleBorrowingConfirm(borrowings, reduceStock = true) {
  isBorrowingProcessing.value = true;
  try {
    for (const borrowing of borrowings) {
      await borrowedStore.addBorrowedItem(borrowing);
    }
    showBorrowedModal.value = false;

    // Process final checkout, passing down reduceStock preference
    // Non-manual borrows (stock deficit) always deduct stock true by default because we bypass the checkbox logic
    await processCheckout(isManualBorrowing.value ? reduceStock : true);
  } catch (err) {
    dialogStore.error("Failed to record borrowings: " + err.message);
  } finally {
    isManualBorrowing.value = false;
    isBorrowingProcessing.value = false;
  }
}

function handleBorrowingClose() {
  showBorrowedModal.value = false;
  if (!isManualBorrowing.value) {
    dialogStore.alert("Sale cancelled. Please adjust quantities or stock.");
  }
  isManualBorrowing.value = false;
}

// Loan Workflow State
const showLoanModal = ref(false);

function initiateLoan() {
  if (cart.value.length === 0) return;
  showLoanModal.value = true;
}

async function handleLoanConfirm(details) {
  processing.value = true;
  try {
    const loanData = {
      ...details,
      loaned_at: saleDate.value,
      items: cart.value.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      })),
    };

    await loanStore.createLoan(loanData);

    dialogStore.success("Loan recorded successfully!");
    cartStore.clearCart();
    productStore.fetchProducts();
    showLoanModal.value = false;
    showCartMobile.value = false;
  } catch (err) {
    dialogStore.error("Loan failed: " + err.message);
  } finally {
    processing.value = false;
  }
}

onMounted(() => {
  productStore.fetchProducts();
  // Auto-focus search input for faster barcode scanning
  if (searchInputRef.value) {
    searchInputRef.value.focus();
  }
});

// Custom directive for auto-focusing the price input
const vFocus = {
  mounted: (el) => el.focus(),
};
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
  font-size: 16px; /* Prevents iOS zoom on focus */
  box-shadow: var(--shadow-sm);
  font-weight: 400;
  -webkit-appearance: none; /* Remove iOS default styling */
  appearance: none;
  touch-action: manipulation; /* Better touch handling */
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

.products-container {
  overflow-y: auto;
  padding: 0.5rem;
  flex: 1;
}

.category-group {
  margin-bottom: 1.5rem;
}

.category-title {
  margin-top: 0;
  margin-bottom: 0.75rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 0.5rem;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 0.5rem;
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
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.05);
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

.price-edit-container {
  display: flex;
  align-items: center;
  min-height: 28px;
}

.price-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.edit-price-btn {
  background: none;
  border: none;
  padding: 0.2rem;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  transition: all 0.2s;
}

.edit-price-btn:hover {
  background: var(--bg-hover);
  color: var(--primary-color);
  opacity: 1;
}

.price-input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.price-input {
  width: 80px;
  padding: 0.2rem 0.4rem;
  border: 1px solid var(--primary-color);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-family: inherit;
  outline: none;
}

.save-price-btn,
.cancel-price-btn {
  background: none;
  border: none;
  padding: 0.2rem;
  cursor: pointer;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.save-price-btn:hover {
  background: rgba(34, 197, 94, 0.1);
}

.cancel-price-btn:hover {
  background: rgba(239, 68, 68, 0.1);
}

.icon-xs {
  width: 14px;
  height: 14px;
}

.text-success {
  color: #22c55e;
}

.text-danger {
  color: #ef4444;
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

.date-selector {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: var(--bg-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.date-selector label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.date-input {
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-family: inherit;
  color: var(--text-primary);
  background: var(--bg-hover);
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
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.action-buttons-row {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.75rem;
  width: 100%;
}

.loan-btn,
.borrow-btn {
  flex: 1;
  padding: 0.75rem;
  background: var(--bg-white);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

.loan-btn:not(:disabled):hover,
.borrow-btn:not(:disabled):hover {
  background: var(--bg-hover);
  border-color: var(--text-secondary);
}

.loan-btn:disabled,
.borrow-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
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
