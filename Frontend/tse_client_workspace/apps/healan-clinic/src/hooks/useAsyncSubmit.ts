import { useCallback, useState } from 'react';

/** Prevents duplicate API calls while a submit handler is in flight. */
export function useAsyncSubmit() {
  const [submitting, setSubmitting] = useState(false);

  const guard = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
      if (submitting) return undefined;
      setSubmitting(true);
      try {
        return await fn();
      } finally {
        setSubmitting(false);
      }
    },
    [submitting]
  );

  return { submitting, guard };
}
