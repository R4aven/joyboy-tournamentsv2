import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline"
type ButtonSize = "sm" | "md" | "lg" | "icon"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] text-white shadow-[0_0_20px_rgba(124,58,237,0.35)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] hover:from-[#7C3AED] hover:to-[#22D3EE] border border-white/10 active:scale-[0.98]",
  secondary:
    "bg-[#1A1A23] text-white border border-[#2A2A3A] hover:bg-[#222230] hover:border-[#7C3AED]/30 active:scale-[0.98]",
  ghost:
    "bg-transparent text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent",
  danger:
    "bg-gradient-to-br from-red-600 to-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.25)] hover:from-red-500 hover:to-red-400 border border-red-500/20 active:scale-[0.98]",
  outline:
    "bg-transparent text-white border border-[#2A2A3A] hover:border-[#7C3AED]/50 hover:bg-[#7C3AED]/10 active:scale-[0.98]",
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] rounded-lg gap-1.5",
  md: "h-10 px-5 text-[14px] rounded-xl gap-2",
  lg: "h-12 px-7 text-[15px] rounded-xl gap-2.5 font-semibold",
  icon: "h-10 w-10 p-0 rounded-xl",
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading
    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080B]",
          "disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : leftIcon}
        {size !== "icon" && <span className="tracking-[-0.01em]">{children}</span>}
        {!loading && rightIcon}
      </button>
    )
  }
)
Button.displayName = "Button"
