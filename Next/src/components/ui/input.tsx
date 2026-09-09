import { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = "",
      label,
      error,
      fullWidth = false,
      leftIcon,
      rightIcon,
      type = "text",
      ...props
    },
    ref
  ) => {
    return (
      <div className={`${fullWidth ? "w-full" : ""}`}>
        {label && (
          <label className="mb-1.5 block text-sm font-bold text-foreground">
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            type={type}
            className={`
              input
              ${leftIcon ? "pr-10" : ""}
              ${rightIcon ? "pl-10" : ""}
              ${error ? "border-error focus:border-error focus:ring-error/20" : ""}
              ${className}
            `}
            {...props}
          />

          {rightIcon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-1 text-xs font-bold text-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";