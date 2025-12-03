import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import PosTerminal from '../views/PosTerminal.vue'
import Inventory from '../views/Inventory.vue'
import Financials from '../views/Financials.vue'
import Setups from '../views/Setups.vue'
import Sales from '../views/Sales.vue'
import SalesSummary from '../views/SalesSummary.vue'
import Login from '../views/Login.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/login',
            name: 'login',
            component: Login,
            meta: { public: true }
        },
        {
            path: '/',
            name: 'dashboard',
            component: Dashboard,
            meta: { roles: ['admin'] }
        },
        {
            path: '/pos',
            name: 'pos',
            component: PosTerminal,
            meta: { roles: ['admin', 'cashier'] }
        },
        {
            path: '/sales',
            name: 'sales',
            component: Sales,
            meta: { roles: ['admin'] }
        },
        {
            path: '/sales-summary',
            name: 'sales-summary',
            component: SalesSummary,
            meta: { roles: ['admin'] }
        },
        {
            path: '/inventory',
            name: 'inventory',
            component: Inventory,
            meta: { roles: ['admin'] }
        },
        {
            path: '/financials',
            name: 'financials',
            component: Financials,
            meta: { roles: ['admin'] }
        },
        {
            path: '/setups',
            name: 'setups',
            component: Setups,
            meta: { roles: ['admin'] }
        }
    ]
})

router.beforeEach(async (to, from, next) => {
    // Dynamic import to avoid initialization issues
    const { useAuthStore } = await import('../stores/authStore')
    const authStore = useAuthStore()

    // Check session timeout for authenticated users
    if (authStore.isAuthenticated && !to.meta.public) {
        const sessionValid = authStore.checkSessionTimeout();
        if (!sessionValid) {
            // Session expired, redirect to login
            next('/login')
            return
        }
    }

    // Redirect to login if not authenticated and trying to access private route
    if (!to.meta.public && !authStore.isAuthenticated) {
        next('/login')
        return
    }

    // Redirect to home if authenticated and trying to access login
    if (to.path === '/login' && authStore.isAuthenticated) {
        // Redirect cashiers to POS, admins to dashboard
        if (authStore.currentUser?.role === 'cashier') {
            next('/pos')
        } else {
            next('/')
        }
        return
    }

    // Redirect cashiers from dashboard to POS
    if (to.path === '/' && authStore.currentUser?.role === 'cashier') {
        next('/pos')
        return
    }

    // Check role permissions
    if (to.meta.roles && !to.meta.roles.includes(authStore.currentUser?.role)) {
        // If role not allowed, redirect based on role
        if (authStore.currentUser?.role === 'cashier') {
            next('/pos')
        } else {
            next('/')
        }
        return
    }

    next()
})

export default router
