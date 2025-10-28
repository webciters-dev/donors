import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-200 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-green-500 text-white shadow hover:bg-green-600",
        secondary: "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200",
        outline: "border-green-500 text-green-600 bg-white hover:bg-green-50",
        destructive: "border-transparent bg-red-500 text-white shadow hover:bg-red-600",
        success: "border-transparent bg-green-500 text-white shadow hover:bg-green-600",
        warning: "border-transparent bg-amber-500 text-white shadow hover:bg-amber-600",
        info: "border-transparent bg-blue-500 text-white shadow hover:bg-blue-600",
        pending: "border-transparent bg-amber-100 text-amber-800 hover:bg-amber-200",
        approved: "border-transparent bg-green-100 text-green-800 hover:bg-green-200",
        rejected: "border-transparent bg-red-100 text-red-800 hover:bg-red-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }