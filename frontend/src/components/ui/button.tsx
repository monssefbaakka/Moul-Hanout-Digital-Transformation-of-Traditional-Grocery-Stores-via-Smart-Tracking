import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "app-btn group/button shrink-0 whitespace-nowrap outline-none select-none disabled:pointer-events-none aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "app-btn--primary",
        outline: "app-btn--secondary",
        secondary: "app-btn--secondary",
        ghost: "app-btn--ghost",
        destructive: "app-btn--danger",
        link: "border-transparent bg-transparent px-0 text-primary underline-offset-4 shadow-none hover:underline",
      },
      size: {
        default: "",
        xs: "app-btn--sm min-h-8 px-3 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "app-btn--sm [&_svg:not([class*='size-'])]:size-3.5",
        lg: "app-btn--lg",
        icon: "size-8 px-0",
        "icon-xs":
          "app-btn--sm size-8 px-0 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-10 px-0",
        "icon-lg": "app-btn--lg size-12 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
