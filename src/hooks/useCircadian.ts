import { useState, useEffect } from 'react';

export type CircadianPhase = 'morning' | 'afternoon' | 'evening' | 'night';

export function useCircadian() {
  const [phase, setPhase] = useState<CircadianPhase>('morning');

  useEffect(() => {
    const updatePhase = () => {
      const hour = new Date().getHours();
      
      if (hour >= 5 && hour < 11) setPhase('morning');
      else if (hour >= 11 && hour < 17) setPhase('afternoon');
      else if (hour >= 17 && hour < 21) setPhase('evening');
      else setPhase('night');
    };

    updatePhase();
    const interval = setInterval(updatePhase, 1000 * 60 * 15); // Update every 15 mins
    return () => clearInterval(interval);
  }, []);

  return phase;
}
