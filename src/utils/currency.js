/**
 * Format number with thousand separators (no currency symbol)
 * @param {number} value - The numeric value to format
 * @returns {string} Formatted string with thousand separators
 */
export function formatCurrency(value) {
    if (value === null || value === undefined || isNaN(value)) {
        return '0';
    }

    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

/**
 * Format number without decimals
 * @param {number} value - The numeric value to format
 * @returns {string} Formatted string with thousand separators, no decimals
 */
export function formatNumber(value) {
    if (value === null || value === undefined || isNaN(value)) {
        return '0';
    }

    return new Intl.NumberFormat('en-US').format(value);
}
