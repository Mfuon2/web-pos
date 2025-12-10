/**
 * Rate limiting utility for API protection
 * Uses in-memory storage with sliding window algorithm
 */

// In-memory rate limit tracker
const rateLimitStore = new Map()

// Rate limit configurations
const RATE_LIMITS = {
    login: { maxRequests: 5, windowMs: 60 * 1000 },      // 5 requests per minute
    read: { maxRequests: 100, windowMs: 60 * 1000 },     // 100 requests per minute
    write: { maxRequests: 30, windowMs: 60 * 1000 },     // 30 requests per minute
    images: { maxRequests: 200, windowMs: 60 * 1000 }    // 200 image requests per minute (higher for POS display)
}

/**
 * Get rate limit type based on endpoint and method
 * @param {string} path - Request path
 * @param {string} method - HTTP method
 * @returns {string} Rate limit type (login|read|write)
 */
export function getRateLimitType(path, method) {
    if (path.includes('/auth/login')) {
        return 'login'
    }
    if (path.includes('/api/images')) {
        return 'images'
    }
    if (method === 'GET') {
        return 'read'
    }
    return 'write'
}

/**
 * Get client identifier (IP address or user ID)
 * @param {Request} request - Incoming request
 * @param {Object} session - User session (optional)
 * @returns {string} Client identifier
 */
export function getClientIdentifier(request, session = null) {
    // Use user ID if authenticated
    if (session?.userId) {
        return `user:${session.userId}`
    }

    // Otherwise use IP address
    const cfIP = request.headers.get('CF-Connecting-IP')
    const forwardedFor = request.headers.get('X-Forwarded-For')
    const ip = cfIP || (forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown')

    return `ip:${ip}`
}

/**
 * Check rate limit for a client
 * @param {string} clientId - Client identifier
 * @param {string} limitType - Rate limit type (login|read|write)
 * @returns {Object} { allowed: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(clientId, limitType) {
    const config = RATE_LIMITS[limitType] || RATE_LIMITS.read
    const now = Date.now()
    const key = `${clientId}:${limitType}`

    // Get or initialize tracking data
    let tracking = rateLimitStore.get(key)

    if (!tracking || now > tracking.windowStart + config.windowMs) {
        // Start new window
        tracking = {
            windowStart: now,
            count: 0
        }
    }

    // Increment counter
    tracking.count++
    rateLimitStore.set(key, tracking)

    const remaining = Math.max(0, config.maxRequests - tracking.count)
    const resetTime = Math.ceil((tracking.windowStart + config.windowMs - now) / 1000)

    return {
        allowed: tracking.count <= config.maxRequests,
        remaining,
        resetTime,
        limit: config.maxRequests
    }
}

/**
 * Create rate limit response headers
 * @param {Object} rateLimitResult - Result from checkRateLimit
 * @returns {Object} Headers object
 */
export function getRateLimitHeaders(rateLimitResult) {
    return {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
    }
}

/**
 * Create 429 Too Many Requests response
 * @param {Object} rateLimitResult - Result from checkRateLimit
 * @returns {Response} 429 response
 */
export function createRateLimitResponse(rateLimitResult) {
    return new Response(JSON.stringify({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${rateLimitResult.resetTime} seconds.`,
        retryAfter: rateLimitResult.resetTime
    }), {
        status: 429,
        headers: {
            'Content-Type': 'application/json',
            'Retry-After': rateLimitResult.resetTime.toString(),
            ...getRateLimitHeaders(rateLimitResult)
        }
    })
}

/**
 * Cleanup old entries from rate limit store (call periodically)
 */
export function cleanupRateLimitStore() {
    const now = Date.now()
    const maxWindow = Math.max(...Object.values(RATE_LIMITS).map(c => c.windowMs))

    for (const [key, tracking] of rateLimitStore.entries()) {
        if (now > tracking.windowStart + maxWindow) {
            rateLimitStore.delete(key)
        }
    }
}
