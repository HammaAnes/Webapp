import React from "react";
import { cn } from "../../design/variants";

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  className?: string;
}

const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ children, onSubmit, className, ...props }, ref) => {
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      await onSubmit(e);
    };

    return (
      <form
        ref={ref}
        onSubmit={handleSubmit}
        noValidate
        className={cn("space-y-6", className)}
        {...props}
      >
        {children}
      </form>
    );
  }
);

Form.displayName = "Form";

interface FormSectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  children,
  title,
  description,
  className,
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
};

interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}

export const FormActions: React.FC<FormActionsProps> = ({
  children,
  className,
  align = "right",
}) => {
  const alignClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 pt-6 border-t border-gray-200",
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  );
};

interface FormRowProps {
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
}

export const FormRow: React.FC<FormRowProps> = ({
  children,
  className,
  columns = 2,
}) => {
  const columnClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", columnClasses[columns], className)}>
      {children}
    </div>
  );
};

export default Form;
