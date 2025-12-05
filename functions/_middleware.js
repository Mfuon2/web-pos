/**
 * Middleware for API security
 * Implements: CORS, Rate Limiting, Authentication, and RBAC
 */

import { validateSession, getTokenFromRequest } from './utils/auth.js'
import { getRateLimitType, getClientIdentifier, checkRateLimit, createRateLimitResponse, getRateLimitHeaders } from './utils/rateLimit.js'
import { isPublicRoute, hasPermission, createUnauthorizedResponse, createForbiddenResponse } from './utils/rbac.js'

export async function onRequest(context) {
    const { request, next, env } = context

    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: corsHeaders
        })
    }

    const url = new URL(request.url)
    const path = url.pathname

    // Skip security for non-API routes (static files, etc.)
    if (!path.startsWith('/api/')) {
        return await next()
    }

    try {
        // 1. RATE LIMITING
        // Get client identifier (will be enhanced with user ID after auth)
        let clientId = getClientIdentifier(request)
        const limitType = getRateLimitType(path, request.method)
        const rateLimitResult = checkRateLimit(clientId, limitType)

        if (!rateLimitResult.allowed) {
            const response = createRateLimitResponse(rateLimitResult)
            // Add CORS headers
            Object.entries(corsHeaders).forEach(([key, value]) => {
                response.headers.set(key, value)
            })
            return response
        }

        // 2. AUTHENTICATION
        // Check if route requires authentication
        if (!isPublicRoute(path)) {
            const token = getTokenFromRequest(request)

            if (!token) {
                const response = createUnauthorizedResponse()
                Object.entries(corsHeaders).forEach(([key, value]) => {
                    response.headers.set(key, value)
                })
                return response
            }

            const session = await validateSession(token, env)

            if (!session) {
                const response = createUnauthorizedResponse()
                Object.entries(corsHeaders).forEach(([key, value]) => {
                    response.headers.set(key, value)
                })
                return response
            }

            // 3. RBAC - Role-Based Access Control
            if (!hasPermission(session, path)) {
                const response = createForbiddenResponse()
                Object.entries(corsHeaders).forEach(([key, value]) => {
                    response.headers.set(key, value)
                })
                return response
            }

            // Attach session to context for use in handlers
            context.session = session
        }

        // Continue to the next handler
        const response = await next()

        // Add CORS and rate limit headers to response
        Object.entries(corsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value)
        })
        Object.entries(getRateLimitHeaders(rateLimitResult)).forEach(([key, value]) => {
            response.headers.set(key, value)
        })

        return response
    } catch (error) {
        // Global error handling
        return new Response(JSON.stringify({
            error: 'Internal Server Error',
            message: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        })
    }
}
