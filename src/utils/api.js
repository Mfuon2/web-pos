/**
 * API utility for making authenticated requests
 * Automatically includes JWT token in all requests
 */

/**
 * Get auth token from localStorage
 */
function getAuthToken() {
    return localStorage.getItem('authToken')
}

/**
 * Clear all auth-related data from localStorage
 */
function clearAuthData() {
    localStorage.removeItem('authToken')
    // Clean up legacy keys
    localStorage.removeItem('user')
    localStorage.removeItem('lastActivityTime')
    localStorage.removeItem('loginTimestamp')
}

/**
 * Make an authenticated fetch request
 * @param {string} url - Request URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>}
 */
export async function apiFetch(url, options = {}) {
    const token = getAuthToken()

    const headers = {
        ...options.headers
    }

    // Only set Content-Type for non-FormData requests
    // FormData needs the browser to set the multipart/form-data boundary automatically
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json'
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, {
        ...options,
        headers
    })

    // Handle 401 Unauthorized - redirect to login
    if (response.status === 401) {
        // Clear all auth data
        clearAuthData()

        // Only redirect if we're not already on the login page
        if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login'
        }
        throw new Error('Session expired. Please log in again.')
    }

    // Handle 403 Forbidden
    if (response.status === 403) {
        throw new Error('You do not have permission to access this resource.')
    }

    // Handle 429 Rate Limit
    if (response.status === 429) {
        const data = await response.json()
        throw new Error(data.message || 'Rate limit exceeded. Please slow down.')
    }

    return response
}

/**
 * GET request helper
 */
export async function apiGet(url) {
    return apiFetch(url, { method: 'GET' })
}

/**
 * POST request helper
 */
export async function apiPost(url, data) {
    return apiFetch(url, {
        method: 'POST',
        body: JSON.stringify(data)
    })
}

/**
 * PUT request helper
 */
export async function apiPut(url, data) {
    return apiFetch(url, {
        method: 'PUT',
        body: JSON.stringify(data)
    })
}

/**
 * DELETE request helper
 */
export async function apiDelete(url) {
    return apiFetch(url, { method: 'DELETE' })
}
