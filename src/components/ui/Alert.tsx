import React from "react";
import { AlertCircle, CheckCircle, Info, XCircle, X } from "lucide-react";
import { alertVariants, cn } from "../../design/variants";

interface AlertProps {
  children: React.ReactNode;
  variant?: keyof typeof alertVariants.variants;
  title?: string;
  className?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ReactNode;
}

const defaultIcons = {
  success: CheckCircle,
  warning: AlertCircle,
  error: XCircle,
  info: Info,
};

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      children,
      variant = "info",
      title,
      className,
      dismissible = false,
      onDismiss,
      icon,
    },
    ref
  ) => {
    const Icon = icon ? null : defaultIcons[variant];

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants.base, alertVariants.variants[variant], className)}
      >
        {Icon && <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />}
        {icon && <span className="flex-shrink-0 mt-0.5" aria-hidden="true">{icon}</span>}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-semibold mb-1 text-sm">{title}</h4>
          )}
          <div className="text-sm">{children}</div>
        </div>
        {dismissible && onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="flex-shrink-0 ml-3 -mr-1 -mt-1 p-1 rounded-md hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = "Alert";

export default Alert;
