/**
 * RBAC (Role-Based Access Control) configuration
 * Defines which roles can access which routes
 */

// Route permission definitions
// Each route pattern maps to an array of allowed roles
// Use '*' for public routes (no auth required)
const ROUTE_PERMISSIONS = {
  // Public routes (no authentication required)
  "/api/auth/login": ["*"],
  "/api/migrate-borrowed-items-v2": ["*"],
  "/api/images": ["*"], // Product images are public

  // Sales - accessible by cashiers and admins
  "/api/sales": ["admin", "cashier"],

  // Admin-only routes with read access for cashiers
  "/api/products": {
    GET: ["admin", "cashier"],
    POST: ["admin"],
    PUT: ["admin"],
    DELETE: ["admin"],
  },
  "/api/settings": {
    GET: ["admin", "cashier"],
    PUT: ["admin"],
  },
  "/api/borrowed-items": ["admin", "cashier"],
  "/api/loans": ["admin", "cashier"],
  "/api/categories": ["admin", "cashier"],

  // Admin-only routes
  "/api/suppliers": ["admin"],
  "/api/expenses": ["admin"],
  "/api/users": ["admin"],
  "/api/reports": ["admin"],
  "/api/purchase-orders": ["admin"],
  "/api/stock-counts": ["admin"],
};

/**
 * Check if a route is public (no auth required)
 * @param {string} path - Request path
 * @param {string} method - Request method
 * @returns {boolean}
 */
export function isPublicRoute(path, method = "GET") {
  const permissions = getRoutePermissions(path, method);
  return permissions.includes("*");
}

/**
 * Get permissions for a route
 * @param {string} path - Request path
 * @param {string} method - Request method
 * @returns {string[]} Array of allowed roles
 */
export function getRoutePermissions(path, method = "GET") {
  let permissions = null;

  // Check for exact match first
  if (ROUTE_PERMISSIONS[path]) {
    permissions = ROUTE_PERMISSIONS[path];
  } else {
    // Check for pattern match (remove dynamic segments like IDs)
    for (const [routePattern, roles] of Object.entries(ROUTE_PERMISSIONS)) {
      // Match route prefix (e.g., /api/sales matches /api/sales/123)
      if (path.startsWith(routePattern)) {
        permissions = roles;
        break;
      }
    }
  }

  // Default: require admin for any undefined routes
  if (!permissions) {
    return ["admin"];
  }

  // Handle method-specific permissions
  if (!Array.isArray(permissions) && typeof permissions === "object") {
    return permissions[method] || ["admin"];
  }

  return permissions;
}

/**
 * Check if a user has permission to access a route
 * @param {Object} session - User session with role
 * @param {string} path - Request path
 * @param {string} method - Request method
 * @returns {boolean}
 */
export function hasPermission(session, path, method) {
  if (!session || !session.role) {
    return false;
  }

  const allowedRoles = getRoutePermissions(path, method);
  return allowedRoles.includes(session.role) || allowedRoles.includes("*");
}

/**
 * Create 401 Unauthorized response
 */
export function createUnauthorizedResponse() {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      message: "Authentication required. Please log in.",
    }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" },
    },
  );
}

/**
 * Create 403 Forbidden response
 */
export function createForbiddenResponse() {
  return new Response(
    JSON.stringify({
      error: "Forbidden",
      message: "You do not have permission to access this resource.",
    }),
    {
      status: 403,
      headers: { "Content-Type": "application/json" },
    },
  );
}
