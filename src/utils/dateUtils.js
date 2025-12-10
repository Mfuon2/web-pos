/**
 * Timezone-aware date formatting utilities
 */

/**
 * Format a date string with timezone support
 * @param {string} dateString - ISO date string or SQL datetime
 * @param {string} timezone - IANA timezone (e.g., 'Africa/Nairobi')
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDateWithTimezone(dateString, timezone = 'Africa/Nairobi', options = {}) {
    if (!dateString) return 'N/A'

    try {
        // Replace SQL datetime format space with T for proper parsing
        if (typeof dateString === 'string') {
            dateString = dateString.replace(' ', 'T')
        }
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return 'Invalid Date'

        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: timezone
        }

        return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(date)
    } catch (error) {
        console.error('Date formatting error:', error)
        return 'Invalid Date'
    }
}

/**
 * Format date only (no time)
 */
export function formatDate(dateString, timezone = 'Africa/Nairobi') {
    return formatDateWithTimezone(dateString, timezone, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: undefined,
        minute: undefined
    })
}

/**
 * Format time only
 */
export function formatTime(dateString, timezone = 'Africa/Nairobi') {
    return formatDateWithTimezone(dateString, timezone, {
        year: undefined,
        month: undefined,
        day: undefined,
        hour: '2-digit',
        minute: '2-digit'
    })
}

/**
 * Get current date/time in the business timezone
 */
export function getCurrentDateTime(timezone = 'Africa/Nairobi') {
    return formatDateWithTimezone(new Date().toISOString(), timezone)
}

/**
 * Common timezone options for Africa
 */
export const TIMEZONES = [
    { value: 'Africa/Nairobi', label: 'Africa/Nairobi (EAT - UTC+3)' },
    { value: 'Africa/Lagos', label: 'Africa/Lagos (WAT - UTC+1)' },
    { value: 'Africa/Cairo', label: 'Africa/Cairo (EET - UTC+2)' },
    { value: 'Africa/Johannesburg', label: 'Africa/Johannesburg (SAST - UTC+2)' },
    { value: 'Africa/Accra', label: 'Africa/Accra (GMT - UTC+0)' },
    { value: 'Africa/Casablanca', label: 'Africa/Casablanca (WET - UTC+0/+1)' },
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' }
]
