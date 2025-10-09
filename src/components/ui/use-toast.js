import { useState, useCallback } from "react"

let listeners = []

const emitToast = (toast) => {
  listeners.forEach((listener) => listener(toast))
}

export const useToast = () => {
  const [toasts, setToasts] = useState([])

  const toast = useCallback(
    ({ title, description, variant = "default" }) => {
      const id = Date.now().toString()
      const newToast = {
        id,
        title,
        description,
        variant,
      }
      
      emitToast(newToast)
      
      // Auto remove after 5 seconds
      setTimeout(() => {
        emitToast({ id, action: 'remove' })
      }, 5000)
    },
    []
  )

  return {
    toast,
    toasts,
    dismiss: (toastId) => emitToast({ id: toastId, action: 'remove' }),
  }
}
