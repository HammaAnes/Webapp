import React from "react";

interface LogoProps {
  className?: string;
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses: Record<string, string> = {
  sm: "h-8 w-auto",
  md: "h-12 w-auto",
  lg: "h-16 w-auto",
  xl: "h-20 w-auto",
};

export const Logo: React.FC<LogoProps> = ({
  className = "",
  variant = "dark",
  size,
}) => {
  const sizeClass = size ? sizeClasses[size] : "";
  const finalClassName = `${sizeClass} ${className}`.trim() || "h-16 w-auto";

  return (
    <img
      src="/logo_coffice.png"
      alt="Coffice - Coworking Space by HCC"
      className={finalClassName}
      style={variant === "light" ? { filter: "brightness(0) invert(1)" } : undefined}
    />
  );
};

export default Logo;
