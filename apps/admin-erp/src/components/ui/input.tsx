import * as React from"react"
import { cn } from"@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
 ({ className, type, ...props }, ref) => {
 return (
 <input
 type={type}
 className={cn(
 "flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary disabled:cursor-not-allowed disabled:opacity-50 bg-surface dark:text-primary",
 className
 )}
 ref={ref}
 {...props}
 />
 )
 }
)
Input.displayName ="Input"

export { Input }
