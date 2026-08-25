import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  hint?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, rightIcon, hint, type = "text", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-")
    return (
      <div className="flex w-full flex-col gap-2">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-medium text-zinc-300 tracking-[-0.01em]">
            {label}
          </label>
        )}
        <div className={cn("group relative flex items-center", error && "animate-[shake_0.3s_ease]")}>
          {leftIcon && (
            <span className="pointer-events-none absolute left-3.5 text-zinc-500 group-focus-within:text-[#7C3AED] transition-colors">
              {leftIcon}
            </span>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              "flex h-11 w-full rounded-xl border bg-[#12121A] px-4 text-[14px] text-white placeholder:text-zinc-600",
              "border-[#23232F] outline-none transition-all",
              "focus:border-[#7C3AED]/50 focus:bg-[#16161F] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]",
              "disabled:opacity-50 disabled:pointer-events-none",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-red-500/50 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]",
              className
            )}
            {...props}
          />
          {rightIcon && <span className="absolute right-3.5 text-zinc-500">{rightIcon}</span>}
        </div>
        {(hint || error) && (
          <p className={cn("text-[12px] leading-snug", error ? "text-red-400" : "text-zinc-500")}>
            {error || hint}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }
>(({ className, label, error, id, ...props }, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-")
  return (
    <div className="flex w-full flex-col gap-2">
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-medium text-zinc-300">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        ref={ref}
        className={cn(
          "min-h-[100px] w-full rounded-xl border bg-[#12121A] px-4 py-3 text-[14px] text-white placeholder:text-zinc-600",
          "border-[#23232F] outline-none transition-all resize-none",
          "focus:border-[#7C3AED]/50 focus:bg-[#16161F] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]",
          error && "border-red-500/50",
          className
        )}
        {...props}
      />
      {error && <p className="text-[12px] text-red-400">{error}</p>}
    </div>
  )
})
Textarea.displayName = "Textarea"
