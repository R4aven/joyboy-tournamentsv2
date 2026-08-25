import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl" | "full"
  hideClose?: boolean
  className?: string
}

const sizeMap = {
  sm: "max-w-[420px]",
  md: "max-w-[560px]",
  lg: "max-w-[720px]",
  xl: "max-w-[960px]",
  full: "max-w-[95vw] h-[90vh]",
}

export function Modal({ open, onClose, title, description, children, size = "md", hideClose = false, className }: ModalProps) {
  const [visible, setVisible] = React.useState(open)

  React.useEffect(() => {
    if (open) setVisible(true)
  }, [open])

  React.useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open && !visible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className={cn(
          "absolute inset-0 backdrop-blur-[14px] bg-[#08080B]/80 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          "relative w-full rounded-[24px] border border-white/[0.08] bg-[radial-gradient(120%_120%_at_50%_0%,rgba(124,58,237,0.15)_0%,transparent_60%),linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.015)_100%),#15151E]",
          "shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_20px_80px_-20px_rgba(0,0,0,0.8),0_0_40px_rgba(124,58,237,0.18)]",
          "transition-all duration-300 ease-out",
          open ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-[0.98]",
          sizeMap[size],
          className
        )}
        onAnimationEnd={() => {
          if (!open) setVisible(false)
        }}
      >
        {(title || !hideClose) && (
          <div className="flex items-start justify-between gap-4 p-6 pb-4 border-b border-white/[0.06]">
            <div className="space-y-1">
              {title && <h2 className="text-[18px] font-semibold tracking-tight text-white">{title}</h2>}
              {description && <p className="text-[13px] text-zinc-400 leading-relaxed">{description}</p>}
            </div>
            {!hideClose && (
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 -mr-1 -mt-1 shrink-0 rounded-full">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
        <div className="p-6">{children}</div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#7C3AED]/40 to-transparent" />
      </div>
    </div>
  )
}

export function ModalFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center justify-end gap-3 border-t border-white/[0.06] pt-5 mt-2", className)} {...props} />
}
