import React from "react";

interface LogoProps {
  className?: string;
  variant?: "light" | "dark";
  size?: string;
}

export const Logo: React.FC<LogoProps> = ({
  className = "h-16 w-auto",
  variant = "dark",
  size,
}) => {
  const finalClassName = size || className;

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
