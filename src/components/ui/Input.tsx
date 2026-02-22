import React, { forwardRef, useId } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  className?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = "", ...props }, ref) => {
    const generatedId = useId();
    const inputId = props.id || generatedId;
    const errorId = `${inputId}-error`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
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
            aria-describedby={error ? errorId : undefined}
            className={`w-full ${icon ? "pl-10" : "pl-3"} pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors ${
              error ? "border-red-500 focus:ring-red-500" : ""
            } disabled:bg-gray-100 disabled:cursor-not-allowed ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
