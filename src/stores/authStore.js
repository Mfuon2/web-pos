import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * Decode a JWT token and extract the payload
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded payload or null if invalid
 */
function decodeJWT(token) {
    if (!token) return null

    try {
        const parts = token.split('.')
        if (parts.length !== 3) return null

        // Decode the payload (second part)
        const payload = parts[1]
        // Base64URL decode
        let base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
        while (base64.length % 4) {
            base64 += '='
        }
        const decoded = atob(base64)
        return JSON.parse(decoded)
    } catch (e) {
        console.error('Failed to decode JWT:', e)
        return null
    }
}

/**
 * Check if a JWT token is expired
 * @param {Object} payload - Decoded JWT payload
 * @returns {boolean} True if expired
 */
function isTokenExpired(payload) {
    if (!payload || !payload.exp) return true
    const now = Math.floor(Date.now() / 1000)
    return payload.exp < now
}

/**
 * Clean up legacy keys from previous implementation
 */
function cleanupLegacyKeys() {
    localStorage.removeItem('loginTimestamp')
    localStorage.removeItem('lastActivityTime')
    localStorage.removeItem('user') // No longer needed - user info is in JWT
}

export const useAuthStore = defineStore('auth', () => {
    // Clean up legacy keys on store initialization
    cleanupLegacyKeys()

    // Only store the JWT token - all user info is decoded from it
    const authToken = ref(localStorage.getItem('authToken') || null)

    // Decode user info from JWT token
    const tokenPayload = computed(() => decodeJWT(authToken.value))

    // Extract user info from token payload
    const currentUser = computed(() => {
        const payload = tokenPayload.value
        if (!payload) return null
        return {
            id: payload.userId,
            username: payload.username,
            role: payload.role
        }
    })

    const isAuthenticated = computed(() => {
        if (!authToken.value || !tokenPayload.value) return false
        // Also check if token is not expired
        return !isTokenExpired(tokenPayload.value)
    })

    const isAdmin = computed(() => currentUser.value?.role === 'admin')

    // Get token expiration time from JWT
    const tokenExpiresAt = computed(() => {
        const payload = tokenPayload.value
        if (!payload || !payload.exp) return null
        return payload.exp * 1000 // Convert to milliseconds
    })

    /**
     * Check if session is valid (token not expired)
     */
    const isSessionValid = computed(() => {
        if (!authToken.value || !tokenPayload.value) return false
        return !isTokenExpired(tokenPayload.value)
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

            // Only store the token - user info will be decoded from it
            authToken.value = data.token
            localStorage.setItem('authToken', data.token)

            return true
        } catch (error) {
            console.error('Login error:', error)
            throw error
        }
    }

    async function logout() {
        // Call logout API to clear last_seen_at for offline status
        try {
            if (authToken.value) {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authToken.value}`,
                        'Content-Type': 'application/json'
                    }
                })
            }
        } catch (e) {
            // Ignore errors - still proceed with local logout
            console.error('Logout API error:', e)
        }

        authToken.value = null
        localStorage.removeItem('authToken')
        // Clean up any legacy keys
        cleanupLegacyKeys()

        // Redirect to login page
        window.location.href = '/login'
    }

    /**
     * Check if session has expired
     * Returns true if session is valid, false if expired
     */
    function checkSessionTimeout() {
        if (!authToken.value) return true // Not logged in

        if (!isSessionValid.value) {
            logout()
            return false // Session expired
        }
        return true // Session valid
    }

    /**
     * Get remaining time before session expires (in ms)
     */
    function getTimeUntilExpiry() {
        if (!tokenExpiresAt.value) return 0
        const remaining = tokenExpiresAt.value - Date.now()
        return Math.max(0, remaining)
    }

    /**
     * Refresh activity - for JWT, we just check if token is still valid
     * Note: JWT tokens are stateless, so we can't extend them client-side
     * The token will be valid for its full duration from creation
     */
    function refreshActivity() {
        // With JWT, the token has a fixed expiration from creation
        // We just verify it's still valid
        if (authToken.value && isTokenExpired(tokenPayload.value)) {
            logout()
        }
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
        tokenPayload,
        tokenExpiresAt,
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
