/**
 * RBAC (Role-Based Access Control) configuration
 * Defines which roles can access which routes
 */

// Route permission definitions
// Each route pattern maps to an array of allowed roles
// Use '*' for public routes (no auth required)
const ROUTE_PERMISSIONS = {
    // Public routes (no authentication required)
    '/api/auth/login': ['*'],
    '/api/images': ['*'],  // Product images are public

    // Sales - accessible by cashiers and admins
    '/api/sales': ['admin', 'cashier'],

    // Admin-only routes
    '/api/products': ['admin'],
    '/api/categories': ['admin'],
    '/api/suppliers': ['admin'],
    '/api/expenses': ['admin'],
    '/api/users': ['admin'],
    '/api/settings': ['admin'],
    '/api/reports': ['admin'],
    '/api/purchase-orders': ['admin']
}

/**
 * Check if a route is public (no auth required)
 * @param {string} path - Request path
 * @returns {boolean}
 */
export function isPublicRoute(path) {
    const permissions = getRoutePermissions(path)
    return permissions.includes('*')
}

/**
 * Get permissions for a route
 * @param {string} path - Request path
 * @returns {string[]} Array of allowed roles
 */
export function getRoutePermissions(path) {
    // Check for exact match first
    if (ROUTE_PERMISSIONS[path]) {
        return ROUTE_PERMISSIONS[path]
    }

    // Check for pattern match (remove dynamic segments like IDs)
    for (const [routePattern, roles] of Object.entries(ROUTE_PERMISSIONS)) {
        // Match route prefix (e.g., /api/sales matches /api/sales/123)
        if (path.startsWith(routePattern)) {
            return roles
        }
    }

    // Default: require admin for any undefined routes
    return ['admin']
}

/**
 * Check if a user has permission to access a route
 * @param {Object} session - User session with role
 * @param {string} path - Request path
 * @returns {boolean}
 */
export function hasPermission(session, path) {
    if (!session || !session.role) {
        return false
    }

    const allowedRoles = getRoutePermissions(path)
    return allowedRoles.includes(session.role)
}

/**
 * Create 401 Unauthorized response
 */
export function createUnauthorizedResponse() {
    return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: 'Authentication required. Please log in.'
    }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
    })
}

/**
 * Create 403 Forbidden response
 */
export function createForbiddenResponse() {
    return new Response(JSON.stringify({
        error: 'Forbidden',
        message: 'You do not have permission to access this resource.'
    }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
    })
}
