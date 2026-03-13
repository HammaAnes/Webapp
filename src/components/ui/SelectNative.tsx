import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectNativeProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const SelectNative = forwardRef<HTMLSelectElement, SelectNativeProps>(
  ({ label, error, icon, className = '', required, children, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <select
            ref={ref}
            className={`
              w-full px-4 py-3 ${icon ? 'pl-11' : ''} pr-10
              bg-white border rounded-lg
              appearance-none cursor-pointer
              transition-all duration-200
              ${error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-accent focus:ring-accent'
              }
              focus:outline-none focus:ring-2 focus:ring-opacity-50
              disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500
              ${className}
            `}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${props.id}-error` : undefined}
            required={required}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
        {error && (
          <p
            id={`${props.id}-error`}
            className="mt-2 text-sm text-red-600 flex items-center gap-1"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

SelectNative.displayName = 'SelectNative';

export default SelectNative;
