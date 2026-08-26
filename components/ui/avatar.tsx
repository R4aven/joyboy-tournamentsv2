import * as React from "react"
import { cn } from "@/lib/utils"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  fallback?: string
  size?: "sm" | "md" | "lg" | "xl" | "2xl"
  glow?: boolean
  status?: "online" | "offline" | "playing"
}

const sizeMap = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-[13px]",
  lg: "h-12 w-12 text-[15px]",
  xl: "h-16 w-16 text-[18px]",
  "2xl": "h-24 w-24 text-[26px]",
}

const statusColor = {
  online: "bg-emerald-500",
  offline: "bg-zinc-600",
  playing: "bg-[#7C3AED]",
}

export function Avatar({ className, src, alt, fallback, size = "md", glow = true, status, ...props }: AvatarProps) {
  const [error, setError] = React.useState(false)
  const initials = React.useMemo(() => {
    if (fallback) return fallback.slice(0, 2).toUpperCase()
    if (alt) {
      const parts = alt.trim().split(" ").filter(Boolean)
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
      return alt.slice(0, 2).toUpperCase()
    }
    return "JB"
  }, [alt, fallback])

  return (
    <div className={cn("relative inline-flex shrink-0", className)} {...props}>
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-full bg-[#1E1E2A] border border-[#2A2A3A] font-semibold text-white",
          "ring-1 ring-white/[0.06]",
          glow && "shadow-[0_0_0_1px_rgba(124,58,237,0.15),0_0_20px_rgba(124,58,237,0.15)]",
          sizeMap[size]
        )}
      >
        {src && !error ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt || "Avatar"}
            className="h-full w-full object-cover"
            onError={() => setError(true)}
          />
        ) : (
          <span className="bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] bg-clip-text text-transparent font-bold tracking-tight">
            {initials}
          </span>
        )}
        <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-white/[0.08] to-transparent" />
      </div>
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#08080B] shadow-sm",
            statusColor[status],
            "lg:h-3.5 lg:w-3.5"
          )}
        />
      )}
    </div>
  )
}

export function AvatarGroup({ children, className, max = 3 }: { children: React.ReactNode; className?: string; max?: number }) {
  const childs = React.Children.toArray(children)
  const visible = childs.slice(0, max)
  const extra = childs.length - max
  return (
    <div className={cn("flex -space-x-2", className)}>
      {visible.map((c, i) => (
        <div key={i} className="ring-2 ring-[#08080B] rounded-full">
          {c}
        </div>
      ))}
      {extra > 0 && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1E1E2A] border border-[#2A2A3A] text-[11px] font-bold text-zinc-300 ring-2 ring-[#08080B]">
          +{extra}
        </div>
      )}
    </div>
  )
}
