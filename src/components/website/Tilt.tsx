import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

type TiltProps = {
  children: React.ReactNode;
  className?: string;
  max?: number;
  scale?: number;
};

export const Tilt: React.FC<TiltProps> = ({ children, className, max = 7, scale = 1.015 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(pointer: fine)');
    setFine(media.matches);
    const handleChange = (event: MediaQueryListEvent) => setFine(event.matches);
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  const enabled = fine && !reduce;

  const handleMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const element = ref.current;
      if (!element || !enabled || event.pointerType === 'touch') return;
      const rect = element.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const rx = (0.5 - py) * max;
      const ry = (px - 0.5) * max;
      element.style.setProperty('--rr-tilt-x', `${rx.toFixed(2)}deg`);
      element.style.setProperty('--rr-tilt-y', `${ry.toFixed(2)}deg`);
    },
    [enabled, max]
  );

  const handleLeave = useCallback(() => {
    const element = ref.current;
    if (!element) return;
    element.style.setProperty('--rr-tilt-x', '0deg');
    element.style.setProperty('--rr-tilt-y', '0deg');
  }, []);

  return (
    <div
      ref={ref}
      className={`rr-tilt ${className ?? ''}`}
      style={{ '--rr-tilt-scale': scale } as React.CSSProperties}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      {children}
    </div>
  );
};

export default Tilt;