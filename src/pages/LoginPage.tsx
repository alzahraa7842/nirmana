import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Wind, ArrowRight, Chrome, Mic, MicOff } from 'lucide-react';
import { cn } from '../lib/utils';
import { auth, db } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useBreathDetection } from '../hooks/useBreathDetection';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isBreathingMode, setIsBreathingMode] = useState(false);
  const [breathProgress, setBreathProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { intensity, isCalibrated, startDetection, stopDetection } = useBreathDetection();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Initialize profile if new
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          role: 'user',
          createdAt: serverTimestamp(),
          displayName: result.user.displayName,
          photoURL: result.user.photoURL
        } as any);
        
        await setDoc(doc(db, `users/${result.user.uid}/private`, 'info'), {
          email: result.user.email
        } as any);

        // Initialize default stats
        await setDoc(doc(db, `users/${result.user.uid}/stats`, 'current'), {
          breathingScore: 0,
          gardenBloom: 0,
          emotionalWeather: 'Calm Clear Skies',
          lastUpdated: serverTimestamp()
        } as any);
      }
      setIsBreathingMode(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isBreathingMode && !isCalibrated) {
      startDetection();
    }
    return () => stopDetection();
  }, [isBreathingMode]);

  useEffect(() => {
    if (intensity > 15) {
      setBreathProgress(prev => {
        const next = prev + (intensity / 5); // Increased speed
        if (next >= 100) return 100;
        return next;
      });
    } else {
      setBreathProgress(prev => Math.max(0, prev - 0.2)); // Slower regression
    }
  }, [intensity]);

  const finalizeEntrance = () => {
    if (breathProgress >= 100) {
      navigate('/app');
    }
  };

  return (
    <div className="min-h-screen bg-deep-slate flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-glow/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] animation-delay-2000 animate-pulse" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-panel p-8 shadow-2xl z-10"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-glow to-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-cyan-glow/20">
            <Wind className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-light text-white tracking-tight">Pintu Masuk Kintsugi</h2>
          <p className="text-slate-500 font-light mt-2 uppercase tracking-widest text-[10px]">Memulihkan tempat perlindungan digital Anda</p>
        </div>

        <AnimatePresence mode="wait">
          {!isBreathingMode ? (
            <motion.div 
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <button 
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-4 bg-white/[0.05] border border-white/10 rounded-2xl text-white hover:bg-white/10 transition-all disabled:opacity-50"
              >
                <Chrome size={20} className="text-cyan-glow" />
                {isLoading ? "Beresonansi..." : "Masuk dengan Google"}
              </button>
              
              {error && <p className="text-rose-500 text-xs text-center">{error}</p>}
              
              <div className="mt-8 text-center">
                <p className="text-slate-600 text-[10px] uppercase tracking-widest">
                  Tahap Verifikasi Identitas 1
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="breath"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <div className="flex justify-center mb-4">
                  <div className={cn(
                    "p-4 rounded-full transition-all duration-300",
                    intensity > 15 ? "bg-cyan-glow/20 text-cyan-glow shadow-[0_0_20px_rgba(0,242,255,0.4)]" : "bg-white/5 text-slate-500"
                  )}>
                    {isCalibrated ? <Mic size={24} /> : <MicOff size={24} />}
                  </div>
                </div>
                <h3 className="text-xl text-white font-light">Resonansi Mikro-Napas</h3>
                <p className="text-xs text-slate-500 uppercase tracking-widest leading-relaxed">
                  Bernapaslah ke mikrofon untuk memulihkan akses
                </p>
                {!isCalibrated && (
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-[10px] text-amber-500 uppercase tracking-widest">Menunggu Akses Mikrofon...</p>
                    <button 
                      onClick={() => navigate('/app')}
                      className="text-[10px] text-cyan-glow/40 underline uppercase tracking-widest hover:text-cyan-glow transition-colors"
                    >
                      Lewati Verifikasi Suara
                    </button>
                  </div>
                )}
              </div>

              <div className="relative pt-8">
                <div className="absolute top-0 right-0 text-[10px] text-cyan-glow/60 font-mono">
                  INTENSITAS: {intensity}%
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-cyan-glow shadow-[0_0_10px_rgba(0,242,255,0.5)]"
                    animate={{ width: `${breathProgress}%` }}
                    transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
                  />
                </div>

                {breathProgress >= 100 ? (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={finalizeEntrance}
                    className="w-full mt-8 py-4 bg-cyan-glow text-deep-slate font-bold rounded-2xl flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(0,242,255,0.4)] transition-all"
                  >
                    MASUK KE SANCTUARY <ArrowRight size={20} />
                  </motion.button>
                ) : (
                  <div className="flex justify-center mt-6">
                    <div className="flex gap-1 items-end h-8">
                      {[...Array(8)].map((_, i) => (
                        <motion.div 
                          key={i}
                          animate={{
                            height: intensity > 10 ? [4, Math.random() * 24 + 8, 4] : 4,
                            opacity: intensity > 10 ? [0.3, 1, 0.3] : 0.2
                          }}
                          transition={{ repeat: Infinity, delay: i * 0.05, duration: 0.3 }}
                          className="w-1 bg-cyan-glow rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 text-center">
          <button className="text-slate-500 text-[10px] uppercase tracking-widest hover:text-slate-300 transition-colors">
            Protocol v2.4 Active
          </button>
        </div>
      </motion.div>
    </div>
  );
}
