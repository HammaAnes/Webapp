import React, { useState, useCallback } from "react";
import { logger } from "../utils/logger";

interface ValidationRule {
  required?: boolean | string;
  minLength?: { value: number; message: string };
  maxLength?: { value: number; message: string };
  pattern?: { value: RegExp; message: string };
  validate?: (value: unknown) => string | boolean | undefined;
}

interface FormConfig<T> {
  initialValues: T;
  validationRules?: Partial<Record<keyof T, ValidationRule>>;
  onSubmit: (values: T) => void | Promise<void>;
}

interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
}

export function useForm<T extends Record<string, unknown>>({
  initialValues,
  validationRules = {},
  onSubmit,
}: FormConfig<T>) {
  const [formState, setFormState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
  });

  const validateField = useCallback(
    (name: keyof T, value: unknown): string | undefined => {
      const rules = validationRules[name];
      if (!rules) return undefined;

      if (rules.required) {
        const message =
          typeof rules.required === "string"
            ? rules.required
            : "Ce champ est requis";
        if (!value || (typeof value === "string" && !value.trim())) {
          return message;
        }
      }

      if (rules.minLength && typeof value === "string") {
        if (value.length < rules.minLength.value) {
          return rules.minLength.message;
        }
      }

      if (rules.maxLength && typeof value === "string") {
        if (value.length > rules.maxLength.value) {
          return rules.maxLength.message;
        }
      }

      if (rules.pattern && typeof value === "string") {
        if (!rules.pattern.value.test(value)) {
          return rules.pattern.message;
        }
      }

      if (rules.validate) {
        const result = rules.validate(value);
        if (typeof result === "string") return result;
        return undefined;
      }

      return undefined;
    },
    [validationRules]
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(validationRules).forEach((key) => {
      const fieldName = key as keyof T;
      const error = validateField(fieldName, formState.values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setFormState((prev) => ({ ...prev, errors: newErrors }));
    return isValid;
  }, [formState.values, validateField, validationRules]);

  const handleChange = useCallback(
    (name: keyof T) =>
      (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | unknown
      ) => {
        const value = (e as React.ChangeEvent<HTMLInputElement>)?.target?.value ?? e;

        setFormState((prev) => ({
          ...prev,
          values: { ...prev.values, [name]: value },
          errors: { ...prev.errors, [name]: undefined },
        }));
      },
    []
  );

  const handleBlur = useCallback(
    (name: keyof T) => () => {
      setFormState((prev) => {
        const error = validateField(name, prev.values[name]);
        return {
          ...prev,
          touched: { ...prev.touched, [name]: true },
          errors: error ? { ...prev.errors, [name]: error } : prev.errors,
        };
      });
    },
    [validateField]
  );

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      const allTouched = Object.keys(formState.values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as Partial<Record<keyof T, boolean>>
      );

      setFormState((prev) => ({ ...prev, touched: allTouched }));

      if (!validateForm()) {
        return;
      }

      setFormState((prev) => ({ ...prev, isSubmitting: true }));

      try {
        await onSubmit(formState.values);
      } catch (error) {
        logger.error("Form submission error:", error instanceof Error ? error.message : String(error));
      } finally {
        setFormState((prev) => ({ ...prev, isSubmitting: false }));
      }
    },
    [formState.values, onSubmit, validateForm]
  );

  const setFieldValue = useCallback((name: keyof T, value: unknown) => {
    setFormState((prev) => ({
      ...prev,
      values: { ...prev.values, [name]: value },
      errors: { ...prev.errors, [name]: undefined },
    }));
  }, []);

  const setFieldError = useCallback((name: keyof T, error: string) => {
    setFormState((prev) => ({
      ...prev,
      errors: { ...prev.errors, [name]: error },
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormState({
      values: initialValues,
      errors: {},
      touched: {},
      isSubmitting: false,
    });
  }, [initialValues]);

  const getFieldProps = useCallback(
    (name: keyof T) => ({
      value: formState.values[name] ?? "",
      onChange: handleChange(name),
      onBlur: handleBlur(name),
      error: formState.touched[name] ? formState.errors[name] : undefined,
    }),
    [formState, handleChange, handleBlur]
  );

  return {
    values: formState.values,
    errors: formState.errors,
    touched: formState.touched,
    isSubmitting: formState.isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    resetForm,
    getFieldProps,
  };
}
