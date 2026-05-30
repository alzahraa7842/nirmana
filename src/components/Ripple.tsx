import React, { useState, useCallback, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface RippleData {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface RippleProps {
  color?: string; // custom tailwind color or rgba
  duration?: number;
}

export function Ripple({ color = 'rgba(0, 242, 255, 0.35)', duration = 0.6 }: RippleProps) {
  const [ripples, setRipples] = useState<RippleData[]>([]);

  useLayoutEffect(() => {
    const parent = document.getElementById('ripple-container');
    // We can clean up if needed, but managing local state is simpler by capturing clicking on the actual parent
  }, []);

  // Public method to trigger ripple
  const trigger = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const newRipple: RippleData = {
      id: Date.now() + Math.random(),
      x,
      y,
      size,
    };

    setRipples((prev) => [...prev, newRipple]);

    // Clean up
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, duration * 1000 + 100);
  }, [duration]);

  return {
    trigger,
    ripplesElement: (
      <span className="absolute inset-0 block overflow-hidden rounded-[inherit] pointer-events-none z-0">
        <AnimatePresence>
          {ripples.map((ripple) => (
            <motion.span
              key={ripple.id}
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ 
                scale: 1, 
                opacity: 0,
                transition: { duration, ease: [0.1, 0.8, 0.3, 1] }
              }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                top: ripple.y,
                left: ripple.x,
                width: ripple.size,
                height: ripple.size,
                borderRadius: '50%',
                background: color,
                pointerEvents: 'none',
              }}
            />
          ))}
        </AnimatePresence>
      </span>
    )
  };
}

export default Ripple;
