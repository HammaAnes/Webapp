import React from "react";
import { cardVariants, cn } from "../../design/variants";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: keyof typeof cardVariants.variants;
  padding?: keyof typeof cardVariants.padding;
  radius?: keyof typeof cardVariants.radius;
  interactive?: boolean;
  hover?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  as?: "div" | "article" | "section";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      className,
      variant = "default",
      padding = "md",
      radius = "md",
      interactive = false,
      hover = false,
      onClick,
      style,
      as: Component = "div",
    },
    ref
  ) => {
    const isClickable = Boolean(onClick);

    return (
      <Component
        ref={ref}
        onClick={onClick}
        onKeyDown={
          isClickable
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick?.();
                }
              }
            : undefined
        }
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : undefined}
        className={cn(
          cardVariants.base,
          cardVariants.variants[variant],
          cardVariants.padding[padding],
          cardVariants.radius[radius],
          (interactive || isClickable) && cardVariants.interactive,
          className
        )}
        style={style}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = "Card";

export default Card;
