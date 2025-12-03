<template>
  <nav class="navbar">
    <div class="nav-brand">
      <Store class="brand-icon" />
      <h1>POS</h1>
      <button class="mobile-menu-btn" @click="isMenuOpen = !isMenuOpen" aria-label="Toggle menu">
        <span class="hamburger" :class="{ open: isMenuOpen }"></span>
      </button>
    </div>
    
    <div class="nav-links" :class="{ 'mobile-open': isMenuOpen }" v-if="isAuthenticated">
      <router-link v-if="isAdmin" to="/" :class="{ active: $route.path === '/' }" @click="isMenuOpen = false">
        <LayoutDashboard class="nav-icon" />
        Dashboard
      </router-link>
      <router-link to="/pos" :class="{ active: $route.path === '/pos' }" @click="isMenuOpen = false">
        <ShoppingCart class="nav-icon" />
        POS Terminal
      </router-link>
      <router-link v-if="isAdmin" to="/sales-summary" :class="{ active: $route.path === '/sales-summary' }" @click="isMenuOpen = false">
        <TrendingUp class="nav-icon" />
        Summary
      </router-link>
      <router-link v-if="isAdmin" to="/sales" :class="{ active: $route.path === '/sales' }" @click="isMenuOpen = false">
        <Receipt class="nav-icon" />
        Sales
      </router-link>
      <router-link v-if="isAdmin" to="/inventory" :class="{ active: $route.path === '/inventory' }" @click="isMenuOpen = false">
        <Package class="nav-icon" />
        Inventory
      </router-link>
      <router-link v-if="isAdmin" to="/financials" :class="{ active: $route.path === '/financials' }" @click="isMenuOpen = false">
        <Wallet class="nav-icon" />
        Financials
      </router-link>
      <router-link v-if="isAdmin" to="/setups" :class="{ active: $route.path === '/setups' }" @click="isMenuOpen = false">
        <Settings class="nav-icon" />
        Setups
      </router-link>
      
      <div class="user-menu">
        <span class="username">{{ currentUser?.username }}</span>
        <button @click="handleLogout" class="logout-btn" title="Logout">
          <LogOut class="nav-icon" />
        </button>
      </div>
    </div>
    
    <!-- Overlay for mobile menu -->
    <div class="mobile-overlay" v-if="isMenuOpen" @click="isMenuOpen = false"></div>
  </nav>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { Store, LayoutDashboard, ShoppingCart, Package, Wallet, Settings, Receipt, LogOut, TrendingUp } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const isMenuOpen = ref(false)

const isAdmin = computed(() => authStore.isAdmin)
const isAuthenticated = computed(() => authStore.isAuthenticated)
const currentUser = computed(() => authStore.currentUser)

function handleLogout() {
  authStore.logout()
  router.push('/login')
  isMenuOpen.value = false
}
</script>

<style scoped>
.navbar {
  background: var(--bg-white);
  padding: 1rem 2rem;
  box-shadow: var(--shadow-sm);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brand-icon {
  width: 28px;
  height: 28px;
  color: var(--primary-color);
}

.nav-brand h1 {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin: 0;
  font-weight: 500;
}

.nav-links {
  display: flex;
  gap: 1rem;
}

.nav-links a {
  text-decoration: none;
  color: var(--text-secondary);
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  transition: all 0.3s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-icon {
  width: 18px;
  height: 18px;
}

.nav-links a:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-links a.active {
  background: var(--primary-gradient);
  color: var(--text-white);
}

.nav-links a.active .nav-icon {
  color: var(--text-white);
}

.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  margin-left: auto;
}

.hamburger {
  display: block;
  width: 24px;
  height: 2px;
  background: var(--text-primary);
  position: relative;
  transition: all 0.3s;
}

.hamburger::before,
.hamburger::after {
  content: '';
  position: absolute;
  width: 24px;
  height: 2px;
  background: var(--text-primary);
  transition: all 0.3s;
}

.hamburger::before { top: -8px; }
.hamburger::after { bottom: -8px; }

.hamburger.open { background: transparent; }
.hamburger.open::before { transform: rotate(45deg); top: 0; }
.hamburger.open::after { transform: rotate(-45deg); bottom: 0; }

.mobile-overlay {
  display: none;
}

/* Mobile Styles */
@media (max-width: 768px) {
  .navbar {
    padding: 0.75rem 1rem;
    flex-direction: column;
  }
  
  .nav-brand h1 {
    font-size: var(--font-size-lg);
    font-weight: 500;
  }
  
  .brand-icon {
    width: 24px;
    height: 24px;
  }

  .nav-brand {
    width: 100%;
  }

  .mobile-menu-btn {
    display: block;
  }

  .nav-links {
    position: fixed;
    top: 60px; /* Adjust based on navbar height */
    left: 0;
    right: 0;
    background: var(--bg-white);
    flex-direction: column;
    padding: 1rem;
    gap: 0.5rem;
    box-shadow: var(--shadow-md);
    transform: translateY(-150%);
    transition: transform 0.3s ease-in-out;
    z-index: 99;
  }

  .nav-links.mobile-open {
    transform: translateY(0);
  }

  .nav-links a {
    width: 100%;
    justify-content: center;
    padding: 0.875rem;
    font-size: var(--font-size-base);
  }

  .mobile-overlay {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 98;
  }
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: 1rem;
  padding-left: 1rem;
  border-left: 1px solid var(--border-color);
}

.username {
  font-weight: 500;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.logout-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--danger-bg);
  padding: 0.5rem;
  border-radius: var(--radius-md);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logout-btn:hover {
  background: var(--danger-light);
}

@media (max-width: 768px) {
  .user-menu {
    margin-left: 0;
    padding-left: 0;
    border-left: none;
    border-top: 1px solid var(--border-color);
    padding-top: 1rem;
    justify-content: center;
    width: 100%;
  }
}
</style>