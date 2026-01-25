import { PostgrestError } from '@supabase/supabase-js';

/**
 * Custom API Error class for handling Supabase errors
 * Provides Arabic error messages for better UX
 */
export class ApiError extends Error {
  public readonly code: string;
  public readonly status?: number;
  public readonly details?: string;

  constructor(error: PostgrestError | Error | unknown) {
    if (isPostgrestError(error)) {
      super(getArabicErrorMessage(error.code));
      this.code = error.code;
      this.details = error.details;
      this.name = 'ApiError';
    } else if (error instanceof Error) {
      super(error.message);
      this.code = 'UNKNOWN';
      this.name = 'ApiError';
    } else {
      super('حدث خطأ غير متوقع');
      this.code = 'UNKNOWN';
      this.name = 'ApiError';
    }
  }
}

/**
 * Type guard to check if error is a Postgrest error
 */
function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
}

/**
 * Maps Postgrest error codes to Arabic error messages
 */
function getArabicErrorMessage(code: string): string {
  const errorMessages: Record<string, string> = {
    // Constraint violations
    '23505': 'هذا السجل موجود بالفعل',
    '23503': 'لا يمكن الحذف - يوجد بيانات مرتبطة',
    '23502': 'بيانات ناقصة - يرجى ملء جميع الحقول المطلوبة',
    '23514': 'القيمة المدخلة غير صالحة',

    // Permission errors
    '42501': 'غير مصرح لك بهذه العملية',
    '42P01': 'الجدول غير موجود',

    // Not found
    'PGRST116': 'السجل غير موجود',
    'PGRST301': 'السجل غير موجود',

    // Validation errors
    '22P02': 'نوع البيانات غير صحيح',
    '22003': 'القيمة خارج النطاق المسموح',

    // Connection errors
    'PGRST001': 'خطأ في الاتصال بقاعدة البيانات',
    'PGRST003': 'انتهت صلاحية الجلسة - يرجى تسجيل الدخول مرة أخرى',
  };

  return errorMessages[code] || 'حدث خطأ في العملية';
}

/**
 * Handles errors from async operations and returns user-friendly message
 */
export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (isPostgrestError(error)) {
    return getArabicErrorMessage(error.code);
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'حدث خطأ غير متوقع';
}

/**
 * Type guard for checking if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('Failed to fetch') ||
      error.message.includes('Network request failed') ||
      error.message.includes('NetworkError')
    );
  }
  return false;
}

/**
 * Type guard for checking if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (isPostgrestError(error)) {
    return error.code === '42501' || error.code === 'PGRST003';
  }
  return false;
}
