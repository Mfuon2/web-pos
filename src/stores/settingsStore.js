import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
    const settings = ref(null)
    const loading = ref(false)
    const error = ref(null)

    const hasSettings = computed(() => settings.value !== null)

    const businessName = computed(() => settings.value?.business_name || 'POS System')
    const primaryColor = computed(() => settings.value?.primary_color || '#667eea')
    const secondaryColor = computed(() => settings.value?.secondary_color || '#764ba2')
    const currencySymbol = computed(() => settings.value?.currency_symbol || '$')

    async function fetchSettings() {
        loading.value = true
        error.value = null

        try {
            const response = await fetch('/api/settings')
            if (!response.ok) throw new Error('Failed to fetch settings')

            const data = await response.json()
            settings.value = data

            // Apply colors to CSS variables if settings exist
            if (data) {
                applyColors()
            }
        } catch (err) {
            error.value = err.message
            console.error('Error fetching settings:', err)
        } finally {
            loading.value = false
        }
    }

    async function updateSettings(settingsData) {
        loading.value = true
        error.value = null

        try {
            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settingsData)
            })

            if (!response.ok) throw new Error('Failed to update settings')

            const data = await response.json()
            settings.value = data

            // Apply new colors
            applyColors()

            return data
        } catch (err) {
            error.value = err.message
            console.error('Error updating settings:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    function applyColors() {
        if (!settings.value) return

        const root = document.documentElement
        root.style.setProperty('--primary-color', settings.value.primary_color)
        root.style.setProperty('--secondary-color', settings.value.secondary_color)

        // Update gradient
        const gradient = `linear-gradient(135deg, ${settings.value.primary_color} 0%, ${settings.value.secondary_color} 100%)`
        root.style.setProperty('--primary-gradient', gradient)
    }

    return {
        settings,
        loading,
        error,
        hasSettings,
        businessName,
        primaryColor,
        secondaryColor,
        currencySymbol,
        fetchSettings,
        updateSettings,
        applyColors
    }
})
