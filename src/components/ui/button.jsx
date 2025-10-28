import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-green-500 text-white hover:bg-green-600 active:bg-green-700 shadow-md hover:shadow-lg",
        destructive: "bg-red-500 text-white hover:bg-red-600 active:bg-red-700",
        outline: "border border-green-500 bg-white text-green-600 hover:bg-green-50 active:bg-green-100",
        secondary: "bg-white text-green-600 border border-gray-300 hover:bg-gray-50 active:bg-gray-100",
        ghost: "bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200",
        link: "bg-transparent text-green-600 underline-offset-4 hover:underline p-0 h-auto shadow-none",
        success: "bg-green-500 text-white hover:bg-green-600 active:bg-green-700",
        warning: "bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700",
        info: "bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-8 px-3 py-1 text-xs rounded-lg",
        lg: "h-12 px-6 py-3 text-base rounded-xl",
        icon: "h-10 w-10 p-0",
        xl: "h-14 px-8 py-4 text-lg rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }