import React from "react";
import { AlertTriangle, XCircle, Info, AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  title?: string;
  message: string;
  type?: "error" | "warning" | "info" | "danger";
  onClose?: () => void;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  type = "error",
  onClose,
  className = "",
}) => {
  const styles = {
    error: {
      bg: "bg-red-50 border-red-200",
      text: "text-red-800",
      icon: XCircle,
      iconColor: "text-red-500",
    },
    warning: {
      bg: "bg-yellow-50 border-yellow-200",
      text: "text-yellow-800",
      icon: AlertTriangle,
      iconColor: "text-yellow-500",
    },
    info: {
      bg: "bg-blue-50 border-blue-200",
      text: "text-blue-800",
      icon: Info,
      iconColor: "text-blue-500",
    },
    danger: {
      bg: "bg-red-50 border-red-200",
      text: "text-red-800",
      icon: AlertCircle,
      iconColor: "text-red-500",
    },
  };

  const style = styles[type];
  const Icon = style.icon;

  return (
    <div className={`${style.bg} border rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${style.iconColor}`} />

        <div className="flex-1">
          {title && (
            <h4 className={`font-semibold mb-1 ${style.text}`}>{title}</h4>
          )}
          <p className={style.text}>{message}</p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className={`${style.text} hover:opacity-70 transition-opacity`}
          >
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
