import { createContext, useContext, useState, useCallback } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback(({ tipo = 'exito', mensaje }) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, tipo, mensaje }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <AppContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </AppContext.Provider>
  )
}

function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  )
}

function Toast({ toast, onRemove }) {
  const colorMap = {
    exito:   'bg-green-600',
    error:   'bg-red-600',
    alerta:  'bg-yellow-600',
    info:    'bg-blue-600',
  }
  return (
    <div
      className={`toast-enter ${colorMap[toast.tipo] || 'bg-gray-800'} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[280px] max-w-sm`}
    >
      <span className="flex-1 text-sm font-medium">{toast.mensaje}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-white/80 hover:text-white text-lg leading-none"
      >
        ×
      </button>
    </div>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de AppProvider')
  return ctx
}
