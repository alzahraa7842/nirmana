import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Reaction {
  id: number;
  text: string;
  x: number;
  y: number;
  color?: string;
}

export interface FloatingReactionsRef {
  add: (text: string) => void;
}

const FloatingReactions = forwardRef<FloatingReactionsRef>((_, ref) => {
  const [reactions, setReactions] = useState<Reaction[]>([]);

  const add = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    
    // Spread more widely across the screen
    const x = 20 + Math.random() * 60; // 20% to 80%
    const y = 30 + Math.random() * 40; // 30% to 70%
    
    setReactions(prev => [...prev, { id, text, x, y }]);
    
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    }, 4000);
  }, []);

  useImperativeHandle(ref, () => ({
    add
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      <AnimatePresence>
        {reactions.map((r) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, scale: 0.5, y: `${r.y}%`, x: `${r.x}%` }}
            animate={{ 
              opacity: [0, 1, 1, 0], 
              y: [`${r.y}%`, `${r.y - 15}%`],
              scale: [0.5, 1, 1.1, 0.9],
              filter: ["blur(10px)", "blur(0px)", "blur(0px)", "blur(5px)"]
            }}
            transition={{ duration: 3.5, ease: "easeInOut" }}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          >
            <div className="relative group">
              <span className="text-cyan-glow font-light tracking-[0.4em] text-xl md:text-3xl whitespace-nowrap drop-shadow-[0_0_20px_rgba(0,242,255,0.7)] mix-blend-screen italic">
                {r.text}
              </span>
              <div className="absolute inset-0 bg-cyan-glow/5 blur-3xl -z-10 rounded-full scale-150 animate-pulse" />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});

FloatingReactions.displayName = 'FloatingReactions';

export default FloatingReactions;
