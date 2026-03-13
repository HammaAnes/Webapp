import React from 'react';

interface FormFieldProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  children: React.ReactNode;
  htmlFor?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  helperText,
  required,
  children,
  htmlFor,
}) => {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-600">{helperText}</p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default FormField;
