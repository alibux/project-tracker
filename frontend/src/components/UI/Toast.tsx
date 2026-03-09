import * as React from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

export const ToastProvider = ToastPrimitive.Provider
export const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn('fixed bottom-4 right-4 z-[100] flex max-h-screen w-full max-w-sm flex-col gap-2', className)}
    {...props}
  />
))
ToastViewport.displayName = 'ToastViewport'

export const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & { variant?: 'default' | 'error' }
>(({ className, variant = 'default', ...props }, ref) => (
  <ToastPrimitive.Root
    ref={ref}
    className={cn(
      'flex items-center justify-between rounded-lg px-4 py-3 shadow-lg text-sm',
      variant === 'default' ? 'bg-slate-900 text-white' : 'bg-red-600 text-white',
      className,
    )}
    {...props}
  />
))
Toast.displayName = 'Toast'

export const ToastTitle = ToastPrimitive.Title
export const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close ref={ref} className={cn('ml-4 opacity-70 hover:opacity-100', className)} {...props}>
    <X className="h-4 w-4" />
  </ToastPrimitive.Close>
))
ToastClose.displayName = 'ToastClose'

// Simple hook for imperative toast usage
type ToastOptions = { title: string; variant?: 'default' | 'error' }
type ToastFn = (opts: ToastOptions) => void

const ToastContext = React.createContext<ToastFn>(() => {})

export function useToast() {
  return React.useContext(ToastContext)
}

export function ToastContainer({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<(ToastOptions & { id: number })[]>([])
  const idRef = React.useRef(0)

  const showToast: ToastFn = React.useCallback((opts) => {
    const id = ++idRef.current
    setToasts((prev) => [...prev, { ...opts, id }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      <ToastProvider>
        {children}
        {toasts.map((t) => (
          <Toast key={t.id} variant={t.variant}>
            <ToastTitle>{t.title}</ToastTitle>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  )
}
