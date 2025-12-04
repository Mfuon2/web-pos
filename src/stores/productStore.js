import { defineStore } from 'pinia'
import { ref } from 'vue'

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
            if (params.page) {
                url += `?page=${params.page}&limit=${params.limit || 20}`
            }

            const response = await fetch(url)
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
            const response = await fetch('/api/products')
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
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product)
            })
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
            const response = await fetch(`/api/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            })
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
            const response = await fetch(`/api/products/${id}`, {
                method: 'DELETE'
            })
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
        getProductById,
        getProductByBarcode,
        pagination
    }
})
