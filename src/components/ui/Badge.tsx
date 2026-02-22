import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "info" | "error" | "teal";
  size?: "sm" | "md" | "lg";
  className?: string;
  style?: React.CSSProperties;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  className = "",
  style,
}) => {
  const variantStyles = {
    default: "bg-gray-100 text-gray-700 border border-gray-200",
    primary: "bg-sky-50 text-sky-700 border border-sky-200",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    danger: "bg-red-50 text-red-700 border border-red-200",
    error: "bg-red-50 text-red-700 border border-red-200",
    info: "bg-sky-50 text-sky-700 border border-sky-200",
    teal: "bg-teal-50 text-teal-700 border border-teal-200",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      style={style}
    >
      {children}
    </span>
  );
};

export default React.memo(Badge);
