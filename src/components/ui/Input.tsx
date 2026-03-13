import React, { forwardRef, useId } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  className?: string;
  helperText?: string;
  rightElement?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, helperText, rightElement, className = "", ...props }, ref) => {
    const generatedId = useId();
    const inputId = props.id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-2"
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
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
              aria-hidden="true"
            >
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={`w-full ${icon ? "pl-10" : "pl-3"} ${rightElement ? 'pr-10' : 'pr-3'} py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200 ${
              error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-300 focus:ring-accent focus:border-accent"
            } disabled:bg-gray-100 disabled:cursor-not-allowed ${className}`}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {rightElement}
            </div>
          )}
        </div>
        {helperText && !error && (
          <p id={helperId} className="mt-2 text-sm text-gray-600">
            {helperText}
          </p>
        )}
        {error && (
          <p id={errorId} className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
