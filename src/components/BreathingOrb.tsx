import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface BreathingOrbProps {
  className?: string;
  isBreathing?: boolean;
  intensity?: number;
  step?: 'inhale' | 'hold' | 'exhale' | 'ready';
}

export default function BreathingOrb({ 
  className, 
  isBreathing = true, 
  intensity = 0,
  step = 'ready'
}: BreathingOrbProps) {
  const intensityFactor = intensity / 100;
  
  // Dynamic colors based on intensity
  const orbColor = intensity > 50 ? "rgba(0, 242, 255, 0.2)" : "rgba(0, 242, 255, 0.1)";
  const glowColor = intensity > 70 ? "rgba(0, 242, 255, 0.5)" : "rgba(0, 242, 255, 0.2)";

  return (
    <div 
      className={cn("relative flex items-center justify-center w-[400px] h-[400px]", className)}
      role="img"
      aria-label="Orbit pernapasan yang berdenyut untuk memandu ritme napas Anda"
    >
      {/* Persistent Tooltip / Guide explaining current step */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none w-72 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="bg-deep-slate/95 backdrop-blur-xl border border-cyan-glow/30 px-4 py-2.5 rounded-2xl shadow-[0_0_25px_rgba(0,242,255,0.15)] inline-block w-full"
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-cyan-glow font-bold uppercase tracking-[0.25em] drop-shadow-[0_0_8px_rgba(0,242,255,0.3)]">
                {step === 'ready' ? 'Persiapan' : step === 'inhale' ? 'Fase Hirup (Inhalasi)' : step === 'hold' ? 'Fase Tahan (Retensi)' : 'Fase Hembus (Ekshalasi)'}
              </span>
              <p className="text-[11px] leading-relaxed text-slate-300 font-light">
                {step === 'ready' && "Atur posisi duduk tegak, rilekskan bahu, dan bersiaplah."}
                {step === 'inhale' && "Hirup udara perlahan melalui hidung. Rasakan kesegaran mengalir."}
                {step === 'hold' && "Tahan dengan tenang dalam damai. Nikmati keheningan batin."}
                {step === 'exhale' && "Hembuskan perlahan lewat mulut, lepaskan semua kepenatan jiwa."}
              </p>
            </div>
            {/* Tooltip Arrow */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-deep-slate/95 rotate-45 border-r border-b border-cyan-glow/20" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Aurora Background for Orb */}
      <motion.div 
        animate={{
          opacity: 0.3 + (intensityFactor * 0.4),
          scale: 1 + (intensityFactor * 0.2),
        }}
        className="absolute inset-0 bg-radial-gradient from-cyan-glow/10 to-transparent rounded-full blur-3xl" 
      />

      {/* Gold Kintsugi Lines */}
      <div className="absolute w-full h-[1px] bg-gold/20 rotate-[15deg] top-[30%] pointer-events-none" />
      <div className="absolute w-[1px] h-[40%] bg-gold/15 left-[60%] top-[10%] pointer-events-none" />
      
      {/* Outer Breathing Layer */}
      <motion.div
        animate={isBreathing ? {
          scale: [0.8, 1.1 + (intensityFactor * 0.2), 0.8],
          opacity: [0.1, 0.3 + (intensityFactor * 0.3), 0.1],
          borderColor: intensity > 60 ? glowColor : "rgba(0,242,255,0.3)"
        } : {}}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-72 h-72 border border-cyan-glow/30 rounded-full"
      />

      {/* Main Theme Orb */}
      <motion.div
        animate={isBreathing ? {
          scale: [0.95, 1.05 + (intensityFactor * 0.1), 0.95],
          backgroundColor: orbColor,
          borderColor: glowColor,
          boxShadow: [
            `0 0 ${40 + (intensityFactor * 40)}px rgba(0,242,255,${0.05 + (intensityFactor * 0.1)}), inset 0 0 20px rgba(0,242,255,0.05)`,
            `0 0 ${80 + (intensityFactor * 80)}px rgba(0,242,255,${0.2 + (intensityFactor * 0.3)}), inset 0 0 40px rgba(0,242,255,0.2)`,
            `0 0 ${40 + (intensityFactor * 40)}px rgba(0,242,255,${0.05 + (intensityFactor * 0.1)}), inset 0 0 20px rgba(0,242,255,0.05)`
          ]
        } : {}}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-64 h-64 rounded-full bg-radial-gradient from-cyan-glow/10 to-transparent border border-cyan-glow/20 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-8"
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20">
        </div>
      </motion.div>
      
      {/* Intensity-driven Particle Effect */}
      {intensity > 10 && [...Array(Math.floor(intensity / 5))].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{
            x: (Math.random() - 0.5) * 300,
            y: (Math.random() - 0.5) * 300,
            opacity: [0, 0.6, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
          className="absolute w-1.5 h-1.5 bg-cyan-400 rounded-full blur-[1px]"
        />
      ))}

      {/* Floating Soul Sparks (Original) */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 0.4, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 4 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 4,
          }}
          className="absolute w-1 h-1 bg-white rounded-full blur-[1px]"
          style={{
            left: `${20 + Math.random() * 60}%`,
            top: `${20 + Math.random() * 60}%`,
          }}
        />
      ))}
    </div>
  );
}
