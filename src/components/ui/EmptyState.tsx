import React from "react";
import { Search, Database, Lock, RefreshCw } from "lucide-react";
import Button from "./Button";

type EmptyVariant = "no-data" | "no-results" | "no-permissions" | "error" | "default";

interface EmptyAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  icon?: React.ReactNode;
}

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  message?: string;
  description?: string;
  action?: EmptyAction;
  secondaryAction?: EmptyAction;
  variant?: EmptyVariant;
  className?: string;
}

const VARIANT_DEFAULTS: Record<EmptyVariant, { icon: React.ReactNode; iconBg: string }> = {
  "no-data": {
    icon: <Database className="w-12 h-12 text-gray-400" />,
    iconBg: "bg-gray-100",
  },
  "no-results": {
    icon: <Search className="w-12 h-12 text-gray-400" />,
    iconBg: "bg-gray-100",
  },
  "no-permissions": {
    icon: <Lock className="w-12 h-12 text-gray-400" />,
    iconBg: "bg-gray-100",
  },
  "error": {
    icon: <RefreshCw className="w-12 h-12 text-red-400" />,
    iconBg: "bg-red-50",
  },
  "default": {
    icon: <Database className="w-12 h-12 text-gray-400" />,
    iconBg: "bg-gray-100",
  },
};

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: IconComponent,
  title,
  message,
  description,
  action,
  secondaryAction,
  variant = "default",
  className = "",
}) => {
  const displayMessage = message || title || "Aucune donnée disponible";
  const displayDescription = description;
  const variantDefaults = VARIANT_DEFAULTS[variant];

  return (
    <div
      className={`flex flex-col items-center justify-center p-12 text-center ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className={`${variantDefaults.iconBg} rounded-full p-6 mb-6`}>
        {IconComponent ? (
          <IconComponent className="w-12 h-12 text-gray-400" />
        ) : (
          variantDefaults.icon
        )}
      </div>

      <h3 className="text-xl font-semibold text-gray-900 mb-2">{displayMessage}</h3>

      {displayDescription && (
        <p className="text-gray-600 mb-6 max-w-md leading-relaxed">{displayDescription}</p>
      )}

      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || "primary"}
              leftIcon={action.icon}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant={secondaryAction.variant || "outline"}
              leftIcon={secondaryAction.icon}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
