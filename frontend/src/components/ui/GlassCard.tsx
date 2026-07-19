import type { CSSProperties, ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  style?: CSSProperties;
}

export function GlassCard({
  children,
  className = "",
  hover = false,
  glow = false,
  style,
}: GlassCardProps) {
  return (
    <div
      style={style}
      className={[
        "glass rounded-2xl shadow-card",
        hover && "glass-hover cursor-pointer",
        glow && "animate-pulse-glow",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
