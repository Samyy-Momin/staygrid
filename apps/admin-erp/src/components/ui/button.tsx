import * as React from"react"
import { Slot } from"@radix-ui/react-slot"
import { cva, type VariantProps } from"class-variance-authority"
import { cn } from"@/lib/utils"

export const buttonVariants = cva(
"inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
 {
 variants: {
 variant: {
 default: "bg-accent-primary text-white hover:bg-accent-primary/90 shadow-sm",
 outline:"border border-border bg-transparent hover:bg-surface text-primary dark:border-border dark:text-primary dark:hover:bg-surface",
 ghost:"hover:bg-surface dark:hover:bg-surface",
 destructive:"bg-danger text-white hover:bg-danger dark:bg-danger dark:text-danger dark:hover:bg-danger shadow-sm",
 },
 size: {
 default:"h-10 px-4 py-2",
 sm:"h-8 rounded-md px-3 text-xs",
 lg:"h-11 rounded-md px-8",
 icon:"h-10 w-10",
 },
 },
 defaultVariants: {
 variant:"default",
 size:"default",
 },
 }
)

export interface ButtonProps
 extends React.ButtonHTMLAttributes<HTMLButtonElement>,
 VariantProps<typeof buttonVariants> {
 asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
 ({ className, variant, size, asChild = false, ...props }, ref) => {
 const Comp = asChild ? Slot :"button"
 return (
 <Comp
 className={cn(buttonVariants({ variant, size, className }))}
 ref={ref}
 {...props}
 />
 )
 }
)
Button.displayName ="Button"

export { Button }
