import { forwardRef } from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "elevated" | "soft" | "bordered" | "glass";
  padding?: "none" | "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = "elevated",
      padding = "md",
      children,
      className = "",
      ...props
    },
    ref
  ) => {
    const variants = {
      elevated: "bg-card shadow-[var(--shadow)] border border-border",
      soft: "bg-background-subtle",
      bordered: "bg-transparent border border-border",
      glass: "bg-card/80 backdrop-blur-sm border border-border/50",
    };

    const paddings = {
      none: "",
      sm: "p-3",
      md: "p-4 lg:p-5",
      lg: "p-6 lg:p-8",
    };

    return (
      <div
        ref={ref}
        className={`
          rounded-[var(--radius)]
          transition-all duration-200
          ${variants[variant]}
          ${paddings[padding]}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";