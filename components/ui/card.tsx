import * as React from "react"
import { cn } from "@/lib/utils"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean
  glowColor?: "violet" | "cyan" | "mixed"
  hover?: boolean
}

const glowMap = {
  violet: "shadow-[0_0_0_1px_rgba(124,58,237,0.15),0_8px_32px_rgba(124,58,237,0.15),inset_0_1px_0_rgba(255,255,255,0.06)]",
  cyan: "shadow-[0_0_0_1px_rgba(6,182,214,0.15),0_8px_32px_rgba(6,182,214,0.12),inset_0_1px_0_rgba(255,255,255,0.06)]",
  mixed: "shadow-[0_0_0_1px_rgba(124,58,237,0.12),0_8px_32px_rgba(124,58,237,0.12),0_0_40px_rgba(6,182,214,0.08),inset_0_1px_0_rgba(255,255,255,0.07)]",
}

export function Card({ className, glow = true, glowColor = "mixed", hover = true, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "relative rounded-[20px] bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.01)_100%),#15151E] border border-[#22222F]",
        "backdrop-blur-sm",
        glow && glowMap[glowColor],
        hover && "transition-all duration-300 hover:border-[#7C3AED]/30 hover:-translate-y-[1px] hover:shadow-[0_0_0_1px_rgba(124,58,237,0.2),0_16px_40px_-12px_rgba(124,58,237,0.25)]",
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 p-6 pb-3", className)} {...props} />
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-[17px] font-semibold leading-none tracking-tight text-white", className)} {...props} />
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-[13.5px] text-zinc-400 leading-relaxed", className)} {...props} />
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center p-6 pt-0", className)} {...props} />
}
