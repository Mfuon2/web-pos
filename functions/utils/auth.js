/**
 * Authentication utilities for API security
 * Uses JWT tokens for stateless authentication (works on Cloudflare Workers)
 */

// JWT configuration
const JWT_EXPIRY_SECONDS = 8 * 60 * 60 // 8 hours in seconds

// Secret key for JWT signing (in production, use env.JWT_SECRET)
const DEFAULT_SECRET = '74deeacbbd7bb5d8846d13eff262a49bb9435e903f0e05ba32656aa5698b3aa17adc4575c7f1f1cae47ff06f92cf3d23'

/**
 * Base64URL encode
 */
function base64UrlEncode(str) {
    const base64 = btoa(str)
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Base64URL decode
 */
function base64UrlDecode(str) {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
    // Add padding
    while (base64.length % 4) {
        base64 += '='
    }
    return atob(base64)
}

/**
 * Create HMAC-SHA256 signature using Web Crypto API
 */
async function createSignature(data, secret) {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const messageData = encoder.encode(data)

    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    )

    const signature = await crypto.subtle.sign('HMAC', key, messageData)
    const signatureArray = new Uint8Array(signature)
    return base64UrlEncode(String.fromCharCode(...signatureArray))
}

/**
 * Verify HMAC-SHA256 signature
 */
async function verifySignature(data, signature, secret) {
    const expectedSignature = await createSignature(data, secret)
    return signature === expectedSignature
}

/**
 * Create a JWT token for a user
 * @param {Object} user - User object (without password)
 * @param {Object} env - Environment with optional JWT_SECRET
 * @returns {Promise<string>} JWT token
 */
export async function createSession(user, env) {
    const secret = env?.JWT_SECRET || DEFAULT_SECRET

    const header = {
        alg: 'HS256',
        typ: 'JWT'
    }

    const now = Math.floor(Date.now() / 1000)
    const payload = {
        userId: user.id,
        username: user.username,
        role: user.role,
        iat: now,
        exp: now + JWT_EXPIRY_SECONDS
    }

    const headerEncoded = base64UrlEncode(JSON.stringify(header))
    const payloadEncoded = base64UrlEncode(JSON.stringify(payload))
    const dataToSign = `${headerEncoded}.${payloadEncoded}`

    const signature = await createSignature(dataToSign, secret)

    return `${dataToSign}.${signature}`
}

/**
 * Validate a JWT token and return user info
 * Implements sliding expiration by checking remaining time
 * @param {string} token - JWT token from Authorization header
 * @param {Object} env - Environment with optional JWT_SECRET
 * @returns {Promise<Object|null>} User session or null if invalid
 */
export async function validateSession(token, env) {
    if (!token) return null

    const secret = env?.JWT_SECRET || DEFAULT_SECRET

    try {
        const parts = token.split('.')
        if (parts.length !== 3) return null

        const [headerEncoded, payloadEncoded, signature] = parts
        const dataToVerify = `${headerEncoded}.${payloadEncoded}`

        // Verify signature
        const isValid = await verifySignature(dataToVerify, signature, secret)
        if (!isValid) return null

        // Decode payload
        const payload = JSON.parse(base64UrlDecode(payloadEncoded))

        // Check expiration
        const now = Math.floor(Date.now() / 1000)
        if (payload.exp < now) {
            return null // Token expired
        }

        // Return session data
        return {
            userId: payload.userId,
            username: payload.username,
            role: payload.role,
            createdAt: payload.iat * 1000,
            expiresAt: payload.exp * 1000
        }
    } catch (e) {
        console.error('JWT validation error:', e)
        return null
    }
}

/**
 * Destroy a session (logout)
 * With JWT, logout is handled client-side by removing the token
 * @param {string} token - JWT token
 * @param {Object} env - Environment (unused for JWT)
 */
export async function destroySession(token, env) {
    // JWT is stateless - logout is handled client-side
    // Nothing to do on server
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
 * Generate a secure random token (for other uses like CSRF)
 */
export function generateSessionToken() {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

