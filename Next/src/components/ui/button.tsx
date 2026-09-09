import { forwardRef } from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "success" | "error";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  children?: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      variant = "primary",
      size = "md",
      fullWidth = false,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none";

    const variants = {
      primary:
        "bg-primary text-foreground-inverted hover:bg-primary-hover hover:shadow-[var(--shadow-lg)] active:scale-[0.97]",
      secondary:
        "bg-background-subtle text-foreground border border-border hover:bg-border hover:shadow-[var(--shadow)] active:scale-[0.97]",
      outline:
        "bg-transparent text-primary border-2 border-primary hover:bg-primary-soft hover:border-primary-hover active:scale-[0.97]",
      ghost:
        "bg-transparent text-foreground-muted hover:bg-background-subtle hover:text-foreground active:scale-[0.97]",
      success:
        "bg-success text-foreground-inverted hover:bg-success/80 hover:shadow-[var(--shadow-lg)] active:scale-[0.97]",
      error:
        "bg-error text-foreground-inverted hover:bg-error/80 hover:shadow-[var(--shadow-lg)] active:scale-[0.97]",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs rounded-[var(--radius-sm)] min-h-[32px]",
      md: "px-4 py-2.5 text-sm rounded-[var(--radius-sm)] min-h-[44px]",
      lg: "px-6 py-3 text-base rounded-[var(--radius-sm)] min-h-[52px]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`
          ${baseStyles}
          ${variants[variant]}
          ${sizes[size]}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";