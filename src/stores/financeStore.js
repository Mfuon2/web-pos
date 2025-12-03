import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useFinanceStore = defineStore('finance', () => {
    const expenses = ref([])
    const expensesPagination = ref({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1
    })
    const summary = ref(null)
    const loading = ref(false)
    const error = ref(null)

    async function fetchExpenses(startDate = null, endDate = null) {
        loading.value = true
        error.value = null
        try {
            let url = '/api/expenses'
            if (startDate && endDate) {
                url += `?start_date=${startDate}&end_date=${endDate}`
            }

            const response = await fetch(url)
            if (!response.ok) throw new Error('Failed to fetch expenses')
            expenses.value = await response.json()
        } catch (err) {
            error.value = err.message
            console.error('Error fetching expenses:', err)
        } finally {
            loading.value = false
        }
    }

    async function addExpense(expense) {
        loading.value = true
        error.value = null
        try {
            const response = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(expense)
            })
            if (!response.ok) throw new Error('Failed to add expense')
            await fetchExpenses() // Refresh list
            return await response.json()
        } catch (err) {
            error.value = err.message
            console.error('Error adding expense:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    async function fetchSummary(startDate = null, endDate = null) {
        loading.value = true
        error.value = null
        try {
            let url = '/api/reports/summary'
            if (startDate && endDate) {
                url += `?start_date=${startDate}&end_date=${endDate}`
            }

            const response = await fetch(url)
            if (!response.ok) throw new Error('Failed to fetch summary')
            summary.value = await response.json()
        } catch (err) {
            error.value = err.message
            console.error('Error fetching summary:', err)
        } finally {
            loading.value = false
        }
    }

    async function updateExpense(id, expense) {
        loading.value = true
        error.value = null
        try {
            const response = await fetch(`/api/expenses/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(expense)
            })
            if (!response.ok) throw new Error('Failed to update expense')
            await fetchExpenses() // Refresh list
            return await response.json()
        } catch (err) {
            error.value = err.message
            console.error('Error updating expense:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    async function deleteExpense(id) {
        loading.value = true
        error.value = null
        try {
            const response = await fetch(`/api/expenses/${id}`, {
                method: 'DELETE'
            })
            if (!response.ok) throw new Error('Failed to delete expense')
            await fetchExpenses() // Refresh list
            return await response.json()
        } catch (err) {
            error.value = err.message
            console.error('Error deleting expense:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    const purchaseOrders = ref([])
    const purchaseOrdersPagination = ref({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1
    })

    async function fetchPurchaseOrders(startDate = null, endDate = null, page = 1, limit = 20) {
        loading.value = true
        error.value = null
        try {
            let url = '/api/purchase-orders'
            const params = new URLSearchParams()
            if (startDate && endDate) {
                params.append('start_date', startDate)
                params.append('end_date', endDate)
            }
            params.append('page', page)
            params.append('limit', limit)

            url += '?' + params.toString()

            const response = await fetch(url)
            if (!response.ok) throw new Error('Failed to fetch purchase orders')

            const data = await response.json()

            if (Array.isArray(data)) {
                purchaseOrders.value = data
            } else {
                purchaseOrders.value = data.data
                purchaseOrdersPagination.value = data.meta
            }
        } catch (err) {
            error.value = err.message
            console.error('Error fetching purchase orders:', err)
        } finally {
            loading.value = false
        }
    }

    async function addPurchaseOrder(purchaseOrder) {
        loading.value = true
        error.value = null
        try {
            const response = await fetch('/api/purchase-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(purchaseOrder)
            })
            if (!response.ok) throw new Error('Failed to add purchase order')
            await fetchPurchaseOrders() // Refresh list
            return await response.json()
        } catch (err) {
            error.value = err.message
            console.error('Error adding purchase order:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    async function markPurchaseOrderReceived(id) {
        loading.value = true
        error.value = null
        try {
            const response = await fetch(`/api/purchase-orders/${id}/receive`, {
                method: 'PUT'
            })
            if (!response.ok) throw new Error('Failed to mark purchase order as received')
            await fetchPurchaseOrders() // Refresh list
            return await response.json()
        } catch (err) {
            error.value = err.message
            console.error('Error marking purchase order as received:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    async function deletePurchaseOrder(id) {
        loading.value = true
        error.value = null
        try {
            const response = await fetch(`/api/purchase-orders/${id}`, {
                method: 'DELETE'
            })
            if (!response.ok) throw new Error('Failed to delete purchase order')
            await fetchPurchaseOrders() // Refresh list
            return await response.json()
        } catch (err) {
            error.value = err.message
            console.error('Error deleting purchase order:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    return {
        expenses,
        summary,
        purchaseOrders,
        loading,
        error,
        fetchExpenses,
        addExpense,
        updateExpense,
        deleteExpense,
        fetchSummary,
        fetchPurchaseOrders,
        addPurchaseOrder,
        markPurchaseOrderReceived,
        deletePurchaseOrder,
        expensesPagination,
        purchaseOrdersPagination
    }
})
