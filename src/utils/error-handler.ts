import toast from "react-hot-toast";
import { logger } from "./logger";

export enum ErrorCode {
  NETWORK_ERROR = "NETWORK_ERROR",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  SERVER_ERROR = "SERVER_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export class AppError extends Error {
  code: ErrorCode;
  details?: unknown;

  constructor(message: string, code: ErrorCode = ErrorCode.UNKNOWN_ERROR, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
  }
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: ErrorCode;
  details?: unknown;
}

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

export function isErrorResponse(response: ApiResponse): response is ErrorResponse {
  return !response.success;
}

export function isSuccessResponse<T>(response: ApiResponse<T>): response is SuccessResponse<T> {
  return response.success === true;
}

export function handleApiError(error: unknown, context?: string): AppError {
  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Error) {
    appError = new AppError(error.message, ErrorCode.UNKNOWN_ERROR);
  } else if (typeof error === "string") {
    appError = new AppError(error, ErrorCode.UNKNOWN_ERROR);
  } else {
    appError = new AppError("Une erreur inconnue s'est produite", ErrorCode.UNKNOWN_ERROR);
  }

  const logMessage = context ? `${context}: ${appError.message}` : appError.message;
  logger.error(logMessage, { code: appError.code, details: appError.details });

  return appError;
}

export function showErrorToast(error: unknown, defaultMessage?: string) {
  const appError = error instanceof AppError ? error : handleApiError(error);
  toast.error(appError.message || defaultMessage || "Une erreur s'est produite");
}

export function showSuccessToast(message: string) {
  toast.success(message);
}

export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  options: {
    successMessage?: string;
    errorMessage?: string;
    context?: string;
    onSuccess?: (result: T) => void;
    onError?: (error: AppError) => void;
  } = {}
): Promise<T | null> {
  try {
    const result = await operation();

    if (options.successMessage) {
      showSuccessToast(options.successMessage);
    }

    if (options.onSuccess) {
      options.onSuccess(result);
    }

    return result;
  } catch (error) {
    const appError = handleApiError(error, options.context);

    if (options.errorMessage) {
      showErrorToast(appError, options.errorMessage);
    }

    if (options.onError) {
      options.onError(appError);
    }

    return null;
  }
}

export function createErrorResponse(
  error: string,
  code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
  details?: unknown
): ErrorResponse {
  return {
    success: false,
    error,
    code,
    details,
  };
}

export function createSuccessResponse<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data,
  };
}
