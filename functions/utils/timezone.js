/**
 * Timezone utility for backend (Cloudflare Workers)
 * Uses Africa/Nairobi timezone (UTC+3)
 */

/**
 * Get current timestamp in ISO format for Nairobi timezone
 * For SQLite DATETIME DEFAULT CURRENT_TIMESTAMP compatibility
 * @returns {string} ISO 8601 timestamp string
 */
export function getNairobiTimestamp() {
    const now = new Date()
    // Get current UTC time
    const utcTime = now.getTime()
    // Add 3 hours for EAT (UTC+3)
    const eatTime = new Date(utcTime + (3 * 60 * 60 * 1000))
    // Return ISO string format (SQLite compatible)
    return eatTime.toISOString().replace('T', ' ').substring(0, 19)
}

/**
 * Convert UTC timestamp to Nairobi time
 * @param {string} utcTimestamp - UTC timestamp
 * @returns {string} Nairobi timestamp
 */
export function toNairobiTime(utcTimestamp) {
    const date = new Date(utcTimestamp)
    const utcTime = date.getTime()
    const eatTime = new Date(utcTime + (3 * 60 * 60 * 1000))
    return eatTime.toISOString().replace('T', ' ').substring(0, 19)
}
