import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

export default function HeartbeatCursor() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [velocity, setVelocity] = useState(0);

  useEffect(() => {
    let lastX = 0;
    let lastY = 0;
    let lastTime = Date.now();

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      const dt = now - lastTime;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dt > 10) {
        setVelocity(dist / dt);
        lastX = e.clientX;
        lastY = e.clientY;
        lastTime = now;
      }
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <motion.div
      animate={{
        x: mousePos.x,
        y: mousePos.y,
        scale: 1 + Math.min(velocity * 0.1, 1),
      }}
      transition={{ type: "spring", damping: 20, stiffness: 200, mass: 0.5 }}
      style={{ translateX: '-50%', translateY: '-50%' }}
      className="fixed top-0 left-0 w-8 h-8 pointer-events-none z-[9999] hidden lg:block"
    >
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: Math.max(0.2, 1 - velocity * 0.2),
          repeat: Infinity,
        }}
        className="w-full h-full rounded-full border border-cyan-400/30 bg-cyan-400/5 blur-[2px]"
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-cyan-400 rounded-full" />
    </motion.div>
  );
}
