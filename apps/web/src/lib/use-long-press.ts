'use client';

import { useCallback, useRef, useState } from 'react';

interface UseLongPressOptions {
  threshold?: number;
  onLongPress: () => void;
  onClick?: () => void;
}

export function useLongPress({ threshold = 500, onLongPress, onClick }: UseLongPressOptions) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isPressing, setIsPressing] = useState(false);
  const triggeredRef = useRef(false);

  const start = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if ('button' in e && e.button !== 0) return;
      triggeredRef.current = false;
      setIsPressing(true);
      timerRef.current = setTimeout(() => {
        triggeredRef.current = true;
        onLongPress();
        setIsPressing(false);
      }, threshold);
    },
    [threshold, onLongPress],
  );

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPressing(false);
  }, []);

  const end = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if ('button' in e && e.button !== 0) return;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setIsPressing(false);
      if (!triggeredRef.current && onClick) {
        onClick();
      }
    },
    [onClick],
  );

  return {
    isPressing,
    handlers: {
      onMouseDown: start,
      onMouseUp: end,
      onMouseLeave: cancel,
      onTouchStart: start,
      onTouchEnd: end,
    },
  };
}
