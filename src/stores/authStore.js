import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Idle timeout duration (how long user can be inactive before logout)
const IDLE_TIMEOUT_MS = 8 * 60 * 60 * 1000 // 8 hours in milliseconds

export const useAuthStore = defineStore('auth', () => {
    const currentUser = ref(JSON.parse(localStorage.getItem('user')) || null)
    const authToken = ref(localStorage.getItem('authToken') || null)
    // Track last activity time instead of login time
    const lastActivityTime = ref(parseInt(localStorage.getItem('lastActivityTime')) || null)

    const isAuthenticated = computed(() => !!currentUser.value && !!authToken.value)
    const isAdmin = computed(() => currentUser.value?.role === 'admin')

    /**
     * Check if session is valid based on last activity (not login time)
     */
    const isSessionValid = computed(() => {
        if (!lastActivityTime.value || !authToken.value) return false
        const now = Date.now()
        const idleTime = now - lastActivityTime.value
        return idleTime < IDLE_TIMEOUT_MS
    })

    /**
     * Refresh the activity timestamp - call this on any user activity
     * This extends the session timeout
     */
    function refreshActivity() {
        const now = Date.now()
        lastActivityTime.value = now
        localStorage.setItem('lastActivityTime', now.toString())
    }

    async function login(username, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Login failed')
            }

            const data = await response.json()
            const timestamp = Date.now()

            currentUser.value = data.user
            authToken.value = data.token
            lastActivityTime.value = timestamp

            localStorage.setItem('user', JSON.stringify(data.user))
            localStorage.setItem('authToken', data.token)
            localStorage.setItem('lastActivityTime', timestamp.toString())

            return true
        } catch (error) {
            console.error('Login error:', error)
            throw error
        }
    }

    function logout() {
        currentUser.value = null
        authToken.value = null
        lastActivityTime.value = null
        localStorage.removeItem('user')
        localStorage.removeItem('authToken')
        localStorage.removeItem('lastActivityTime')
    }

    /**
     * Check if session has expired due to inactivity
     * Returns true if session is valid, false if expired
     */
    function checkSessionTimeout() {
        if (!isAuthenticated.value) return true // Not logged in

        if (!isSessionValid.value) {
            logout()
            return false // Session expired due to inactivity
        }
        return true // Session valid
    }

    /**
     * Get remaining time before session expires (in ms)
     */
    function getTimeUntilExpiry() {
        if (!lastActivityTime.value) return 0
        const elapsed = Date.now() - lastActivityTime.value
        return Math.max(0, IDLE_TIMEOUT_MS - elapsed)
    }

    /**
     * Get authorization headers for API requests
     */
    function getAuthHeaders() {
        if (!authToken.value) return {}
        return {
            'Authorization': `Bearer ${authToken.value}`
        }
    }

    return {
        currentUser,
        authToken,
        lastActivityTime,
        isAuthenticated,
        isAdmin,
        isSessionValid,
        login,
        logout,
        refreshActivity,
        checkSessionTimeout,
        getTimeUntilExpiry,
        getAuthHeaders
    }
})
