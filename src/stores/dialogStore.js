import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDialogStore = defineStore('dialog', () => {
    const isOpen = ref(false)
    const type = ref('info') // info, success, error, confirm
    const title = ref('')
    const message = ref('')
    const confirmText = ref('OK')

    let resolvePromise = null

    function show(options) {
        type.value = options.type || 'info'
        title.value = options.title || 'Notification'
        message.value = options.message || ''
        confirmText.value = options.confirmText || 'OK'
        isOpen.value = true

        return new Promise((resolve) => {
            resolvePromise = resolve
        })
    }

    function alert(msg, options = {}) {
        return show({
            type: 'info',
            title: 'Alert',
            message: msg,
            ...options
        })
    }

    function success(msg, options = {}) {
        return show({
            type: 'success',
            title: 'Success',
            message: msg,
            ...options
        })
    }

    function error(msg, options = {}) {
        return show({
            type: 'error',
            title: 'Error',
            message: msg,
            ...options
        })
    }

    function confirm(msg, options = {}) {
        return show({
            type: 'confirm',
            title: 'Confirm',
            message: msg,
            confirmText: 'Confirm',
            ...options
        })
    }

    function handleConfirm() {
        isOpen.value = false
        if (resolvePromise) resolvePromise(true)
    }

    function handleCancel() {
        isOpen.value = false
        if (resolvePromise) resolvePromise(false)
    }

    return {
        isOpen,
        type,
        title,
        message,
        confirmText,
        show,
        alert,
        success,
        error,
        confirm,
        handleConfirm, // Internal use
        cancel: handleCancel    // Internal use
    }
})
