/**
 * Authentication utilities for API security
 * Uses simple session tokens stored in memory (for local dev) or KV (for production)
 */

// In-memory session store (used when KV is not available)
const sessions = new Map()

// Session configuration
const SESSION_EXPIRY = 8 * 60 * 60 * 1000 // 8 hours in milliseconds

/**
 * Generate a secure random session token
 */
export function generateSessionToken() {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Create a new session for a user
 * @param {Object} user - User object (without password)
 * @param {Object} env - Environment with optional KV binding
 * @returns {Promise<string>} Session token
 */
export async function createSession(user, env) {
    const token = generateSessionToken()
    const session = {
        userId: user.id,
        username: user.username,
        role: user.role,
        createdAt: Date.now(),
        expiresAt: Date.now() + SESSION_EXPIRY
    }

    // Try to use KV if available, otherwise use in-memory store
    if (env?.SESSIONS) {
        await env.SESSIONS.put(token, JSON.stringify(session), {
            expirationTtl: SESSION_EXPIRY / 1000
        })
    } else {
        sessions.set(token, session)
    }

    return token
}

/**
 * Validate a session token and return user info
 * Implements sliding expiration - extends session on each valid access
 * @param {string} token - Session token from Authorization header
 * @param {Object} env - Environment with optional KV binding
 * @returns {Promise<Object|null>} User session or null if invalid
 */
export async function validateSession(token, env) {
    if (!token) return null

    let session = null

    // Try KV first, then in-memory
    if (env?.SESSIONS) {
        const stored = await env.SESSIONS.get(token)
        if (stored) {
            session = JSON.parse(stored)
        }
    } else {
        session = sessions.get(token)
    }

    if (!session) return null

    // Check expiration
    if (Date.now() > session.expiresAt) {
        await destroySession(token, env)
        return null
    }

    // Sliding expiration: refresh the session expiry on each valid access
    // This keeps the session alive while the user is actively using the app
    const newExpiry = Date.now() + SESSION_EXPIRY
    session.expiresAt = newExpiry

    // Update the session in storage
    if (env?.SESSIONS) {
        await env.SESSIONS.put(token, JSON.stringify(session), {
            expirationTtl: SESSION_EXPIRY / 1000
        })
    } else {
        sessions.set(token, session)
    }

    return session
}

/**
 * Destroy a session (logout)
 * @param {string} token - Session token
 * @param {Object} env - Environment with optional KV binding
 */
export async function destroySession(token, env) {
    if (env?.SESSIONS) {
        await env.SESSIONS.delete(token)
    } else {
        sessions.delete(token)
    }
}

/**
 * Extract token from Authorization header
 * @param {Request} request - Incoming request
 * @returns {string|null} Token or null
 */
export function getTokenFromRequest(request) {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) return null

    // Support "Bearer <token>" format
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7)
    }

    return authHeader
}

/**
 * Clean up expired sessions (for in-memory store)
 */
export function cleanupExpiredSessions() {
    const now = Date.now()
    for (const [token, session] of sessions.entries()) {
        if (now > session.expiresAt) {
            sessions.delete(token)
        }
    }
}
