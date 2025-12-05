import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api'

export const useSupplierStore = defineStore('supplier', () => {
    const suppliers = ref([])
    const loading = ref(false)
    const error = ref(null)

    const pagination = ref({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1
    })

    async function fetchSuppliers(params = {}) {
        loading.value = true
        error.value = null
        try {
            let url = '/api/suppliers'
            if (params.page) {
                url += `?page=${params.page}&limit=${params.limit || 20}`
            }

            const response = await apiGet(url)
            if (!response.ok) throw new Error('Failed to fetch suppliers')

            const data = await response.json()

            if (Array.isArray(data)) {
                suppliers.value = data
            } else {
                suppliers.value = data.data
                pagination.value = data.meta
            }
        } catch (err) {
            error.value = err.message
            throw err
        } finally {
            loading.value = false
        }
    }

    async function addSupplier(supplierData) {
        loading.value = true
        error.value = null
        try {
            const response = await apiPost('/api/suppliers', supplierData)
            if (!response.ok) throw new Error('Failed to add supplier')
            await fetchSuppliers()
        } catch (err) {
            error.value = err.message
            throw err
        } finally {
            loading.value = false
        }
    }

    async function updateSupplier(id, supplierData) {
        loading.value = true
        error.value = null
        try {
            const response = await apiPut(`/api/suppliers/${id}`, supplierData)
            if (!response.ok) throw new Error('Failed to update supplier')
            await fetchSuppliers()
        } catch (err) {
            error.value = err.message
            throw err
        } finally {
            loading.value = false
        }
    }

    async function deleteSupplier(id) {
        loading.value = true
        error.value = null
        try {
            const response = await apiDelete(`/api/suppliers/${id}`)
            if (!response.ok) throw new Error('Failed to delete supplier')
            await fetchSuppliers()
        } catch (err) {
            error.value = err.message
            throw err
        } finally {
            loading.value = false
        }
    }

    return {
        suppliers,
        loading,
        error,
        fetchSuppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        pagination
    }
})
