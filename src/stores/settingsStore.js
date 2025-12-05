import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiGet, apiPut } from '../utils/api'

export const useSettingsStore = defineStore('settings', () => {
    const settings = ref(null)
    const loading = ref(false)
    const error = ref(null)

    const hasSettings = computed(() => !!settings.value?.setupComplete)

    const businessName = computed(() => settings.value?.businessName || 'POS System')
    const primaryColor = computed(() => settings.value?.primaryColor || '#667eea')
    const secondaryColor = computed(() => settings.value?.secondaryColor || '#764ba2')
    const currencySymbol = computed(() => settings.value?.currencySymbol || '$')
    const currentSettings = computed(() => settings.value)

    async function fetchSettings() {
        loading.value = true
        error.value = null

        try {
            const response = await apiGet('/api/settings')
            if (!response.ok) throw new Error('Failed to fetch settings')

            const data = await response.json()
            settings.value = data

            // Apply colors to CSS variables if settings exist and setup is complete
            if (data && data.setupComplete) {
                localStorage.setItem('settings', JSON.stringify(data))
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
            const response = await apiPut('/api/settings', settingsData)

            if (!response.ok) throw new Error('Failed to update settings')

            const data = await response.json()
            settings.value = data

            // Apply new colors
            localStorage.setItem('settings', JSON.stringify(data))
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
        root.style.setProperty('--primary-color', settings.value.primaryColor)
        root.style.setProperty('--secondary-color', settings.value.secondaryColor)

        // Update gradient
        const gradient = `linear-gradient(135deg, ${settings.value.primaryColor} 0%, ${settings.value.secondaryColor} 100%)`
        root.style.setProperty('--primary-gradient', gradient)
    }

    function initSettings() {
        const cached = localStorage.getItem('settings')
        if (cached) {
            try {
                settings.value = JSON.parse(cached)
                applyColors()
            } catch (e) {
                console.error('Failed to parse cached settings', e)
                localStorage.removeItem('settings')
            }
        }
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
        currentSettings,
        fetchSettings,
        updateSettings,
        applyColors,
        initSettings
    }
})
