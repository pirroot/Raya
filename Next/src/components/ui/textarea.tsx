import { forwardRef } from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", label, error, fullWidth = false, ...props }, ref) => {
    return (
      <div className={`${fullWidth ? "w-full" : ""}`}>
        {label && (
          <label className="mb-1.5 block text-sm font-bold text-foreground">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            input
            min-h-[100px] resize-y
            ${error ? "border-error focus:border-error focus:ring-error/20" : ""}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs font-bold text-error">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";