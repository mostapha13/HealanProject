const defaultMessage = 'خطایی رخ داده است';

export interface ParsedAlert {
  type: 'error' | 'success';
  message: string;
  description?: string;
  status?: number;
}

/** تبدیل پاسخ axios / API به پیام قابل نمایش */
export function parseApiError(error: unknown): ParsedAlert {
  if (typeof error === 'string' && error.trim()) {
    return { type: 'error', message: error };
  }

  if (typeof error === 'object' && error !== null) {
    const direct = error as { type?: string; message?: string; status?: number; data?: unknown };

    if (direct.type === 'error' || direct.type === 'success') {
      return {
        type: direct.type,
        message: direct.message ?? defaultMessage,
        status: direct.status,
      };
    }

    const response = error as { status?: number; data?: Record<string, unknown> };
    const data = response.data;
    if (data) {
      const errors = (data['Errors'] ?? data['errors']) as string[] | string | undefined;
      const validationErrors = data['errors'] as Record<string, string[] | string> | undefined;

      if (Array.isArray(errors) && errors.length > 0 && errors[0]) {
        return { type: 'error', message: String(errors[0]), status: response.status };
      }
      if (typeof errors === 'string' && errors) {
        return { type: 'error', message: errors, status: response.status };
      }
      if (validationErrors && typeof validationErrors === 'object') {
        const firstKey = Object.keys(validationErrors)[0];
        const val = validationErrors[firstKey];
        const message = Array.isArray(val) ? String(val[0]) : String(val);
        if (message) return { type: 'error', message, status: response.status };
      }

      const title = String(data['Title'] ?? data['title'] ?? '');
      if (title && title !== 'The Request Is Not Correct.') {
        return { type: 'error', message: title, status: response.status };
      }
    }

    if (typeof direct.message === 'string' && direct.message) {
      return { type: 'error', message: direct.message, status: direct.status };
    }
  }

  return { type: 'error', message: defaultMessage };
}
