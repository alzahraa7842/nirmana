import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CloudRain, 
  Trees, 
  Wind, 
  Flame, 
  Volume2, 
  Play, 
  Pause, 
  Music2,
  Waves,
  Timer,
  Heart,
  Check
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useProceduralAudio, SoundscapeType } from '../hooks/useProceduralAudio';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const SOUNDSCAPES = [
  { 
    id: 'rain' as SoundscapeType, 
    name: 'Hujan Refleksi', 
    desc: 'Suara rintik hujan lembut untuk menenangkan pikiran yang kalut.',
    icon: CloudRain,
    color: 'from-blue-500/20 to-cyan-500/20'
  },
  { 
    id: 'forest' as SoundscapeType, 
    name: 'Hutan Keheningan', 
    desc: 'Resonansi frekuensi rendah hutan yang dalam dan damai.',
    icon: Trees,
    color: 'from-emerald-500/20 to-teal-500/20'
  },
  { 
    id: 'wind' as SoundscapeType, 
    name: 'Angin Kintsugi', 
    desc: 'Aliran udara yang mengalir melalui retakan untuk kesadaran diri.',
    icon: Wind,
    color: 'from-cyan-glow/20 to-indigo-500/20'
  },
  { 
    id: 'echo' as SoundscapeType, 
    name: 'Gema Jiwa', 
    desc: 'Frekuensi harmoni untuk memperdalam latihan meditasi Anda.',
    icon: Music2,
    color: 'from-purple-500/20 to-rose-500/20'
  }
];

const TIMER_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '5m', value: 5 },
  { label: '15m', value: 15 },
  { label: '30m', value: 30 },
  { label: '60m', value: 60 },
];

