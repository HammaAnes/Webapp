import React from "react";
import { LucideIcon, Inbox } from "lucide-react";
import Button from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  message?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  description,
  action,
  className = "",
}) => {
  const displayMessage = message || title || "Aucune donnée disponible";
  const displayDescription = description;

  return (
    <div
      className={`flex flex-col items-center justify-center p-12 text-center ${className}`}
    >
      {icon && (
        <div className="bg-gray-100 rounded-full p-6 mb-6">
          {typeof icon === 'function' ? (
            React.createElement(icon as LucideIcon, { className: "w-12 h-12 text-gray-400" })
          ) : (
            icon
          )}
        </div>
      )}

      <h3 className="text-xl font-semibold text-gray-900 mb-2">{displayMessage}</h3>

      {displayDescription && (
        <p className="text-gray-600 mb-6 max-w-md">{displayDescription}</p>
      )}

      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
};

export default EmptyState;
