import * as React from "react"
import { cn } from "@/lib/utils"

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "violet"
  | "cyan"
  | "muted"
  | "live"
  | "en_cours"
  | "termine"
  | "a_venir"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
  dot?: boolean
}

const variants: Record<BadgeVariant, string> = {
  default: "bg-[#1E1E2A] text-zinc-200 border-[#2A2A3A]",
  muted: "bg-white/[0.04] text-zinc-500 border-white/[0.06]",
  violet: "bg-[#7C3AED]/15 text-[#A78BFA] border-[#7C3AED]/30 shadow-[0_0_12px_rgba(124,58,237,0.15)]",
  cyan: "bg-[#06B6D4]/12 text-cyan-300 border-[#06B6D4]/25",
  success: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  danger: "bg-red-500/10 text-red-300 border-red-500/20",
  info: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  live: "bg-red-500 text-white border-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.4)]",
  en_cours: "bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]",
  termine: "bg-emerald-500/12 text-emerald-300 border-emerald-500/25",
  a_venir: "bg-[#1E1E2A] text-zinc-400 border-[#2A2A3A]",
}

export function Badge({ className, variant = "default", dot = false, children, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase",
        variants[variant],
        className
      )}
      {...props}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />}
      {children}
    </div>
  )
}
