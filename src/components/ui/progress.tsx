import * as React from "react"

interface ProgressProps {
  value: number
  className?: string
}

const progressColor = (p: number) =>
  p >= 100 ? "bg-emerald-600" : p >= 70 ? "bg-emerald-500" : p >= 40 ? "bg-amber-500" : "bg-rose-500";

export const Progress = ({ value, className = "" }: ProgressProps) => (
  <div className={`w-full rounded-full bg-slate-100 h-2 ${className}`} aria-label="Funding progress">
    <div 
      className={`h-2 rounded-full ${progressColor(value)}`} 
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }} 
    />
  </div>
);