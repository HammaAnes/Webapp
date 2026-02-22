import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "danger"
    | "success"
    | "outline"
    | "ghost"
    | "default";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  children,
  className = "",
  loading = false,
  disabled,
  ...props
}) => {
  const baseStyles =
    "rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 active:translate-y-px";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-base",
  };

  const variantStyles = {
    primary: "bg-primary text-white hover:bg-primary/90 shadow-sm",
    secondary: "bg-teal-600 text-white hover:bg-teal-700 shadow-sm",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900",
    default: "bg-gray-100 text-gray-700 hover:bg-gray-200",
  };

  const resolvedVariant = variantStyles[variant] ? variant : "primary";

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[resolvedVariant]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="sr-only">Chargement...</span>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default React.memo(Button);
