import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiFetch } from '../utils/api'

export const useBorrowedStore = defineStore('borrowed', () => {
    const borrowedItems = ref([])
    const loading = ref(false)
    const error = ref(null)

    async function fetchBorrowedItems() {
        loading.value = true
        try {
            const response = await apiFetch('/api/borrowed-items')
            if (response.ok) {
                borrowedItems.value = await response.json()
            } else {
                throw new Error('Failed to fetch borrowed items')
            }
        } catch (e) {
            error.value = e.message
        } finally {
            loading.value = false
        }
    }

    async function addBorrowedItem(item) {
        loading.value = true
        try {
            const response = await apiFetch('/api/borrowed-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            })

            if (!response.ok) {
                const err = await response.json()
                throw new Error(err.error || 'Failed to add borrowed item')
            }

            // Refresh list
            await fetchBorrowedItems()
            return true
        } catch (e) {
            error.value = e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    async function updateBorrowedItem(id, data) {
        loading.value = true
        try {
            const response = await apiFetch('/api/borrowed-items', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...data })
            })

            if (!response.ok) {
                const err = await response.json()
                throw new Error(err.error || 'Failed to update borrowed item')
            }

            // Refresh list
            await fetchBorrowedItems()
            return true
        } catch (e) {
            error.value = e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    return {
        borrowedItems,
        loading,
        error,
        fetchBorrowedItems,
        addBorrowedItem,
        updateBorrowedItem
    }
})
