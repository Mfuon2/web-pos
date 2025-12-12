import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiFetch, apiGet, apiPost, apiPut, apiDelete } from '../utils/api'

export const useProductStore = defineStore('product', () => {
    const products = ref([])
    const loading = ref(false)
    const error = ref(null)

    const pagination = ref({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1
    })

    async function fetchProducts(params = {}) {
        loading.value = true
        error.value = null
        try {
            let url = '/api/products'
            const queryParams = new URLSearchParams()

            if (params.page) {
                queryParams.append('page', params.page)
                queryParams.append('limit', params.limit || 20)
            }

            if (params.low_stock) {
                queryParams.append('low_stock', 'true')
            }

            const queryString = queryParams.toString()
            if (queryString) {
                url += `?${queryString}`
            }

            const response = await apiGet(url)
            if (!response.ok) throw new Error('Failed to fetch products')

            const data = await response.json()

            if (Array.isArray(data)) {
                products.value = data
            } else {
                products.value = data.data
                pagination.value = data.meta
            }
        } catch (err) {
            error.value = err.message
            console.error('Error fetching products:', err)
        } finally {
            loading.value = false
        }
    }

    async function getAllProducts() {
        try {
            const response = await apiGet('/api/products')
            if (!response.ok) throw new Error('Failed to fetch all products')
            return await response.json()
        } catch (err) {
            console.error('Error fetching all products:', err)
            throw err
        }
    }

    async function addProduct(product) {
        loading.value = true
        error.value = null
        try {
            const response = await apiPost('/api/products', product)
            if (!response.ok) throw new Error('Failed to add product')
            await fetchProducts() // Refresh list
            return await response.json()
        } catch (err) {
            error.value = err.message
            console.error('Error adding product:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    async function updateProduct(id, updates) {
        loading.value = true
        error.value = null
        try {
            const response = await apiPut(`/api/products/${id}`, updates)
            if (!response.ok) throw new Error('Failed to update product')
            await fetchProducts()
        } catch (err) {
            error.value = err.message
            throw err
        } finally {
            loading.value = false
        }
    }

    async function deleteProduct(id) {
        loading.value = true
        error.value = null
        try {
            const response = await apiDelete(`/api/products/${id}`)
            if (!response.ok) throw new Error('Failed to delete product')
            await fetchProducts()
        } catch (err) {
            error.value = err.message
            throw err
        } finally {
            loading.value = false
        }
    }

    function getProductById(id) {
        return products.value.find(p => p.id === id)
    }

    function getProductByBarcode(barcode) {
        return products.value.find(p => p.barcode === barcode)
    }

    async function bulkAddProducts(productsData) {
        loading.value = true
        error.value = null
        try {
            const response = await apiPost('/api/products/bulk', { products: productsData })
            if (!response.ok) {
                const errData = await response.json()
                throw new Error(errData.error || 'Failed to import products')
            }
            await fetchProducts() // Refresh the list
            return await response.json()
        } catch (err) {
            error.value = err.message
            throw err
        } finally {
            loading.value = false
        }
    }

    return {
        products,
        loading,
        error,
        fetchProducts,
        getAllProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductById,
        getProductByBarcode,
        bulkAddProducts,
        pagination
    }
})
