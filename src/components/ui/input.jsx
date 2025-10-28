import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 transition-all duration-150 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 hover:border-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }