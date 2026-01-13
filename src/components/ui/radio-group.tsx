import * as React from "react"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const RadioGroupContext = React.createContext<{ value?: string; onValueChange?: (value: string) => void } | undefined>(undefined)

const RadioGroup = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value?: string; defaultValue?: string; onValueChange?: (value: string) => void }
>(({ className, value, defaultValue, onValueChange, children, ...props }, ref) => {
    const [val, setVal] = React.useState(defaultValue || "")

    const currentVal = value !== undefined ? value : val

    const handleValueChange = (newValue: string) => {
        if (value === undefined) {
            setVal(newValue)
        }
        onValueChange?.(newValue)
    }

    return (
        <RadioGroupContext.Provider value={{ value: currentVal, onValueChange: handleValueChange }}>
            <div className={cn("grid gap-2", className)} ref={ref} {...props}>
                {children}
            </div>
        </RadioGroupContext.Provider>
    )
})
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }
>(({ className, value, onClick, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext)
    const isSelected = context?.value === value

    return (
        <button
            ref={ref}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={cn(
                "aspect-square h-4 w-4 rounded-full border ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center",
                isSelected ? "border-gray-900 dark:border-blue-600 text-gray-900 dark:text-blue-600" : "border-gray-400 dark:border-white/30 text-transparent",
                className
            )}
            onClick={(e) => {
                onClick?.(e)
                context?.onValueChange?.(value)
            }}
            {...props}
        >
            <Circle className={cn("h-2.5 w-2.5 fill-current text-current", isSelected ? "opacity-100" : "opacity-0")} />
        </button>
    )
})
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
