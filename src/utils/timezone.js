/**
 * Timezone utility for East African Time (EAT)
 * Uses Africa/Nairobi timezone (UTC+3)
 */

/**
 * Get current date and time in East African Time
 * @returns {Date} Date object in EAT
 */
export function getNairobiTime() {
    const now = new Date()
    // Convert to Nairobi time (UTC+3)
    const nairobiTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }))
    return nairobiTime
}

/**
 * Get ISO string for current time in EAT
 * @returns {string} ISO 8601 format timestamp
 */
export function getNairobiISOString() {
    const nairobiTime = getNairobiTime()
    return nairobiTime.toISOString()
}

/**
 * Format a date string to Nairobi timezone
 * @param {string} dateString - ISO date string
 * @returns {Date} Date in Nairobi timezone
 */
export function toNairobiTime(dateString) {
    const date = new Date(dateString)
    return new Date(date.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }))
}

/**
 * Format date and time for display in EAT
 * @param {string} dateString - ISO date string
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date/time string
 */
export function formatNairobiDateTime(dateString, options = {}) {
    const date = new Date(dateString)
    const defaultOptions = {
        timeZone: 'Africa/Nairobi',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        ...options
    }
    return date.toLocaleString('en-US', defaultOptions)
}

/**
 * Format date only in EAT
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
export function formatNairobiDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
        timeZone: 'Africa/Nairobi',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

/**
 * Format time only in EAT
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted time string
 */
export function formatNairobiTime(dateString) {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
        timeZone: 'Africa/Nairobi',
        hour: '2-digit',
        minute: '2-digit'
    })
}

/**
 * Get start of day in Nairobi timezone
 * @param {Date} date - Optional date, defaults to today
 * @returns {Date} Start of day in Nairobi time
 */
export function getNairobiStartOfDay(date = new Date()) {
    const nairobiDateStr = date.toLocaleDateString('en-US', { timeZone: 'Africa/Nairobi' })
    const startOfDay = new Date(nairobiDateStr + ' 00:00:00 GMT+0300')
    return startOfDay
}

/**
 * Get end of day in Nairobi timezone
 * @param {Date} date - Optional date, defaults to today
 * @returns {Date} End of day in Nairobi time
 */
export function getNairobiEndOfDay(date = new Date()) {
    const nairobiDateStr = date.toLocaleDateString('en-US', { timeZone: 'Africa/Nairobi' })
    const endOfDay = new Date(nairobiDateStr + ' 23:59:59 GMT+0300')
    return endOfDay
}
