import React, { forwardRef } from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string | React.ReactNode;
  error?: string;
  description?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, description, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex items-center justify-center mt-0.5">
            <input
              ref={ref}
              type="checkbox"
              className="sr-only peer"
              {...props}
            />
            <div
              className={`
                w-5 h-5 border-2 rounded
                flex items-center justify-center
                transition-all duration-200
                ${error
                  ? 'border-red-500'
                  : 'border-gray-300 peer-checked:border-accent peer-checked:bg-accent'
                }
                peer-focus:ring-2 peer-focus:ring-accent peer-focus:ring-opacity-50
                peer-disabled:bg-gray-100 peer-disabled:cursor-not-allowed
                peer-checked:[&>svg]:opacity-100
                ${className}
              `}
            >
              <Check className="w-3.5 h-3.5 text-white opacity-0 transition-opacity" />
            </div>
          </div>
          {(label || description) && (
            <div className="flex-1">
              {label && (
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  {label}
                  {props.required && <span className="text-red-500 ml-1">*</span>}
                </span>
              )}
              {description && (
                <p className="text-xs text-gray-500 mt-1">{description}</p>
              )}
            </div>
          )}
        </label>
        {error && (
          <p className="mt-2 text-sm text-red-600 ml-8">{error}</p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
