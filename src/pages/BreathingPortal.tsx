import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Wind, Play, Pause, RefreshCw, Volume2, VolumeX, Mic, MicOff, Award, CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import BreathingOrb from '../components/BreathingOrb';
import { useBreathDetection } from '../hooks/useBreathDetection';
import FloatingReactions, { FloatingReactionsRef } from '../components/FloatingReactions';
import { Ripple } from '../components/Ripple';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import confetti from 'canvas-confetti';

export default function BreathingPortal() {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [isMicMode, setIsMicMode] = useState(false);
  const [step, setStep] = useState<'inhale' | 'hold' | 'exhale' | 'ready'>('ready');
  const [timer, setTimer] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const reactionsRef = useRef<FloatingReactionsRef>(null);

  // Tracking user breathing session progress
  const [completedCycles, setCompletedCycles] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Stats for the current and previous session resonance values
  const [previousSessionScore, setPreviousSessionScore] = useState<number>(80);
  const [currentResonanceScore, setCurrentResonanceScore] = useState<number | null>(null);

  const mainRipple = Ripple({ color: 'rgba(0, 242, 255, 0.45)', duration: 0.6 });
  const micRipple = Ripple({ color: 'rgba(0, 242, 255, 0.25)', duration: 0.5 });
  const resetRipple = Ripple({ color: 'rgba(255, 255, 255, 0.2)', duration: 0.5 });

  // Get previous session resonance score on initialization
  useEffect(() => {
    if (!auth.currentUser) {
      const stored = localStorage.getItem('last_breathing_resonance_score');
      if (stored) setPreviousSessionScore(parseInt(stored, 10));
      return;
    }
    const fetchPrev = async () => {
      try {
        const stored = localStorage.getItem('last_breathing_resonance_score');
        if (stored) {
          setPreviousSessionScore(parseInt(stored, 10));
          return;
        }

        const statsPath = `users/${auth.currentUser.uid}/stats/current`;
        const snap = await getDoc(doc(db, statsPath));
        if (snap.exists()) {
          const data = snap.data();
          if (data.breathingScore) {
            setPreviousSessionScore(data.breathingScore);
          }
        }
      } catch (err) {
        console.error("Gagal mengambil data sesi sebelumnya:", err);
      }
    };
    fetchPrev();
  }, []);

  
  const { intensity, isCalibrated, startDetection, stopDetection } = useBreathDetection();

  // Menampilkan pemberitahuan/toast visual yang halus
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Memperbarui stats di Firestore secara kumulatif
  const incrementStats = async (bScoreIncrease: number, gBloomIncrease: number) => {
    if (!auth.currentUser) return { newBScore: 0, newGBloom: 0 };
    try {
      const statsPath = `users/${auth.currentUser.uid}/stats/current`;
      const snap = await getDoc(doc(db, statsPath));
      let currentBScore = 0;
      let currentGBloom = 0;
      let emotionalWeather = 'Suasana Hati Selaras';

      if (snap.exists()) {
        const data = snap.data();
        currentBScore = data.breathingScore || 0;
        currentGBloom = data.gardenBloom || 0;
        emotionalWeather = data.emotionalWeather || emotionalWeather;
      }

      // Hitung skor baru, maksimal 100
      const newBScore = Math.min(100, currentBScore + bScoreIncrease);
      const newGBloom = Math.min(100, currentGBloom + gBloomIncrease);

      await setDoc(doc(db, statsPath), {
        breathingScore: newBScore,
        gardenBloom: newGBloom,
        lastUpdated: serverTimestamp(),
        emotionalWeather
      }, { merge: true });

      return { newBScore, newGBloom };
    } catch (err) {
      console.error("Gagal meningkatkan stats: ", err);
      return { newBScore: 0, newGBloom: 0 };
    }
  };

  useEffect(() => {
    let interval: number;
    if (isActive) {
      interval = window.setInterval(() => {
        setTimer(prev => {
          const next = Number((prev + 0.1).toFixed(1));
          return next > 16 ? 0 : next;
        });
      }, 100);
    } else {
      if (timer > 0) {
        setStep('ready');
        setTimer(0);
      }
    }
    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    if (timer <= 4) setStep('inhale');
    else if (timer <= 8) setStep('hold');
    else if (timer <= 12) setStep('exhale');
    else setStep('hold');

    if (timer === 16) {
      // Completed a cycle
      setCompletedCycles(prev => {
        const next = prev + 1;
        // Pemicu update stats asinkron dan pemicu confetti gembira
        setIsSaving(true);
        incrementStats(5, 3).then((res) => {
          setIsSaving(false);
          // Ledakan confetti kecil
          confetti({
            particleCount: 25,
            spread: 40,
            origin: { y: 0.8 },
            colors: ['#00f2ff', '#34d399', '#ffffff']
          });
          triggerToast(`Napas Harmonis Selesai! (+5 Skor Pernapasan, +3 Mekar Taman)`);

          // Hitung nilai resonansi sesi saat ini
          const base = 84;
          const cycleBonus = Math.min(10, next * 2); // Hingga +10 bonus
          const micBonus = isMicMode ? Math.min(6, Math.floor(intensity / 15)) : 3; // Hingga +6 bonus
          const finalScore = Math.min(100, base + cycleBonus + micBonus);
          
          setCurrentResonanceScore(finalScore);
          localStorage.setItem('last_breathing_resonance_score', String(finalScore));
        });
        return next;
      });
    }
  }, [timer, isActive]);

  useEffect(() => {
    if (isMicMode) {
      startDetection();
    } else {
      stopDetection();
    }
    return () => stopDetection();
  }, [isMicMode]);

  const toggleBreathing = () => {
    setIsActive(!isActive);
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col items-center justify-center space-y-12 relative">
      <FloatingReactions ref={reactionsRef} />
      
      {/* Toast Alert Indicator */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-24 z-50 px-6 py-3.5 bg-deep-slate/95 backdrop-blur-2xl border border-cyan-glow/30 hover:border-cyan-glow/50 text-cyan-glow font-medium text-xs tracking-wide uppercase rounded-2xl shadow-[0_0_30px_rgba(0,242,255,0.25)] flex items-center gap-3"
          >
            <Sparkles className="animate-pulse text-amber-400" size={16} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center">
        <h2 className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-2">Portal Pernapasan</h2>
        <h1 className="text-4xl font-light text-white tracking-tight">Sinkronkan bio-ritme Anda</h1>
        {isMicMode && (
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-glow/60 mt-3 font-medium">
            Bio-Feedback Aktif: Intensitas {intensity}%
          </p>
        )}

        {/* Dynamic completed cycle counter and Previous Session Comparison Card */}
        {completedCycles > 0 && (
          <div className="mt-6 flex flex-col items-center gap-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-2"
            >
              <div className="flex items-center gap-2 px-4 py-2 bg-cyan-glow/5 border border-cyan-glow/10 rounded-full text-[10px] text-cyan-glow uppercase tracking-widest font-bold shadow-[0_0_15px_rgba(0,242,255,0.05)]">
                <CheckCircle2 size={12} className="text-cyan-glow animate-bounce" />
                <span>{completedCycles} SIKLUS SELESAI ({completedCycles * 5} Poin)</span>
              </div>
            </motion.div>

            {currentResonanceScore !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="mx-auto p-4 bg-deep-slate/85 backdrop-blur-xl border border-cyan-glow/20 rounded-2xl w-72 text-center shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col gap-3"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <Sparkles size={11} className="text-amber-400 animate-pulse" />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">
                    Komparasi Resonansi Sesi
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 items-center justify-center border-t border-b border-white/5 py-2.5">
                  <div className="border-r border-white/5">
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 block mb-0.5">Sesi Lalu</span>
                    <span className="text-sm font-light font-mono text-slate-400">{previousSessionScore}%</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-cyan-glow block mb-0.5">Sesi Ini</span>
                    <span className="text-base font-semibold font-mono text-cyan-glow">{currentResonanceScore}%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-center bg-white/[0.02]/50 py-1.5 px-3 rounded-lg border border-white/5">
                  {currentResonanceScore > previousSessionScore ? (
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-[9px] font-bold">
                        ▲ +{currentResonanceScore - previousSessionScore}%
                      </span>
                      <span>Lebih Tenang & Teratur</span>
                    </div>
                  ) : currentResonanceScore < previousSessionScore ? (
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-medium">
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-[9px] font-bold">
                        ▼ {previousSessionScore - currentResonanceScore}%
                      </span>
                      <span>Fokus ke Aliran Napas</span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400 font-light">
                      Sama Tenangnya dengan Sesi Lalu
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      <div className="relative flex items-center justify-center min-h-[400px]">
        {/* Instruction Label - Center Overlaid */}
        <div className="absolute z-20 pointer-events-none text-center translate-y-16 md:translate-y-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1, y: -10 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                className="text-2xl md:text-4xl uppercase tracking-[0.4em] text-cyan-glow font-medium drop-shadow-[0_0_20px_rgba(0,242,255,0.5)]"
              >
                {step === 'ready' ? 'Siap' : step === 'inhale' ? 'Hirup Perlahan' : step === 'hold' ? 'Tahan Napas' : 'Lepaskan Beban'}
              </motion.span>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative z-10 scale-125 md:scale-150">
          <BreathingOrb isBreathing={isActive} intensity={intensity} step={step} />
          
          {/* Bio-feedback Indicator Ring */}
          {isMicMode && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <motion.div 
                 animate={{ scale: 1 + (intensity / 100), opacity: intensity / 100 }}
                 className="w-full h-full border-2 border-cyan-glow/20 rounded-full blur-md"
               />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-8">
        <div className="flex items-center gap-6">
          <button 
            onClick={(e) => {
              micRipple.trigger(e);
              setIsMicMode(!isMicMode);
            }}
            className={cn(
              "p-4 rounded-full transition-all duration-300 relative overflow-hidden",
              isMicMode ? "bg-cyan-glow/20 text-cyan-glow" : "bg-white/5 text-slate-400"
            )}
            title="Calibrate via Microphone"
            aria-label={isMicMode ? "Matikan deteksi resonansi napas" : "Aktifkan deteksi resonansi napas via mikrofon"}
          >
            {micRipple.ripplesElement}
            <div className="relative z-10 flex items-center justify-center">
              {isMicMode ? <Mic size={24} /> : <MicOff size={24} />}
            </div>
          </button>
          
          <button 
            onClick={(e) => {
              mainRipple.trigger(e);
              toggleBreathing();
            }}
            className={cn(
              "p-8 rounded-full transition-all duration-500 shadow-2xl relative overflow-hidden",
              isActive 
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-rose-500/20" 
                : "bg-cyan-glow text-deep-slate shadow-cyan-glow/40 hover:scale-105"
            )}
            aria-label={isActive ? "Jeda sesi pernapasan" : "Mulai sesi pernapasan"}
          >
            {mainRipple.ripplesElement}
            <div className="relative z-10 flex items-center justify-center">
              {isActive ? <Pause size={32} /> : <Play size={32} fill="currentColor" />}
            </div>
          </button>

          <button 
            onClick={(e) => {
              resetRipple.trigger(e);
              setIsActive(false); 
              setTimer(0);
            }}
            className="p-4 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 transition-colors relative overflow-hidden"
            aria-label="Atur ulang sesi pernapasan"
          >
            {resetRipple.ripplesElement}
            <div className="relative z-10 flex items-center justify-center">
              <RefreshCw size={24} />
            </div>
          </button>
        </div>

        {completedCycles > 0 ? (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => {
              setIsActive(false);
              confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 }
              });
              triggerToast("Menyimpan seluruh progres meditasi...");
              setTimeout(() => {
                navigate('/app/dashboard');
              }, 1500);
            }}
            className="px-6 py-3 bg-gradient-to-r from-cyan-glow to-blue-500 text-deep-slate hover:opacity-90 transition-all font-bold text-xs uppercase tracking-wider rounded-full shadow-[0_0_25px_rgba(0,242,255,0.35)] flex items-center gap-2"
          >
            <Award size={14} />
            <span>Akhiri Sesi & Simpan Progres</span>
          </motion.button>
        ) : (
          <div className="max-w-md text-center text-slate-500 text-sm font-light leading-relaxed">
            Metode Pernapasan Kotak 4-4-4-4 adalah praktik kuno untuk mengatur ulang sistem saraf. 
            {isMicMode ? " Mikrofon Anda sekarang mendeteksi resonansi napas untuk kalibrasi waktu nyata." : " Gunakan ikon mikrofon untuk mengaktifkan resonansi umpan balik biologis."}
          </div>
        )}
      </div>
    </div>
  );
}
