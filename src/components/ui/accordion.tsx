"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

type AccordionContextType = {
    value: string[]
    onValueChange: (value: string) => void
}

const AccordionContext = React.createContext<AccordionContextType | undefined>(undefined)
const AccordionItemContext = React.createContext<string | undefined>(undefined)

const Accordion = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
        type?: "single" | "multiple"
        defaultValue?: string[]
        value?: string[]
        onValueChange?: (value: string[]) => void
    }
>(({ className, type = "single", defaultValue = [], value: controlledValue, onValueChange, children, ...props }, ref) => {
    const [value, setValue] = React.useState<string[]>(defaultValue)

    const currentValue = controlledValue || value

    const handleValueChange = React.useCallback((itemValue: string) => {
        // Determine new value based on type and current state
        // We need to calculate based on 'currentValue' which might update 
        // but here we are in a callback. Ideally we use the state setter callback if uncontrolled,
        // but if controlled we depend on props.
        // For simplicity in this hybrid:

        let next: string[]
        if (type === "multiple") {
            next = currentValue.includes(itemValue)
                ? currentValue.filter((v) => v !== itemValue)
                : [...currentValue, itemValue]
        } else {
            next = currentValue.includes(itemValue) ? [] : [itemValue]
        }

        if (!controlledValue) {
            setValue(next)
        }
        onValueChange?.(next)
    }, [type, currentValue, controlledValue, onValueChange])

    return (
        <AccordionContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
            <div ref={ref} className={cn("w-full", className)} {...props}>
                {children}
            </div>
        </AccordionContext.Provider>
    )
})
Accordion.displayName = "Accordion"

const AccordionItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, children, ...props }, ref) => (
    <AccordionItemContext.Provider value={value}>
        <div ref={ref} className={cn("border-b border-white/10", className)} data-value={value} {...props}>
            {children}
        </div>
    </AccordionItemContext.Provider>
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, onClick, ...props }, ref) => {
    const context = React.useContext(AccordionContext)
    const itemValue = React.useContext(AccordionItemContext) || ""
    const isOpen = context?.value.includes(itemValue)

    return (
        <div className="flex">
            <button
                ref={ref}
                className={cn(
                    "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:text-blue-400 [&[data-state=open]>svg]:rotate-180",
                    className
                )}
                data-state={isOpen ? "open" : "closed"}
                onClick={(e) => {
                    onClick?.(e)
                    context?.onValueChange(itemValue)
                }}
                {...props}
            >
                {children}
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
            </button>
        </div>
    )
})
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
    const context = React.useContext(AccordionContext)
    const itemValue = React.useContext(AccordionItemContext) || ""
    const isOpen = context?.value.includes(itemValue)

    return (
        <div
            ref={ref}
            className={cn(
                "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
                isOpen ? "block pb-4 pt-0" : "hidden"
            )}
            data-state={isOpen ? "open" : "closed"}
            {...props}
        >
            <div className={cn("pb-4 pt-0", className)}>{children}</div>
        </div>
    )
})
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
