import { useCallback, useEffect, useRef, useState } from 'react';

// A short message that fades out on its own.
export default function useToast(duration = 2200) {
  const [toast, setToast] = useState({ message: '', visible: false });
  const timer = useRef();

  const show = useCallback((message) => {
    setToast({ message, visible: true });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), duration);
  }, [duration]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return [toast, show];
}
