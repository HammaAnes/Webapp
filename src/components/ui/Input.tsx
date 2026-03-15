import React, { forwardRef, useId } from "react";
import { AlertCircle } from "lucide-react";
import { inputVariants, cn } from "../../design/variants";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  className?: string;
  helperText?: string;
  rightElement?: React.ReactNode;
  inputSize?: keyof typeof inputVariants.sizes;
  variant?: keyof typeof inputVariants.variants;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      icon,
      helperText,
      rightElement,
      className,
      inputSize = "md",
      variant,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = props.id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const resolvedVariant = error ? "error" : variant || "default";

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-gray-700 mb-1.5"
          >
            {label}
            {props.required && (
              <span className="text-red-500 ml-1" aria-label="requis">
                *
              </span>
            )}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10"
              aria-hidden="true"
            >
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            className={cn(
              inputVariants.base,
              inputVariants.variants[resolvedVariant],
              inputVariants.sizes[inputSize],
              !!icon && "pl-10",
              !!(rightElement || error) && "pr-10",
              className
            )}
            {...props}
          />
          {(rightElement || error) && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10">
              {error ? (
                <AlertCircle className="w-5 h-5 text-red-500" aria-hidden="true" />
              ) : (
                rightElement
              )}
            </div>
          )}
        </div>
        {helperText && !error && (
          <p id={helperId} className="mt-1.5 text-xs text-gray-500">
            {helperText}
          </p>
        )}
        {error && (
          <p id={errorId} className="mt-1.5 text-xs text-red-600 font-medium flex items-start gap-1" role="alert">
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
