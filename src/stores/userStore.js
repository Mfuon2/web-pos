import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
    const users = ref([])
    const loading = ref(false)
    const error = ref(null)

    const pagination = ref({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1
    })

    async function fetchUsers(params = {}) {
        loading.value = true
        error.value = null
        try {
            let url = '/api/users'
            if (params.page) {
                url += `?page=${params.page}&limit=${params.limit || 20}`
            }

            const response = await fetch(url)
            if (!response.ok) throw new Error('Failed to fetch users')

            const data = await response.json()

            if (Array.isArray(data)) {
                users.value = data
            } else {
                users.value = data.data
                pagination.value = data.meta
            }
        } catch (err) {
            error.value = err.message
            console.error('Error fetching users:', err)
        } finally {
            loading.value = false
        }
    }

    async function addUser(userData) {
        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            })
            if (!response.ok) {
                const err = await response.json()
                throw new Error(err.error || 'Failed to add user')
            }
            await fetchUsers()
        } catch (err) {
            throw err
        }
    }

    async function updateUser(id, updates) {
        try {
            const response = await fetch(`/api/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            })
            if (!response.ok) throw new Error('Failed to update user')
            await fetchUsers()
        } catch (err) {
            throw err
        }
    }

    async function deleteUser(id) {
        try {
            const response = await fetch(`/api/users/${id}`, {
                method: 'DELETE'
            })
            if (!response.ok) throw new Error('Failed to delete user')
            await fetchUsers()
        } catch (err) {
            throw err
        }
    }

    return {
        users,
        loading,
        error,
        fetchUsers,
        addUser,
        updateUser,
        updateUser,
        deleteUser,
        pagination
    }
})
