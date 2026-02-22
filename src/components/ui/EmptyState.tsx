import React from "react";
import { LucideIcon } from "lucide-react";
import Button from "./Button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-12 text-center ${className}`}
    >
      <div className="bg-gray-100 rounded-full p-6 mb-6">
        <Icon className="w-12 h-12 text-gray-400" />
      </div>

      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>

      {description && (
        <p className="text-gray-600 mb-6 max-w-md">{description}</p>
      )}

      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
};

export default EmptyState;
