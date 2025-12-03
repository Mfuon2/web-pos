import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

export const useAuthStore = defineStore('auth', () => {
    const currentUser = ref(JSON.parse(localStorage.getItem('user')) || null)
    const loginTimestamp = ref(parseInt(localStorage.getItem('loginTimestamp')) || null)

    const isAuthenticated = computed(() => !!currentUser.value)
    const isAdmin = computed(() => currentUser.value?.role === 'admin')

    const isSessionValid = computed(() => {
        if (!loginTimestamp.value) return false;
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

            localStorage.setItem('user', JSON.stringify(data.user))
            localStorage.setItem('loginTimestamp', timestamp.toString())

            return true
        } catch (error) {
            console.error('Login error:', error)
            throw error
        }
    }

    function logout() {
        currentUser.value = null
        loginTimestamp.value = null
        localStorage.removeItem('user')
        localStorage.removeItem('loginTimestamp')
    }

    function checkSessionTimeout() {
        if (isAuthenticated.value && !isSessionValid.value) {
            logout();
            return false; // Session expired
        }
        return true; // Session valid or not logged in
    }

    return {
        currentUser,
        loginTimestamp,
        isAuthenticated,
        isAdmin,
        isSessionValid,
        login,
        logout,
        checkSessionTimeout
    }
})
