import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hover = false,
  onClick,
  style,
}) => {
  return (
    <div
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden ${
        hover
          ? "hover:shadow-medium hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          : "transition-shadow duration-300"
      } ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

export default React.memo(Card);
