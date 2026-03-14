import React from "react";
import { badgeVariants, cn } from "../../design/variants";

interface BadgeProps {
  children: React.ReactNode;
  variant?: keyof typeof badgeVariants.variants;
  size?: keyof typeof badgeVariants.sizes;
  className?: string;
  icon?: React.ReactNode;
  removable?: boolean;
  onRemove?: () => void;
  style?: React.CSSProperties;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      children,
      variant = "neutral",
      size = "sm",
      className,
      icon,
      removable = false,
      onRemove,
      style,
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={cn(
          badgeVariants.base,
          badgeVariants.variants[variant],
          badgeVariants.sizes[size],
          className
        )}
        style={style}
      >
        {icon && <span className="mr-1" aria-hidden="true">{icon}</span>}
        <span>{children}</span>
        {removable && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-1 -mr-0.5 inline-flex items-center justify-center hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-1 rounded-full"
            aria-label="Retirer"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export default Badge;
