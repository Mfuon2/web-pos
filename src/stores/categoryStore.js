import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api'

export const useCategoryStore = defineStore('category', () => {
    const categories = ref([])
    const loading = ref(false)
    const error = ref(null)

    const pagination = ref({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1
    })

    async function fetchCategories(params = {}) {
        loading.value = true
        error.value = null
        try {
            let url = '/api/categories'
            if (params.page) {
                url += `?page=${params.page}&limit=${params.limit || 20}`
            }

            const response = await apiGet(url)
            if (!response.ok) throw new Error('Failed to fetch categories')

            const data = await response.json()

            if (Array.isArray(data)) {
                categories.value = data
            } else {
                categories.value = data.data
                pagination.value = data.meta
            }
        } catch (err) {
            error.value = err.message
            throw err
        } finally {
            loading.value = false
        }
    }

    async function addCategory(categoryData) {
        loading.value = true
        error.value = null
        try {
            const response = await apiPost('/api/categories', categoryData)
            if (!response.ok) throw new Error('Failed to add category')
            await fetchCategories()
        } catch (err) {
            error.value = err.message
            throw err
        } finally {
            loading.value = false
        }
    }

    async function updateCategory(id, categoryData) {
        loading.value = true
        error.value = null
        try {
            const response = await apiPut(`/api/categories/${id}`, categoryData)
            if (!response.ok) throw new Error('Failed to update category')
            await fetchCategories()
        } catch (err) {
            error.value = err.message
            throw err
        } finally {
            loading.value = false
        }
    }

    async function deleteCategory(id) {
        loading.value = true
        error.value = null
        try {
            const response = await apiDelete(`/api/categories/${id}`)
            if (!response.ok) throw new Error('Failed to delete category')
            await fetchCategories()
        } catch (err) {
            error.value = err.message
            throw err
        } finally {
            loading.value = false
        }
    }

    return {
        categories,
        loading,
        error,
        fetchCategories,
        addCategory,
        updateCategory,
        deleteCategory,
        pagination
    }
})
