import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { checked?: boolean; onCheckedChange?: (checked: boolean) => void }
>(({ className, checked, onCheckedChange, ...props }, ref) => (
    <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        ref={ref}
        className={cn(
            "peer h-4 w-4 shrink-0 rounded-sm border ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center",
            checked ? "bg-gray-900 dark:bg-blue-600 text-white border-gray-900 dark:border-blue-600" : "border-gray-400 dark:border-white/30 text-transparent bg-white dark:bg-transparent",
            className
        )}
        onClick={() => onCheckedChange?.(!checked)}
        {...props}
    >
        <Check className="h-3 w-3" />
    </button>
))
Checkbox.displayName = "Checkbox"

export { Checkbox }
