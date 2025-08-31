import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
        emerald: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
        amber: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
        rose: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
        slate: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
        secondary: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
        destructive: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
        outline: "border border-slate-200 text-slate-700",
        // Status-specific variants for applications
        draft: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
        pending: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
        processing: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
        approved: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
        rejected: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
        success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
        warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
        info: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
