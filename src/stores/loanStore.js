import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiFetch } from '../utils/api'

export const useLoanStore = defineStore('loan', () => {
    const loans = ref([])
    const loading = ref(false)
    const error = ref(null)

    async function fetchLoans() {
        loading.value = true
        try {
            const response = await apiFetch('/api/loans')
            if (response.ok) {
                loans.value = await response.json()
            } else {
                throw new Error('Failed to fetch loans')
            }
        } catch (e) {
            error.value = e.message
        } finally {
            loading.value = false
        }
    }

    async function createLoan(loanData) {
        loading.value = true
        try {
            const response = await apiFetch('/api/loans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loanData)
            })

            if (!response.ok) {
                const err = await response.json()
                throw new Error(err.error || 'Failed to create loan')
            }

            await fetchLoans()
            return true
        } catch (e) {
            error.value = e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    async function updateLoan(id, data) {
        loading.value = true
        try {
            const response = await apiFetch('/api/loans', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...data })
            })

            if (!response.ok) {
                const err = await response.json()
                throw new Error(err.error || 'Failed to update loan')
            }

            await fetchLoans()
            return true
        } catch (e) {
            error.value = e.message
            throw e
        } finally {
            loading.value = false
        }
    }

    return {
        loans,
        loading,
        error,
        fetchLoans,
        createLoan,
        updateLoan
    }
})
