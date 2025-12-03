import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
    const items = ref([])
    const paymentMethod = ref('cash')

    const total = computed(() => {
        return items.value.reduce((sum, item) => {
            return sum + (item.price * item.quantity)
        }, 0)
    })

    const itemCount = computed(() => {
        return items.value.reduce((sum, item) => sum + item.quantity, 0)
    })

    function addItem(product) {
        const existingItem = items.value.find(item => item.product_id === product.id)

        if (existingItem) {
            existingItem.quantity++
        } else {
            items.value.push({
                product_id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1
            })
        }
    }

    function removeItem(productId) {
        const index = items.value.findIndex(item => item.product_id === productId)
        if (index > -1) {
            items.value.splice(index, 1)
        }
    }

    function updateQuantity(productId, quantity) {
        const item = items.value.find(item => item.product_id === productId)
        if (item) {
            if (quantity <= 0) {
                removeItem(productId)
            } else {
                item.quantity = quantity
            }
        }
    }

    function clearCart() {
        items.value = []
        paymentMethod.value = 'cash'
    }

    async function checkout() {
        if (items.value.length === 0) {
            throw new Error('Cart is empty')
        }

        const saleData = {
            items: items.value,
            total: total.value,
            payment_method: paymentMethod.value
        }

        try {
            const response = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(saleData)
            })

            if (!response.ok) throw new Error('Failed to process sale')

            const result = await response.json()
            clearCart()
            return result
        } catch (error) {
            console.error('Checkout error:', error)
            throw error
        }
    }

    return {
        items,
        paymentMethod,
        total,
        itemCount,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        checkout
    }
})
