import * as React from "react"
import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner"
import { CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react"

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors={false}
      theme="dark"
      closeButton
      toastOptions={{
        className:
          "!bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.02)_100%),#15151E] !border !border-white/[0.08] !text-white !backdrop-blur-xl !shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_0_1px_rgba(124,58,237,0.15)] !rounded-[14px]",
        style: {
          background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%), #15151E",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "white",
        },
      }}
    />
  )
}

type ToastType = "success" | "error" | "info" | "warning"

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  error: <XCircle className="h-4 w-4 text-red-400" />,
  info: <Info className="h-4 w-4 text-[#06B6D4]" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-400" />,
}

function show(type: ToastType, message: string, description?: string) {
  const method = (sonnerToast as any)[type] || sonnerToast
  method(message, {
    description,
    icon: icons[type],
    duration: 3500,
  })
}

export const toast = {
  success: (msg: string, desc?: string) => show("success", msg, desc),
  error: (msg: string, desc?: string) => show("error", msg, desc),
  info: (msg: string, desc?: string) => show("info", msg, desc),
  warning: (msg: string, desc?: string) => show("warning", msg, desc),
  message: (msg: string, desc?: string) => sonnerToast(msg, { description: desc }),
  promise: sonnerToast.promise,
  dismiss: sonnerToast.dismiss,
  custom: sonnerToast.custom,
}
