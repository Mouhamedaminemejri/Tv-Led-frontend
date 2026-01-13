"use client";

// ============================================================================
// PASSWORD STRENGTH INDICATOR - Visual Password Strength Feedback
// ============================================================================

import * as React from "react";
import { Check, X, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PasswordStrength } from "@/types/auth";

// ============================================================================
// Password Strength Calculator
// ============================================================================

export function calculatePasswordStrength(password: string): PasswordStrength {
    let score = 0;
    const suggestions: string[] = [];

    if (!password) {
        return {
            score: 0,
            label: "Very Weak",
            suggestions: ["Enter a password"],
            color: "bg-gray-300 dark:bg-gray-700",
        };
    }

    // Length checks
    if (password.length >= 8) score++;
    else suggestions.push("Use at least 8 characters");

    if (password.length >= 12) score++;

    // Character variety checks
    if (/[a-z]/.test(password)) score += 0.5;
    else suggestions.push("Add lowercase letters");

    if (/[A-Z]/.test(password)) score += 0.5;
    else suggestions.push("Add uppercase letters");

    if (/[0-9]/.test(password)) score += 0.5;
    else suggestions.push("Add numbers");

    if (/[^a-zA-Z0-9]/.test(password)) score += 0.5;
    else suggestions.push("Add special characters (!@#$%^&*)");

    // Penalize common patterns
    if (/^[a-zA-Z]+$/.test(password) || /^[0-9]+$/.test(password)) {
        score = Math.max(0, score - 1);
        suggestions.push("Mix letters and numbers");
    }

    // Map score to strength level
    const normalizedScore = Math.min(4, Math.floor(score));

    const strengthMap: Record<number, Pick<PasswordStrength, "label" | "color">> = {
        0: { label: "Very Weak", color: "bg-red-500" },
        1: { label: "Weak", color: "bg-orange-500" },
        2: { label: "Fair", color: "bg-yellow-500" },
        3: { label: "Strong", color: "bg-green-500" },
        4: { label: "Very Strong", color: "bg-emerald-500" },
    };

    return {
        score: normalizedScore,
        ...strengthMap[normalizedScore],
        suggestions: suggestions.slice(0, 3),
    };
}

// ============================================================================
// Password Requirements List
// ============================================================================

interface PasswordRequirement {
    label: string;
    test: (password: string) => boolean;
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
    { label: "At least 8 characters", test: (p) => p.length >= 8 },
    { label: "Contains uppercase letter", test: (p) => /[A-Z]/.test(p) },
    { label: "Contains lowercase letter", test: (p) => /[a-z]/.test(p) },
    { label: "Contains number", test: (p) => /[0-9]/.test(p) },
    { label: "Contains special character", test: (p) => /[^a-zA-Z0-9]/.test(p) },
];

// ============================================================================
// Password Strength Bar Component
// ============================================================================

interface PasswordStrengthBarProps {
    password: string;
    showLabel?: boolean;
    className?: string;
}

export function PasswordStrengthBar({
    password,
    showLabel = true,
    className,
}: PasswordStrengthBarProps) {
    const strength = calculatePasswordStrength(password);

    return (
        <div className={cn("space-y-2", className)}>
            {/* Strength bars */}
            <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((index) => (
                    <div
                        key={index}
                        className={cn(
                            "h-1.5 flex-1 rounded-full transition-all duration-300",
                            index <= strength.score && password
                                ? strength.color
                                : "bg-gray-200 dark:bg-gray-700"
                        )}
                    />
                ))}
            </div>

            {/* Label */}
            {showLabel && password && (
                <div className="flex items-center justify-between text-xs">
                    <span
                        className={cn(
                            "font-medium transition-colors",
                            strength.score <= 1 && "text-red-500",
                            strength.score === 2 && "text-yellow-500",
                            strength.score >= 3 && "text-green-500"
                        )}
                    >
                        {strength.label}
                    </span>
                    {strength.suggestions.length > 0 && (
                        <span className="text-gray-500 dark:text-gray-400">
                            {strength.suggestions[0]}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Password Requirements Checklist
// ============================================================================

interface PasswordRequirementsProps {
    password: string;
    className?: string;
}

export function PasswordRequirements({
    password,
    className,
}: PasswordRequirementsProps) {
    return (
        <div className={cn("space-y-2", className)}>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Password requirements:
            </p>
            <ul className="space-y-1.5">
                {PASSWORD_REQUIREMENTS.map((req, index) => {
                    const isMet = req.test(password);
                    return (
                        <li
                            key={index}
                            className={cn(
                                "flex items-center gap-2 text-xs transition-colors duration-200",
                                isMet
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-gray-500 dark:text-gray-400"
                            )}
                        >
                            {isMet ? (
                                <Check className="h-3.5 w-3.5" />
                            ) : (
                                <X className="h-3.5 w-3.5" />
                            )}
                            <span>{req.label}</span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

// ============================================================================
// Password Input with Toggle Visibility
// ============================================================================

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    showStrength?: boolean;
    showRequirements?: boolean;
    error?: string;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ className, showStrength, showRequirements, error, ...props }, ref) => {
        const [showPassword, setShowPassword] = React.useState(false);
        const [password, setPassword] = React.useState((props.value as string) || "");

        React.useEffect(() => {
            if (props.value !== undefined) {
                setPassword(props.value as string);
            }
        }, [props.value]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setPassword(e.target.value);
            props.onChange?.(e);
        };

        return (
            <div className="space-y-2">
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        className={cn(
                            "flex h-10 w-full rounded-lg border px-3 py-2 text-sm pr-10",
                            "bg-gray-50 dark:bg-white/5",
                            "border-gray-300 dark:border-white/20",
                            "text-gray-900 dark:text-white",
                            "placeholder:text-gray-500",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            "transition-colors duration-200",
                            error && "border-red-500 focus:ring-red-500",
                            className
                        )}
                        ref={ref}
                        {...props}
                        onChange={handleChange}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={cn(
                            "absolute right-3 top-1/2 -translate-y-1/2",
                            "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
                            "transition-colors duration-200"
                        )}
                        tabIndex={-1}
                    >
                        {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                </div>

                {error && (
                    <p className="text-xs text-red-500">{error}</p>
                )}

                {showStrength && password && (
                    <PasswordStrengthBar password={password} />
                )}

                {showRequirements && password && (
                    <PasswordRequirements password={password} />
                )}
            </div>
        );
    }
);

PasswordInput.displayName = "PasswordInput";

export default PasswordStrengthBar;
