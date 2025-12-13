/**
 * Middleware for API security
 * Implements: CORS, Rate Limiting, Authentication, and RBAC
 */

import { validateSession, getTokenFromRequest } from './utils/auth.js'
import { getRateLimitType, getClientIdentifier, checkRateLimit, createRateLimitResponse, getRateLimitHeaders } from './utils/rateLimit.js'
import { isPublicRoute, hasPermission, createUnauthorizedResponse, createForbiddenResponse } from './utils/rbac.js'

export async function onRequest(context) {
    const { request, next, env } = context

    // Security Headers
    const securityHeaders = {
        'X-Frame-Options': 'DENY',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';",
        // CORS headers
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    // Helper to attach headers
    const applyHeaders = (response) => {
        Object.entries(securityHeaders).forEach(([key, value]) => {
            response.headers.set(key, value)
        })
        return response
    }

    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
        return applyHeaders(new Response(null))
    }

    const url = new URL(request.url)
    const path = url.pathname

    // API Security Checks (Rate Limit, Auth, RBAC)
    if (path.startsWith('/api/')) {
        try {
            // 1. RATE LIMITING
            let clientId = getClientIdentifier(request)
            const limitType = getRateLimitType(path, request.method)
            const rateLimitResult = checkRateLimit(clientId, limitType)

            if (!rateLimitResult.allowed) {
                const response = createRateLimitResponse(rateLimitResult)
                return applyHeaders(response)
            }

            // 2. AUTHENTICATION
            if (!isPublicRoute(path)) {
                const token = getTokenFromRequest(request)

                if (!token) {
                    return applyHeaders(createUnauthorizedResponse())
                }

                const session = await validateSession(token, env)

                if (!session) {
                    return applyHeaders(createUnauthorizedResponse())
                }

                // 3. RBAC
                if (!hasPermission(session, path)) {
                    return applyHeaders(createForbiddenResponse())
                }

                context.session = session
            }
        } catch (error) {
            return applyHeaders(new Response(JSON.stringify({
                error: 'Internal Server Error',
                message: error.message
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }))
        }
    }

    // Continue to next handler (API or Static Asset)
    const response = await next()
    return applyHeaders(response)
}