export default function ZenSoundscape() {
  const { play, stop, stopAll, activeTypes, volumes, setVolume } = useProceduralAudio();
  const [sleepTimer, setSleepTimer] = useState<number>(0); 
  const [timeLeft, setTimeLeft] = useState<number>(0); 
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showTimerOptions, setShowTimerOptions] = useState(false);
  const [showSleepNotification, setShowSleepNotification] = useState(false);

  const calculateTotalVolume = () => {
    if (activeTypes.size === 0) return 0;
    let sum = 0;
    activeTypes.forEach(type => {
      sum += volumes[type];
    });
    return sum / activeTypes.size;
  };
  const totalVolume = calculateTotalVolume();
  const isPlaying = activeTypes.size > 0;

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timeLeft > 0 && isPlaying) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            stopAll();
            setSleepTimer(0);
            setShowSleepNotification(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timeLeft, isPlaying, stopAll]);

  const handleSetTimer = (minutes: number) => {
    setSleepTimer(minutes);
    setTimeLeft(minutes * 60);
    setShowTimerOptions(false);
    setShowSleepNotification(false);
  };

  const handleSaveFavorite = async () => {
    if (!auth.currentUser || activeTypes.size === 0) return;
    
    setIsSaving(true);
    const favoritesPath = `users/${auth.currentUser.uid}/favorites`;
    try {
      const activeVolumes: Record<string, number> = {};
      activeTypes.forEach(type => {
        activeVolumes[type] = volumes[type];
      });

      await addDoc(collection(db, favoritesPath), {
        type: 'soundscape',
        activeTypes: Array.from(activeTypes),
        volumes: activeVolumes,
        createdAt: serverTimestamp(),
        name: `Suasana ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, favoritesPath);
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (showSleepNotification) {
      const timeout = setTimeout(() => setShowSleepNotification(false), 5000);
      return () => clearTimeout(timeout);
    }
  }, [showSleepNotification]);

  return (
    <div className="h-full flex flex-col space-y-8 max-w-5xl mx-auto relative">
      <AnimatePresence>
        {showSleepNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-deep-slate border border-cyan-glow/30 rounded-2xl shadow-[0_0_30px_rgba(0,242,255,0.2)] flex items-center gap-3"
          >
            <Timer className="text-cyan-glow" size={18} />
            <span className="text-xs uppercase tracking-widest text-cyan-glow/80 font-medium">
              Sesi Berakhir: Tidur Nyenyak
            </span>
            <button 
              onClick={() => setShowSleepNotification(false)}
              className="ml-2 text-slate-500 hover:text-white transition-colors"
            >
              <Check size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center">
        <h2 className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-2">Suasana Alam Zen</h2>
        <h1 className="text-4xl font-light text-white tracking-tight">Kurasikan Kedamaian Anda</h1>
        <p className="text-slate-500 mt-3 font-light">Gunakan generator audio prosedural kami untuk menciptakan ruang fokus yang unik.</p>
      </div>

      {/* Visualizer Display */}
      <div className="relative h-48 glass-panel flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center gap-1">
          {[...Array(40)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                height: isPlaying ? [10, Math.random() * 80 + 20, 10] : 4,
                opacity: isPlaying ? [0.2, 0.6, 0.2] : 0.1
              }}
              transition={{
                duration: 0.5 + Math.random(),
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-1 bg-cyan-glow rounded-full"
            />
          ))}
        </div>
        <div className="relative z-10 flex flex-col items-center">
          <Waves className={cn("text-cyan-glow transition-all duration-500", isPlaying ? "scale-110 opacity-100" : "opacity-20")} size={48} />
          <span className="text-[10px] uppercase tracking-[0.4em] text-cyan-glow/60 mt-4">
            {isPlaying ? "Transmisi Frekuensi Aktif" : "Menunggu Frekuensi"}
          </span>
        </div>
      </div>

      {/* Soundscape Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SOUNDSCAPES.map((sound) => (
          <div key={sound.id} className="relative group">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => play(sound.id)}
              className={cn(
                "w-full text-left p-8 rounded-[2rem] border transition-all duration-500 overflow-hidden",
                activeTypes.has(sound.id) 
                  ? "bg-white/10 border-cyan-glow/50 shadow-[0_0_40px_rgba(0,242,255,0.15)]" 
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              )}
            >
              {/* Background Gradient */}
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-40 transition-opacity", sound.color)} />
              
              <div className="relative z-10 flex items-start gap-6">
                <div className={cn(
                  "p-4 rounded-2xl border transition-all duration-500",
                  activeTypes.has(sound.id) 
                    ? "bg-cyan-glow text-deep-slate border-cyan-glow" 
                    : "bg-white/5 text-slate-400 border-white/10"
                )}>
                  <sound.icon size={24} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xl text-white font-light">{sound.name}</h3>
                    {activeTypes.has(sound.id) && (
                      <motion.div 
                        layoutId={`active-indicator-${sound.id}`}
                        className="w-2 h-2 rounded-full bg-cyan-glow shadow-[0_0_8px_rgba(0,242,255,0.8)]"
                      />
                    )}
                  </div>
                  <p className="text-sm text-slate-500 font-light leading-relaxed">
                    {sound.desc}
                  </p>
                </div>
  
                <div className="self-center">
                  <div className={cn(
                    "p-3 rounded-full transition-all duration-300",
                    activeTypes.has(sound.id) ? "text-cyan-glow bg-cyan-glow/20" : "text-slate-600"
                  )}>
                    {activeTypes.has(sound.id) ? <Pause size={20} /> : <Play size={20} />}
                  </div>
                </div>
              </div>
            </motion.button>
            
            {/* Volume Slider for Active Soundscape */}
            <AnimatePresence>
              {activeTypes.has(sound.id) && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="px-8 pb-6 bg-white/10 rounded-b-[2rem] border-x border-b border-cyan-glow/30 -mt-8 pt-12 relative z-0"
                >
                  <div className="flex items-center gap-4">
                    <Volume2 size={14} className="text-cyan-glow/50" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volumes[sound.id]}
                      onChange={(e) => setVolume(sound.id, parseFloat(e.target.value))}
                      className="flex-1 accent-cyan-glow bg-white/5 rounded-full h-1 appearance-none cursor-pointer"
                    />
                    <span className="text-[10px] tabular-nums font-mono text-cyan-glow/70 min-w-[3ch]">
                      {Math.round(volumes[sound.id] * 100)}%
                    </span>
                  </div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-500 mt-2 text-center">Volume {sound.name}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Control Panel */}
      <GlassCard className="mt-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 py-2">
          <div className="flex items-center gap-6">
             <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400">
                <Volume2 size={24} />
             </div>
             <div>
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-glow/60 mb-2 font-medium">Total Intensitas</p>
                <div className="w-48 md:w-64 h-1.5 bg-white/5 rounded-full overflow-hidden">
                   <motion.div 
                    animate={{ width: `${totalVolume * 100}%` }}
                    className="h-full bg-cyan-glow shadow-[0_0_15px_rgba(0,242,255,0.6)]" 
                   />
                </div>
             </div>
          </div>

          <div className="flex gap-4 relative">
             <div className="relative">
                <button 
                  onClick={() => setShowTimerOptions(!showTimerOptions)}
                  className={cn(
                    "px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs uppercase tracking-widest transition-all flex items-center gap-2",
                    timeLeft > 0 ? "text-cyan-glow border-cyan-glow/30" : "text-slate-300"
                  )}
                >
                  <Timer size={14} className={cn(timeLeft > 0 && "animate-pulse")} />
                  {timeLeft > 0 ? formatTime(timeLeft) : "Pewaktu Tidur"}
                </button>

                <AnimatePresence>
                  {showTimerOptions && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-full mb-4 left-0 bg-deep-slate border border-white/10 rounded-2xl p-2 w-32 shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="grid gap-1">
                        {TIMER_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => handleSetTimer(opt.value)}
                            className={cn(
                              "w-full py-2 px-4 text-[10px] uppercase tracking-widest text-left rounded-xl transition-colors",
                              sleepTimer === opt.value ? "bg-cyan-glow text-deep-slate" : "text-slate-400 hover:bg-white/5"
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>

             <button 
              onClick={handleSaveFavorite}
              disabled={isSaving || activeTypes.size === 0}
              className={cn(
                "px-6 py-3 border rounded-full text-xs uppercase tracking-widest transition-all flex items-center gap-2 min-w-[180px] justify-center",
                saveSuccess 
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" 
                  : "bg-cyan-glow text-deep-slate border-cyan-glow shadow-xl hover:scale-105 disabled:opacity-30 disabled:grayscale"
              )}
             >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-deep-slate/30 border-t-deep-slate animate-spin rounded-full" />
                ) : saveSuccess ? (
                  <Check size={14} />
                ) : (
                  <Heart size={14} />
                )}
                {saveSuccess ? "Tersimpan" : "Simpan Ke Favorit"}
             </button>
          </div>
        </div>
      </GlassCard>

      <div className="text-center pb-8">
        <p className="text-slate-500 text-xs font-light italic">
          “Suara adalah getaran yang mengembalikan jiwa ke pusatnya.”
        </p>
      </div>
    </div>
  );
}

function GlassCard({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("glass-panel p-6 md:p-10", className)}>
      {children}
    </div>
  );
}
