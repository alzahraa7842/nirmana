import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, RefreshCw, Send, History, Calendar, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { getEmotionalReflection, analyzeSentimentAndThemes } from '../lib/gemini';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, doc, getDoc, setDoc, serverTimestamp, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import FloatingReactions, { FloatingReactionsRef } from '../components/FloatingReactions';
import { Ripple } from '../components/Ripple';

interface JournalEntry {
  id: string;
  originalText: string;
  kintsugiReflection: string;
  sentimentSummary: string;
  createdAt: Timestamp;
}

export default function ShatteredJournal() {
  const [text, setText] = useState('');
  const [isShattering, setIsShattering] = useState(false);
  const [reflection, setReflection] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<JournalEntry[]>([]);
  const reactionsRef = useRef<FloatingReactionsRef>(null);

  const buttonRipple = Ripple({ color: 'rgba(0, 0, 0, 0.12)', duration: 0.65 });


  useEffect(() => {
    if (!auth.currentUser) return;

    const journalPath = `users/${auth.currentUser.uid}/journal`;
    const q = query(
      collection(db, journalPath),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as JournalEntry[];
      setHistory(entries);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, journalPath);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  const handleShatter = async () => {
    if (!text.trim() || !auth.currentUser) return;
    
    setIsShattering(true);
    setIsLoading(true);
    
    try {
      // Call Gemini for the "Kintsugi Rewrite" and Sentiment Analysis
      const [aiReflection, aiSummary] = await Promise.all([
        getEmotionalReflection(text),
        analyzeSentimentAndThemes(text)
      ]);
      const reflectionText = aiReflection || "Keheningan Anda dipahami.";
      const summaryText = aiSummary || "Gema emosi terdeteksi.";

      // Save to Firestore
      const journalPath = `users/${auth.currentUser.uid}/journal`;
      const docRef = await addDoc(collection(db, journalPath), {
        originalText: text,
        kintsugiReflection: reflectionText,
        sentimentSummary: summaryText,
        createdAt: serverTimestamp(),
        sentiment: 'Dipulihkan' 
      });
      
      setCurrentDocId(docRef.id);

      // Update stats
      const statsPath = `users/${auth.currentUser.uid}/stats/current`;
      try {
        const statsSnap = await getDoc(doc(db, statsPath));
        let oldGardenBloom = 0;
        let oldBreathingScore = 0;
        if (statsSnap.exists()) {
          const sData = statsSnap.data();
          oldGardenBloom = sData.gardenBloom || 0;
          oldBreathingScore = sData.breathingScore || 0;
        }

        // Cumulative increment: journal adds +15 to garden bloom, and +5 to breathing score
        const nextGardenBloom = Math.min(100, oldGardenBloom + 15);
        const nextBreathingScore = Math.min(100, oldBreathingScore + 5);

        await setDoc(doc(db, statsPath), {
          lastUpdated: serverTimestamp(),
          gardenBloom: nextGardenBloom, 
          breathingScore: nextBreathingScore,
          emotionalWeather: 'Kabut Refleksi'
        }, { merge: true });
      } catch (err) {
        // Fallback simple write if getDoc fails
        await setDoc(doc(db, statsPath), {
          lastUpdated: serverTimestamp(),
          gardenBloom: 60, 
          breathingScore: 50,
          emotionalWeather: 'Kabut Refleksi'
        }, { merge: true }).catch(e => handleFirestoreError(e, OperationType.UPDATE, statsPath));
      }

      setReflection(reflectionText);
      setSummary(summaryText);
    } catch (error) {
      console.error("Journal Error:", error);
    } finally {
      setIsShattering(false);
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!text || !currentDocId || !auth.currentUser) return;
    setIsRegenerating(true);
    try {
      const newReflection = await getEmotionalReflection(text, 0.9);
      if (newReflection) {
        setReflection(newReflection);
        // Update Firestore
        const journalPath = `users/${auth.currentUser.uid}/journal`;
        await setDoc(doc(db, journalPath, currentDocId), {
          kintsugiReflection: newReflection,
          regeneratedAt: serverTimestamp()
        }, { merge: true }).catch(e => handleFirestoreError(e, OperationType.UPDATE, journalPath));
      }
    } catch (error) {
      console.error("Regeneration Error:", error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleHistoryAnalysis = async (entry: JournalEntry) => {
    if (!auth.currentUser || analyzingIds.has(entry.id)) return;

    setAnalyzingIds(prev => new Set(prev).add(entry.id));
    try {
      const summaryText = await analyzeSentimentAndThemes(entry.originalText);
      if (summaryText) {
        // Update Firestore
        const journalPath = `users/${auth.currentUser.uid}/journal`;
        await setDoc(doc(db, journalPath, entry.id), {
          sentimentSummary: summaryText
        }, { merge: true }).catch(e => handleFirestoreError(e, OperationType.UPDATE, journalPath));
      }
    } catch (error) {
      console.error("History Analysis Error:", error);
    } finally {
      setAnalyzingIds(prev => {
        const next = new Set(prev);
        next.delete(entry.id);
        return next;
      });
    }
  };

  const reset = () => {
    setText('');
    setReflection(null);
    setSummary(null);
    setCurrentDocId(null);
  };

  return (
    <div className="h-full flex flex-col space-y-8 max-w-4xl mx-auto">
      <FloatingReactions ref={reactionsRef} />
      <div className="text-center">
        <h2 className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-2">Jurnal Harian</h2>
        <h1 className="text-4xl font-light text-white tracking-tight mb-4">Bagikan Cerita Hari Ini</h1>
        <p className="text-slate-300 font-light italic text-sm tracking-wide max-w-2xl mx-auto">
          "Setiap momen berharga, setiap perasaan layak didengar. Ekspresikan harimu di sini dengan penuh kehangatan dan semangat!"
        </p>
      </div>

      <div className="relative flex-1 min-h-[400px]">
        <AnimatePresence mode="wait">
          {!reflection ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.5 } }}
              className="h-full flex flex-col"
            >
              <div className="relative flex-1">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Bagaimana harimu hari ini? Apa saja kejadian seru, momen berharga, tantangan, atau kebahagiaan yang Anda rasakan hari ini? Ceritakan semuanya di sini..."
                  className={cn(
                    "w-full h-full p-12 bg-white/5 border border-white/10 rounded-[3rem] text-xl md:text-2xl font-light text-white outline-none focus:border-cyan-glow/30 transition-all resize-none leading-relaxed",
                    isShattering && "animate-pulse"
                  )}
                />
                
                {isShattering && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     {/* Shattered Particles SIMULATION */}
                     {[...Array(20)].map((_, i) => (
                       <motion.div 
                         key={i}
                         initial={{ x: 0, y: 0, opacity: 1 }}
                         animate={{ 
                           x: (Math.random() - 0.5) * 500, 
                           y: (Math.random() - 0.5) * 500, 
                           rotate: Math.random() * 360,
                           opacity: 0,
                           scale: 0.5
                         }}
                         transition={{ duration: 1.5, ease: "easeOut" }}
                         className="absolute w-8 h-8 bg-white/20 blur-sm flex items-center justify-center text-xs text-white"
                       >
                          {text.charAt(Math.floor(Math.random() * text.length))}
                       </motion.div>
                     ))}
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    buttonRipple.trigger(e);
                    handleShatter();
                  }}
                  disabled={!text.trim() || isShattering}
                  className="px-12 py-5 bg-white text-black rounded-full font-medium flex items-center gap-3 disabled:opacity-30 shadow-2xl hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all relative overflow-hidden"
                >
                  {buttonRipple.ripplesElement}
                  <span className="relative z-10 flex items-center gap-3">
                    {isShattering ? (
                      <>
                        <Loader2 className="animate-spin text-black" size={18} />
                        <span>Meresapi Ceritamu...</span>
                      </>
                    ) : (
                      <>
                        <span>Bagikan Cerita Saya ✨</span>
                        <Send size={18} />
                      </>
                    )}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="reflection"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col p-12 bg-gradient-to-br from-indigo-950/40 to-cyan-950/40 border border-cyan-500/20 rounded-[3rem] shadow-2xl"
            >
              <div className="flex items-center gap-2 text-cyan-400 mb-8">
                <Sparkles size={20} />
                <span className="text-xs uppercase tracking-[0.3em] font-medium text-cyan-400">Apresiasi & Refleksi Hangat</span>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="relative p-10 rounded-[2rem] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 shadow-inner group overflow-hidden"
                >
                  {/* Subtle shimmering highlight */}
                  <motion.div 
                    animate={{ 
                      x: ['-100%', '250%'],
                    }}
                    transition={{ 
                      duration: 5, 
                      repeat: Infinity, 
                      ease: "easeInOut",
                      repeatDelay: 2
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-glow/5 to-transparent -skew-x-12 pointer-events-none"
                  />

                  <motion.p 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 1 }}
                    className="relative text-2xl md:text-3xl text-slate-100 font-light leading-relaxed italic"
                  >
                    “{reflection}”
                  </motion.p>
                </motion.div>

                <div className="mt-4 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className="text-[10px] uppercase tracking-[0.2em] text-cyan-400/50 hover:text-cyan-400 flex items-center gap-2 transition-colors disabled:opacity-30"
                  >
                    <RefreshCw size={12} className={cn(isRegenerating && "animate-spin")} />
                    {isRegenerating ? "Meresapi Ulang..." : "Lihat Sudut Pandang Lain"}
                  </motion.button>
                </div>

                {summary && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mt-12 p-6 bg-white/5 border border-white/10 rounded-2xl"
                  >
                    <h4 className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-3 font-bold">Sudut Pandang Positif Hari Ini</h4>
                    <p className="text-sm text-cyan-100/70 font-light leading-relaxed">
                      {summary}
                    </p>
                  </motion.div>
                )}
              </div>

              <div className="mt-12 flex justify-center gap-4">
                <button 
                  onClick={reset}
                  className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors flex items-center gap-2 border border-white/10"
                >
                  <RefreshCw size={18} /> Entri Baru
                </button>
                <button className="px-8 py-4 bg-cyan-400 text-black rounded-full font-medium flex items-center gap-2">
                  Rekaman Jiwa disimpan
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-center text-slate-400 text-xs tracking-wide uppercase font-light">
        Setiap bagian dari perjalananmu berharga. Terima kasih sudah menceritakan harimu! ❤️
      </p>

      {/* History Section */}
      <div className="mt-12 pt-12 border-t border-white/5 pb-20">
        <div className="flex items-center gap-3 mb-8">
          <History className="text-cyan-glow" size={18} />
          <h3 className="text-sm uppercase tracking-[0.3em] text-white">Arsip Cerita Indahmu</h3>
        </div>

        <div className="space-y-6">
          {history.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-white/10 rounded-[2rem]">
              <p className="text-slate-500 text-sm font-light">Belum ada jejak refleksi yang tersimpan.</p>
            </div>
          ) : (
            history.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-8 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-white/[0.07] transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar size={14} />
                    <span className="text-[10px] uppercase tracking-widest">
                      {entry.createdAt?.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-[9px] uppercase tracking-[0.2em] text-slate-500 mb-2">Pikiran Awal</h4>
                    <p className="text-slate-400 text-sm italic font-light line-clamp-3">
                      “{entry.originalText}”
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-[9px] uppercase tracking-[0.2em] text-cyan-glow/60">Refleksi Positif</h4>
                      {!entry.sentimentSummary && (
                        <button 
                          onClick={() => handleHistoryAnalysis(entry)}
                          disabled={analyzingIds.has(entry.id)}
                          className="text-[8px] uppercase tracking-widest text-cyan-400 hover:text-white transition-colors disabled:opacity-50"
                        >
                          {analyzingIds.has(entry.id) ? 'Menganalisis...' : '[ Analisis ]'}
                        </button>
                      )}
                    </div>
                    <p className="text-slate-100 text-sm font-light line-clamp-3">
                      {entry.kintsugiReflection}
                    </p>
                    {entry.sentimentSummary && (
                      <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/5">
                        <h5 className="text-[8px] uppercase tracking-widest text-slate-500 mb-2">Gema Emosi</h5>
                        <p className="text-[12px] text-cyan-100/60 font-light italic leading-relaxed">
                          {entry.sentimentSummary}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
