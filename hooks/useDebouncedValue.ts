import { useEffect, useState } from 'react';

/**
 * Tunda propagasi nilai hingga pengguna berhenti mengetik selama `delayMs`.
 * Dipakai untuk pencarian agar filter tidak dihitung ulang di setiap ketukan.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs, value]);

  return debounced;
}

export default useDebouncedValue;
