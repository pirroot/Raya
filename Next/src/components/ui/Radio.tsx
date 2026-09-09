"use client";

import { forwardRef } from "react";

interface RadioOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "type" | "size"> {
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name: string;
  label?: string;
  error?: string;
  direction?: "row" | "column";
  variant?: "card" | "button" | "default";
  size?: "sm" | "md" | "lg";
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      options,
      value,
      defaultValue,
      onChange,
      name,
      label,
      error,
      direction = "column",
      variant = "default",
      size = "md",
      className = "",
      disabled = false,
      ...props
    },
    ref
  ) => {
    const sizes = {
      sm: { dot: "h-3.5 w-3.5", label: "text-sm", gap: "gap-2", padding: "p-2" },
      md: { dot: "h-4 w-4", label: "text-sm", gap: "gap-3", padding: "p-3" },
      lg: { dot: "h-5 w-5", label: "text-base", gap: "gap-4", padding: "p-4" },
    };

    const variants = {
      default: {
        wrapper: "flex items-center gap-3",
        dot: "rounded-full border-2 border-border bg-background-elevated transition-all duration-200 shrink-0",
        checked: "border-primary bg-primary",
        inner: "h-full w-full scale-0 rounded-full bg-white transition-all duration-200",
        innerChecked: "scale-100",
      },
      card: {
        wrapper: `flex items-center gap-3 rounded-[var(--radius)] border-2 p-3 transition-all duration-200 
          hover:border-primary/50 cursor-pointer
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}`,
        dot: "rounded-full border-2 border-border bg-background-elevated transition-all duration-200 shrink-0",
        checked: "border-primary bg-primary",
        inner: "h-full w-full scale-0 rounded-full bg-white transition-all duration-200",
        innerChecked: "scale-100",
      },
      button: {
        wrapper: `flex items-center justify-center rounded-[var(--radius-sm)] border-2 px-4 py-2 transition-all duration-200 
          hover:border-primary/50 cursor-pointer text-foreground-muted
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}`,
        dot: "hidden",
        checked: "border-primary bg-primary-soft text-primary font-bold",
        inner: "hidden",
        innerChecked: "",
      },
    };

    const selectedValue = value !== undefined ? value : defaultValue;
    const currentSize = sizes[size] || sizes.md;

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label className="mb-2 block text-sm font-bold text-foreground">
            {label}
          </label>
        )}

        <div
          className={`flex ${direction === "row" ? "flex-row flex-wrap gap-3" : "flex-col gap-2"}`}
        >
          {options.map((option) => {
            const isChecked = selectedValue === option.value;
            const isDisabled = disabled || option.disabled;
            const variantStyles = variants[variant];

            return (
              <label
                key={option.value}
                className={`
                  ${variantStyles.wrapper}
                  ${isChecked ? variantStyles.checked : "border-border"}
                  ${variant === "card" ? currentSize.padding : ""}
                  ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                  ${variant === "card" && isChecked ? "border-primary shadow-[var(--shadow-sm)]" : ""}
                  ${variant === "card" && !isChecked ? "border-border hover:border-primary/30" : ""}
                  ${variant === "button" && isChecked ? "border-primary" : ""}
                  ${variant === "button" && !isChecked ? "border-border hover:border-primary/30" : ""}
                `}
              >
                <input
                  ref={ref}
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={isChecked}
                  onChange={() => !isDisabled && onChange?.(option.value)}
                  disabled={isDisabled}
                  className="sr-only"
                  {...props}
                />

                {variant !== "button" && (
                  <div
                    className={`
                      ${variantStyles.dot}
                      ${currentSize.dot}
                      ${isChecked ? variantStyles.checked : ""}
                      ${isDisabled ? "opacity-50" : ""}
                    `}
                  >
                    <div
                      className={`
                        ${variantStyles.inner}
                        ${isChecked ? variantStyles.innerChecked : ""}
                      `}
                    />
                  </div>
                )}

                {option.icon && (
                  <span className={`shrink-0 ${isChecked ? "text-primary" : "text-foreground-muted"}`}>
                    {option.icon}
                  </span>
                )}

                <div className="flex flex-col">
                  <span className={`font-medium ${isChecked ? "text-foreground" : "text-foreground-muted"}`}>
                    {option.label}
                  </span>
                  {option.description && (
                    <span className="text-xs text-foreground-muted/70">
                      {option.description}
                    </span>
                  )}
                </div>
              </label>
            );
          })}
        </div>

        {error && (
          <p className="mt-1 text-xs font-bold text-error">{error}</p>
        )}
      </div>
    );
  }
);

Radio.displayName = "Radio";