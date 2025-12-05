import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 hours in milliseconds (match server)

export const useAuthStore = defineStore('auth', () => {
    const currentUser = ref(JSON.parse(localStorage.getItem('user')) || null)
    const loginTimestamp = ref(parseInt(localStorage.getItem('loginTimestamp')) || null)
    const authToken = ref(localStorage.getItem('authToken') || null)

    const isAuthenticated = computed(() => !!currentUser.value && !!authToken.value)
    const isAdmin = computed(() => currentUser.value?.role === 'admin')

    const isSessionValid = computed(() => {
        if (!loginTimestamp.value || !authToken.value) return false;
        const now = Date.now();
        return (now - loginTimestamp.value) < SESSION_TIMEOUT_MS;
    })

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
            const timestamp = Date.now();

            currentUser.value = data.user
            loginTimestamp.value = timestamp
            authToken.value = data.token

            localStorage.setItem('user', JSON.stringify(data.user))
            localStorage.setItem('loginTimestamp', timestamp.toString())
            localStorage.setItem('authToken', data.token)

            return true
        } catch (error) {
            console.error('Login error:', error)
            throw error
        }
    }

    function logout() {
        currentUser.value = null
        loginTimestamp.value = null
        authToken.value = null
        localStorage.removeItem('user')
        localStorage.removeItem('loginTimestamp')
        localStorage.removeItem('authToken')
    }

    function checkSessionTimeout() {
        if (isAuthenticated.value && !isSessionValid.value) {
            logout();
            return false; // Session expired
        }
        return true; // Session valid or not logged in
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
        loginTimestamp,
        authToken,
        isAuthenticated,
        isAdmin,
        isSessionValid,
        login,
        logout,
        checkSessionTimeout,
        getAuthHeaders
    }
})
