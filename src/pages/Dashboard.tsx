import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  CloudRain, 
  Wind, 
  TrendingUp, 
  Calendar, 
  Sparkles, 
  Battery, 
  Moon,
  Clock,
  Award,
  Trophy,
  PenTool,
  Sprout,
  Trees,
  Heart,
  Lock,
  Unlock,
  CheckCircle,
  ArrowRight,
  X,
  Volume2,
  VolumeX,
  Trash2,
  Bookmark,
  Check,
  Brain,
  Smile,
  Activity,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, onSnapshot, collection, query, setDoc, orderBy } from 'firebase/firestore';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const weeklyBreathingData = [
  { day: 'Sen', duration: 15, score: 70 },
  { day: 'Sel', duration: 25, score: 85 },
  { day: 'Rab', duration: 10, score: 62 },
  { day: 'Kam', duration: 30, score: 92 },
  { day: 'Jum', duration: 20, score: 80 },
  { day: 'Sab', duration: 28, score: 88 },
  { day: 'Min', duration: 40, score: 95 }
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-deep-slate/90 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl">
        <p className="text-xs text-white font-semibold uppercase tracking-wider mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-3 text-xs mt-1">
            <span 
              className="w-2 h-2 rounded-full inline-block animate-pulse" 
              style={{ backgroundColor: entry.stroke || entry.color }} 
            />
            <span className="text-slate-400 font-light">
              {entry.name === 'duration' ? 'Durasi Sesi' : 'Skor Resonansi'}:
            </span>
            <span className="text-white font-mono font-medium">
              {entry.value} {entry.name === 'duration' ? 'menit' : '%'}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const EmotionalTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#0b1329]/95 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl max-w-xs">
        <p className="text-[10px] text-slate-500 font-mono tracking-wider mb-1">
          {new Date(data.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="w-2 h-2 rounded-full bg-fuchsia-500 inline-block animate-pulse" />
          <span className="text-white font-medium text-xs">Gema Emosi: <span className="text-fuchsia-300 font-bold">{data.emotion}</span></span>
          <span className="text-fuchsia-400 font-mono text-xs font-semibold ml-auto">{data.score}%</span>
        </div>
        <p className="text-slate-300 text-[11px] font-light mt-2 leading-relaxed border-t border-white/5 pt-2">
          {data.explanation}
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDateIndonesian = (date: Date) => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const formatTime12Hour = (date: Date) => {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursStr = String(hours).padStart(2, '0');
    return `${hoursStr}:${minutes}:${seconds} ${ampm}`;
  };

  const [stats, setStats] = useState({
    breathingScore: 85,
    gardenBloom: 64,
    emotionalWeather: 'Ketenangan Surgawi'
  });
  const [journalCount, setJournalCount] = useState(0);
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);

  const [statsLoaded, setStatsLoaded] = useState(false);
  const [journalLoaded, setJournalLoaded] = useState(false);
  const [hasInitializedUnlocks, setHasInitializedUnlocks] = useState(false);
  const unlockedBadgeIdsRef = useRef<Set<string>>(new Set());

  // Interactivity states for Today's Reflection and Saved Reflections
  const dailyQuote = "Seperti mangkuk kintsugi, ketidaksempurnaan Anda bukanlah kekurangan yang harus disembunyikan, melainkan jalan menuju keindahan yang paling tangguh. Bernapaslah ke dalam retakan itu; di sanalah cahaya masuk.";
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [savedReflections, setSavedReflections] = useState<any[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null); // To track which specific quote is currently spoken ('today' or actual saved ID)

  // Weekly Emotional Summary States
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [weeklyAnalysis, setWeeklyAnalysis] = useState<{
    summary: string;
    points: { date: string; score: number; emotion: string; explanation: string }[];
  } | null>(null);
  const [isAnalyzingWeekly, setIsAnalyzingWeekly] = useState(false);
  const [weeklyAnalysisError, setWeeklyAnalysisError] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Sound synthesis / gema pembaca suara
  const handleToggleSpeech = (quoteText: string, quoteId: string) => {
    if (!('speechSynthesis' in window)) {
      triggerToast("Perangkat Anda tidak mendukung fitur pembaca suara.");
      return;
    }

    if (isSpeaking && speakingId === quoteId) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingId(null);
      triggerToast("Gema pembaca diperlahankan...");
      return;
    }

    // Cancel anything active
    window.speechSynthesis.cancel();

    const cleanQuote = quoteText.replace(/[“”"']/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanQuote);
    utterance.lang = 'id-ID';
    utterance.rate = 0.85; // slightly slower tempo for a meditation feeling
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const indVoice = voices.find(v => v.lang.startsWith('id') || v.lang.includes('ID'));
    if (indVoice) {
      utterance.voice = indVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeakingId(quoteId);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingId(null);
    };

    utterance.onerror = (e) => {
      console.error("Gagal sintesis suara:", e);
      setIsSpeaking(false);
      setSpeakingId(null);
    };

    window.speechSynthesis.speak(utterance);
    triggerToast("Gema Suara Zen dimulai...");
  };

  // Save/Unsave Refleksi as Soul Record (Rekaman Jiwa)
  const handleSaveReflection = async () => {
    if (!auth.currentUser) {
      triggerToast("Harap masuk akun terlebih dahulu.");
      return;
    }

    if (isSaved) {
      triggerToast("Refleksi suci ini sudah dipatri di Rekaman Jiwa Anda.");
      return;
    }

    setIsSaving(true);
    try {
      const savedReflectionsPath = `users/${auth.currentUser.uid}/saved_reflections`;
      const docRef = doc(collection(db, savedReflectionsPath));
      await setDoc(docRef, {
        quote: dailyQuote,
        savedAt: new Date().toISOString(),
        title: 'Alkimia Kintsugi'
      });
      
      triggerConfetti();
      triggerToast("Refleksi suci berhasil dipatri ke Rekaman Jiwa! ✨");
    } catch (err) {
      console.error("Gagal menyimpan refleksi:", err);
      triggerToast("Terjadi kesalahan saat mengabadikan ke database.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete reflection from database (Unsave)
  const handleDeleteReflection = async (id: string) => {
    if (!auth.currentUser) return;
    try {
      const savedReflectionsPath = `users/${auth.currentUser.uid}/saved_reflections`;
      const docRef = doc(db, savedReflectionsPath, id);
      const isCurrentlySpeakingThis = speakingId === id;
      
      if (isCurrentlySpeakingThis) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setSpeakingId(null);
      }

      // delete from Firestore
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(docRef);
      triggerToast("Refleksi telah dihapus dari Rekaman Jiwa.");
    } catch (err) {
      console.error("Gagal menghapus catatan:", err);
      triggerToast("Gagal menghapus dari database.");
    }
  };

  // Pre-load synthesis voices and register event
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        window.speechSynthesis.getVoices();
      };
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Listen to saved reflections collection
  useEffect(() => {
    if (!auth.currentUser) return;

    const savedReflectionsPath = `users/${auth.currentUser.uid}/saved_reflections`;
    const q = query(collection(db, savedReflectionsPath));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: any[] = [];
      snapshot.forEach(docSnap => {
        records.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort in-memory descending by savedAt
      records.sort((a, b) => new Date(b.savedAt || 0).getTime() - new Date(a.savedAt || 0).getTime());
      setSavedReflections(records);
      
      const cleanDaily = dailyQuote.trim();
      const exists = records.some((r: any) => r.quote.trim() === cleanDaily);
      setIsSaved(exists);
    }, (error) => {
      console.error("Gagal mendengarkan rekaman jiwa:", error);
    });

    return () => unsubscribe();
  }, []);

  // High-energy celebratory confetti trigger helper
  const triggerConfetti = () => {
    // Center blast
    confetti({
      particleCount: 140,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#00f2ff', '#34d399', '#fbbf24', '#e879f9', '#ffffff'] // Cyan, green, amber, fuchsia, white
    });
    
    // Delayed Left blast
    setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.85 },
        colors: ['#00f2ff', '#34d399', '#fbbf24', '#e879f9', '#ffffff']
      });
    }, 200);

    // Delayed Right blast
    setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.85 },
        colors: ['#00f2ff', '#34d399', '#fbbf24', '#e879f9', '#ffffff']
      });
    }, 400);
  };

  useEffect(() => {
    if (!auth.currentUser) return;

    const statsPath = `users/${auth.currentUser.uid}/stats/current`;
    const unsubscribe = onSnapshot(doc(db, statsPath), (docSnap) => {
      if (docSnap.exists()) {
        setStats(docSnap.data() as any);
      }
      setStatsLoaded(true);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, statsPath);
      setStatsLoaded(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;

    const journalPath = `users/${auth.currentUser.uid}/journal`;
    const q = query(collection(db, journalPath), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: any[] = [];
      snapshot.forEach(docSnap => {
        records.push({ id: docSnap.id, ...docSnap.data() });
      });
      setJournalEntries(records);
      setJournalCount(snapshot.size);
      setJournalLoaded(true);
    }, (error) => {
      console.error("Error fetching journal entries:", error);
      setJournalLoaded(true);
    });

    return () => unsubscribe();
  }, []);

  const fetchWeeklyEmotionalAnalysis = async (force = false) => {
    if (!auth.currentUser || journalEntries.length === 0) return;

    // Filter last 7 days of journal entries
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const entriesLast7DaysRaw = journalEntries.filter(entry => {
      const entryDate = entry.createdAt
        ? (entry.createdAt.toDate ? entry.createdAt.toDate() : new Date(entry.createdAt))
        : new Date();
      return entryDate >= sevenDaysAgo;
    });

    if (entriesLast7DaysRaw.length === 0) {
      setWeeklyAnalysis(null);
      return;
    }

    // Convert to client dates
    const payloadEntries = entriesLast7DaysRaw.map(e => {
      const entryDate = e.createdAt
        ? (e.createdAt.toDate ? e.createdAt.toDate() : new Date(e.createdAt))
        : new Date();
      return {
        date: entryDate.toISOString().split('T')[0],
        content: e.originalText,
        sentimentSummary: e.sentimentSummary || ''
      };
    });

    // Generate last 7 days list formatted as YYYY-MM-DD
    const last7Dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Dates.push(d.toISOString().split('T')[0]);
    }

    // Check localStorage cache first
    const cacheKey = `weekly_emotional_analysis_${auth.currentUser.uid}`;
    if (!force) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsedCache = JSON.parse(cached);
          const lastEntryId = journalEntries[0]?.id;
          if (parsedCache.lastEntryId === lastEntryId && parsedCache.data) {
            setWeeklyAnalysis(parsedCache.data);
            return;
          }
        } catch (e) {
          console.warn("Error parsing cache:", e);
        }
      }
    }

    // Call API
    setIsAnalyzingWeekly(true);
    setWeeklyAnalysisError(null);
    try {
      const response = await fetch("/api/analyze-weekly-emotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: payloadEntries,
          last7Dates
        })
      });

      if (!response.ok) {
        throw new Error("Gagal melakukan analisis emosi dari server.");
      }

      const data = await response.json();
      if (data && data.points) {
        setWeeklyAnalysis(data);
        // Save to cache
        localStorage.setItem(cacheKey, JSON.stringify({
          lastEntryId: journalEntries[0]?.id,
          data
        }));
      } else {
        throw new Error("Format respons tidak valid.");
      }
    } catch (err: any) {
      console.error("Weekly Analysis trigger error:", err);
      setWeeklyAnalysisError(err?.message || "Terjadi kesalahan saat memproses analisis emosi.");
    } finally {
      setIsAnalyzingWeekly(false);
    }
  };

  useEffect(() => {
    if (journalLoaded && journalEntries.length > 0) {
      fetchWeeklyEmotionalAnalysis();
    }
  }, [journalLoaded, journalEntries.length]);

  // Track unlocks and trigger confetti
  useEffect(() => {
    if (!statsLoaded || !journalLoaded) return;

    // Check conditions matching exactly the badges definition
    const currentUnlockedIds = new Set<string>();
    if (stats.breathingScore >= 50) currentUnlockedIds.add('first_breath');
    if (stats.breathingScore >= 90) currentUnlockedIds.add('perfect_resonance');
    if (journalCount >= 1) currentUnlockedIds.add('first_journal');
    if (journalCount >= 3) currentUnlockedIds.add('kintsugi_master');
    if (stats.gardenBloom >= 20) currentUnlockedIds.add('first_sprout');
    if (stats.gardenBloom >= 70) currentUnlockedIds.add('sanctuary_oasis');

    if (!hasInitializedUnlocks) {
      unlockedBadgeIdsRef.current = currentUnlockedIds;
      setHasInitializedUnlocks(true);
    } else {
      let newlyUnlocked = false;
      currentUnlockedIds.forEach(id => {
        if (!unlockedBadgeIdsRef.current.has(id)) {
          newlyUnlocked = true;
        }
      });

      if (newlyUnlocked) {
        triggerConfetti();
        unlockedBadgeIdsRef.current = currentUnlockedIds;
      }
    }
  }, [statsLoaded, journalLoaded, stats.breathingScore, stats.gardenBloom, journalCount, hasInitializedUnlocks]);

  const badges = [
    {
      id: 'first_breath',
      title: 'Napas Pertama',
      requirement: 'Mulai portal pernapasan',
      conditionText: 'Skor Pernapasan ≥ 50',
      description: 'Mengambil langkah pertama untuk menyatukan jiwa dan raga dalam satu ritme tenang.',
      icon: Wind,
      isUnlocked: stats.breathingScore >= 50,
      color: 'from-cyan-500/20 to-blue-500/20 text-cyan-glow border-cyan-glow/30',
      glowColor: 'rgba(0, 242, 255, 0.4)',
      path: '/app/breathing',
      actionLabel: 'Mulai Portal Napas'
    },
    {
      id: 'perfect_resonance',
      title: 'Harmoni Sempurna',
      requirement: 'Mencapai ketenangan puncak',
      conditionText: 'Skor Pernapasan ≥ 90',
      description: 'Mencapai sinkronisasi biologis dan spiritual yang mendalam serta seimbang.',
      icon: Heart,
      isUnlocked: stats.breathingScore >= 90,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
      glowColor: 'rgba(52, 211, 153, 0.4)',
      path: '/app/breathing',
      actionLabel: 'Mulai Latihan Napas'
    },
    {
      id: 'first_journal',
      title: 'Pena Kejujuran',
      requirement: 'Mulai menulis jurnal',
      conditionText: 'Minimal 1 entri jurnal',
      description: 'Membuka lembaran baru dan menuangkan kebenaran rasa ke dalam retakan kintsugi Anda.',
      icon: PenTool,
      isUnlocked: journalCount >= 1,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
      glowColor: 'rgba(251, 191, 36, 0.4)',
      path: '/app/journal',
      actionLabel: 'Tulis Jurnal Pertama'
    },
    {
      id: 'kintsugi_master',
      title: 'Alkimia Kintsugi',
      requirement: 'Sering menulis refleksi',
      conditionText: 'Minimal 3 entri jurnal',
      description: 'Menyusun pecahan-pecahan emosi masa lalu menjadi mozaik emas yang bernilai tinggi.',
      icon: Sparkles,
      isUnlocked: journalCount >= 3,
      color: 'from-fuchsia-500/20 to-rose-500/20 text-fuchsia-400 border-fuchsia-500/30',
      glowColor: 'rgba(232, 121, 249, 0.4)',
      path: '/app/journal',
      actionLabel: 'Tulis Refleksi Lanjutan'
    },
    {
      id: 'first_sprout',
      title: 'Tunas Harapan',
      requirement: 'Tumbuhkan taman',
      conditionText: 'Kemajuan Mekar ≥ 20%',
      description: 'Berhasil memelihara bibit pertama kelestarian jiwa di taman pemulihan.',
      icon: Sprout,
      isUnlocked: stats.gardenBloom >= 20,
      color: 'from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30',
      glowColor: 'rgba(74, 222, 128, 0.4)',
      path: '/app/garden',
      actionLabel: 'Kunjungi Taman Seni'
    },
    {
      id: 'sanctuary_oasis',
      title: 'Mahkota Oase',
      requirement: 'Oase sepenuhnya mekar',
      conditionText: 'Kemajuan Mekar ≥ 70%',
      description: 'Menjadikan hati sebentar oasis rimbun tempat berteduh dari badai kehidupan.',
      icon: Trees,
      isUnlocked: stats.gardenBloom >= 70,
      color: 'from-teal-500/20 to-cyan-500/20 text-teal-400 border-teal-500/30',
      glowColor: 'rgba(45, 212, 191, 0.4)',
      path: '/app/garden',
      actionLabel: 'Rawat Oase Jiwa'
    }
  ];

  const unlockedCount = badges.filter(b => b.isUnlocked).length;
  const completionPercent = Math.round((unlockedCount / badges.length) * 100);
  return (
    <div className="space-y-8 pb-12 relative">
      {/* Toast Alert Indicator */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] px-6 py-3.5 bg-deep-slate/95 backdrop-blur-2xl border border-cyan-glow/30 hover:border-cyan-glow/50 text-cyan-glow font-medium text-xs tracking-wide uppercase rounded-2xl shadow-[0_0_30px_rgba(0,242,255,0.25)] flex items-center gap-3"
          >
            <Sparkles className="animate-pulse text-amber-400" size={16} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-2">Ikhtisar Sanctuary</h2>
          <h1 className="text-4xl font-light text-white tracking-tight">Selamat datang, Jiwa yang Tenang.</h1>
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-sm font-light uppercase tracking-widest">
          <Calendar size={14} />
          <span>{formatDateIndonesian(currentDateTime)}</span>
          <span className="mx-2 opacity-20 text-white">|</span>
          <Clock size={14} />
          <span>{formatTime12Hour(currentDateTime)}</span>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <GlassCard className="col-span-1 md:col-span-2">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mb-2">Cuaca Emosional</h3>
              <p className="text-2xl text-white font-light">{stats.emotionalWeather}</p>
            </div>
            <div className="p-3 bg-cyan-glow/10 rounded-2xl border border-cyan-glow/20">
              <CloudRain className="text-cyan-glow" size={24} />
            </div>
          </div>
          <div className="aspect-[21/9] w-full bg-black/20 rounded-2xl flex items-end p-4 gap-1.5 overflow-hidden">
             {[...Array(24)].map((_, i) => (
               <motion.div 
                 key={i}
                 initial={{ height: 0 }}
                 animate={{ height: `${20 + Math.random() * 60}%` }}
                 transition={{ duration: 2.5, repeat: Infinity, repeatType: "reverse", delay: i * 0.1 }}
                 className="flex-1 bg-cyan-glow/20 rounded-t-lg shadow-[0_0_10px_rgba(0,242,255,0.1)]"
               />
             ))}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex flex-col h-full justify-between">
            <div>
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mb-1 text-center">Skor Pernapasan</h3>
              <div className="relative w-32 h-32 mx-auto my-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/[0.02]" />
                  <motion.circle 
                    cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="364.4" 
                    initial={{ strokeDashoffset: 364.4 }}
                    animate={{ strokeDashoffset: 364.4 * 0.15 }}
                    transition={{ duration: 3, ease: "easeOut" }}
                    className="text-cyan-glow" 
                    style={{ filter: 'drop-shadow(0 0 8px rgba(0,242,255,0.4))' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-light text-white tracking-tighter">{stats.breathingScore}</span>
                </div>
              </div>
            </div>
            <p className="text-center text-[10px] text-slate-500 tracking-widest uppercase">Resonansi Puncak: 98%</p>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex flex-col h-full justify-between">
            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mb-4">Pemulihan Taman</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <span className="text-sm font-light text-slate-400">Kemajuan Mekar</span>
                <span className="text-2xl text-white font-light font-serif italic">{stats.gardenBloom}%</span>
              </div>
              <div className="w-full h-[3px] bg-white/[0.05] rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${stats.gardenBloom}%` }} 
                  transition={{ duration: 2, delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-cyan-glow via-indigo-400 to-gold shadow-[0_0_10px_rgba(0,242,255,0.3)]" 
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                 <div className="h-12 bg-white/[0.03] rounded-xl border border-white/5 flex items-center justify-center"><Wind size={16} className="text-cyan-glow/40" /></div>
                 <div className="h-12 bg-white/[0.03] rounded-xl border border-white/5 flex items-center justify-center"><TrendingUp size={16} className="text-emerald-400/40" /></div>
                 <div className="h-12 bg-white/[0.03] rounded-xl border border-white/5 flex items-center justify-center"><Moon size={16} className="text-indigo-400/40" /></div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Weekly Emotional Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <GlassCard className="md:col-span-2 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                <Heart size={14} className="text-fuchsia-400" />
                Tren Gema Emosi Mingguan
              </h3>
              <h4 className="text-lg font-light text-white">Grafik Fluktuasi Jiwa (Analis Gemini)</h4>
            </div>
            <div className="flex items-center gap-4 text-xs font-light">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-fuchsia-500 inline-block animate-pulse" />
                Skor Emosi (0 - 100%)
              </span>
            </div>
          </div>

          {/* Chart area */}
          <div className="h-64 w-full flex items-center justify-center relative">
            {!journalLoaded ? (
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="animate-spin text-fuchsia-400" size={24} />
                <span className="text-slate-400 text-xs font-light">Memuat rekaman harian...</span>
              </div>
            ) : journalEntries.length === 0 ? (
              <div className="text-center p-6 border border-dashed border-white/10 rounded-2xl w-full h-full flex flex-col items-center justify-center gap-3">
                <PenTool className="text-slate-500 animate-bounce" size={24} />
                <p className="text-slate-400 text-xs font-light max-w-sm">
                  Belum ada rekaman cerita harian Anda. Bagikan cerita di lembar Kintsugi untuk mulai menganalisis gema emosi mingguan Anda.
                </p>
                <button
                  onClick={() => navigate('/app/journal')}
                  className="mt-2 text-[10px] bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-300 uppercase tracking-widest px-4 py-2 rounded-xl transition-all font-medium"
                >
                  Tulis Refleksi Pertama
                </button>
              </div>
            ) : !weeklyAnalysis ? (
              <div className="text-center p-6 border border-dashed border-white/10 rounded-2xl w-full h-full flex flex-col items-center justify-center gap-3">
                <Brain className="text-fuchsia-400 animate-pulse" size={32} />
                <p className="text-slate-300 text-xs font-light max-w-md">
                   Analisis garis tren emosi mingguan Anda siap dihasilkan menggunakan Gemini.
                </p>
                <button
                  onClick={() => fetchWeeklyEmotionalAnalysis(true)}
                  disabled={isAnalyzingWeekly}
                  className="mt-2 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white text-[11px] font-semibold uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(217,70,239,0.25)] flex items-center gap-2 disabled:opacity-50"
                >
                  {isAnalyzingWeekly ? (
                    <>
                      <RefreshCw className="animate-spin" size={14} />
                      Menganalisis Jiwa...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} className="text-fuchsia-200 animate-pulse" />
                      Mulai Analisis Gema Mingguan
                    </>
                  )}
                </button>
                {weeklyAnalysisError && (
                  <p className="text-rose-400 text-[10px] mt-1 flex items-center gap-1.5 justify-center">
                    <AlertCircle size={12} /> {weeklyAnalysisError}
                  </p>
                )}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={weeklyAnalysis.points.map(pt => ({
                    ...pt,
                    dayName: (() => {
                      try {
                        const d = new Date(pt.date);
                        return d.toLocaleDateString('id-ID', { weekday: 'short' });
                      } catch (e) {
                        return pt.date;
                      }
                    })()
                  }))}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorScoreWeekly" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d946ef" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="dayName" 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip content={<EmotionalTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#d946ef" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorScoreWeekly)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col justify-between">
          <div>
            <span className="text-fuchsia-400 text-[10px] uppercase tracking-widest font-bold">Wawasan Gema Jiwa</span>
            <h3 className="text-xl font-light text-white mt-1.5 flex items-center gap-1.5">
               Keseimbangan Batin 
               {weeklyAnalysis && <Activity size={16} className="text-fuchsia-400 inline-block animate-ping" />}
            </h3>
            
            {isAnalyzingWeekly ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <Brain className="text-fuchsia-400 animate-spin" size={32} />
                <p className="text-slate-400 text-[11px] font-light italic animate-pulse">Gemini sedang merangkai mozaik emosional...</p>
              </div>
            ) : !weeklyAnalysis ? (
              <div className="py-10 text-center">
                <p className="text-slate-500 text-xs font-light leading-relaxed">
                  Tutup retakan, satukan gema. Saat analisis diaktifkan, ringkasan puitis dari Gemini akan diproyeksikan di sini untuk menemani pemulihan Anda.
                </p>
                <div className="mt-4 flex justify-center">
                  <div className="h-1 lg:w-20 bg-white/5 rounded-full" />
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-slate-350 text-xs font-light leading-relaxed font-serif italic border-l-2 border-fuchsia-500/50 pl-3">
                  “ {weeklyAnalysis.summary} ”
                </p>
                
                <div className="mt-6 space-y-2.5">
                  <div className="flex justify-between items-center text-xs bg-white/[0.01] border border-white/5 p-2.5 rounded-xl">
                    <span className="text-slate-500 font-light">Rentang Tanggal</span>
                    <span className="text-white font-mono font-medium text-[10px]">
                      {new Date(weeklyAnalysis.points[0]?.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {new Date(weeklyAnalysis.points[6]?.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs bg-white/[0.01] border border-white/5 p-2.5 rounded-xl">
                    <span className="text-slate-500 font-light">Energi Ternyawa</span>
                    <span className="text-fuchsia-300 font-medium capitalize">
                      {weeklyAnalysis.points.filter((p: any) => p.emotion !== 'Hening' && p.emotion !== 'Stabil').map((p: any) => p.emotion).slice(-1)[0] || "Tenang/Hening"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {weeklyAnalysis && (
            <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
              <span className="text-[10px] text-slate-500 font-mono capitalize">
                {journalEntries.length > 7 ? '7+ Entri Jurnal' : `${journalEntries.length} Entri Jurnal`}
              </span>
              <button
                onClick={() => fetchWeeklyEmotionalAnalysis(true)}
                disabled={isAnalyzingWeekly}
                className="text-[10px] bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-all text-xs"
              >
                <RefreshCw size={10} className={cn(isAnalyzingWeekly && "animate-spin")} />
                Sinkronisasi Ulang
              </button>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Weekly Breathing Consistency Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <GlassCard className="md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                <Wind size={14} className="text-cyan-glow" />
                Konsistensi Napas Mingguan
              </h3>
              <h4 className="text-lg font-light text-white">Grafik Durasi Meditasi & Resonansi</h4>
            </div>
            <div className="flex items-center gap-4 text-xs font-light">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00f2ff] inline-block" />
                Durasi (menit)
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1] inline-block" />
                Skor Resonansi
              </span>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={weeklyBreathingData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="day" 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="duration" 
                  stroke="#00f2ff" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorDuration)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#6366f1" 
                  strokeWidth={1.5}
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                  strokeDasharray="4 4"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col justify-between">
          <div>
            <span className="text-amber-400 text-[10px] uppercase tracking-widest font-bold">Ringkasan Sesi</span>
            <h3 className="text-xl font-light text-white mt-1.5">Napas & Udara Seimbang</h3>
            <p className="text-slate-400 text-xs font-light leading-relaxed mt-4">
              Dalam 7 hari terakhir, Anda telah menyelesaikan <span className="text-cyan-glow font-mono font-medium">14 sesi</span> pernapasan dengan total waktu kumulatif <span className="text-white font-mono font-medium">168 menit</span>.
            </p>
            
            <div className="mt-6 space-y-3">
              <div className="flex justify-between items-center text-xs bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                <span className="text-slate-500 font-light">Rata-rata Durasi</span>
                <span className="text-white font-mono font-medium">24 m / sesi</span>
              </div>
              <div className="flex justify-between items-center text-xs bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                <span className="text-slate-500 font-light">Ketepatan Ritme</span>
                <span className="text-cyan-glow font-mono font-medium">92%</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-cyan-glow/5 border border-cyan-glow/10 rounded-2xl flex items-start gap-3 mt-6">
            <Sparkles className="text-cyan-glow shrink-0 mt-0.5 animate-pulse" size={16} />
            <p className="text-[11px] text-slate-400 leading-relaxed font-light">
              <strong className="text-cyan-glow font-medium">Saran Guru Zen:</strong> Ritme pernapasan Anda paling stabil di hari Kamis malam. Pertahankan konsistensi ini untuk menyeimbangkan badai emosi.
            </p>
          </div>
        </GlassCard>
      </div>

      {/* AI Reflection & Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <GlassCard className="md:col-span-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <Sparkles size={160} className="text-cyan-glow" />
          </div>
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
            <Sparkles size={14} className="text-cyan-glow" />
            Refleksi AI Hari Ini
          </h3>
          <p className="text-2xl md:text-3xl text-slate-200 font-serif italic leading-snug max-w-3xl">
            “{dailyQuote}”
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
             <button 
               onClick={() => handleToggleSpeech(dailyQuote, 'today')}
               className={cn(
                 "px-6 py-2.5 border rounded-full text-[10px] uppercase tracking-widest transition-all flex items-center gap-2",
                 isSpeaking && speakingId === 'today'
                   ? "bg-cyan-glow/15 border-cyan-glow/45 text-cyan-glow font-semibold shadow-[0_0_15px_rgba(0,242,255,0.15)] animate-pulse"
                   : "bg-white/[0.05] border-white/10 hover:bg-white/10 text-white"
               )}
             >
               {isSpeaking && speakingId === 'today' ? (
                 <>
                   <VolumeX size={12} className="animate-pulse" />
                   <span>Hentikan Gema</span>
                 </>
               ) : (
                 <>
                   <Volume2 size={12} />
                   <span>Dengarkan dengan Gema</span>
                 </>
               )}
             </button>
          </div>
        </GlassCard>

        <div className="space-y-6">
          <GlassCard className="flex items-center gap-5 py-6">
            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
              <Battery className="text-amber-500" size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Tingkat Energi</p>
              <p className="text-lg text-white font-light">Detak Seimbang</p>
            </div>
          </GlassCard>
          <GlassCard className="flex items-center gap-5 py-6">
            <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
              <TrendingUp className="text-indigo-400" size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Runtunan Pertumbuhan</p>
              <p className="text-lg text-white font-light">12 Siklus</p>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Galeri Rekaman Jiwa yang Disimpan */}
      <AnimatePresence>
        {savedReflections.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4 mt-8"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                <Bookmark size={14} className="text-cyan-glow" />
                Koleksi Rekaman Jiwa Anda ({savedReflections.length})
              </h3>
              <p className="text-[10px] text-slate-500 tracking-wider">
                Refleksi suci yang pernah Anda selamatkan
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedReflections.map((item) => (
                <motion.div 
                  key={item.id} 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-panel p-6 relative group overflow-hidden flex flex-col justify-between min-h-[160px]"
                >
                  <p className="text-sm text-slate-300 font-serif italic leading-relaxed">
                    “{item.quote}”
                  </p>
                  
                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-[9px] font-mono text-slate-600">
                      {item.savedAt ? new Date(item.savedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Catatan Abadi'}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleSpeech(item.quote, item.id)}
                        title="Dengarkan gema refleksi ini"
                        className={cn(
                          "p-2 rounded-full border transition-all",
                          isSpeaking && speakingId === item.id
                            ? "bg-cyan-glow/10 border-cyan-glow/30 text-cyan-glow animate-pulse"
                            : "bg-white/5 border-white/5 hover:border-white/10 text-slate-400 hover:text-white"
                        )}
                      >
                        {isSpeaking && speakingId === item.id ? (
                          <VolumeX size={12} />
                        ) : (
                          <Volume2 size={12} />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteReflection(item.id)}
                        title="Hapus dari Rekaman Jiwa"
                        className="p-2 bg-rose-500/5 hover:bg-rose-500/15 border border-rose-500/10 hover:border-rose-500/30 text-rose-400 rounded-full transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gamified Milestones & Badges Section */}
      <div className="mt-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
              <Trophy size={14} className="text-gold" />
              Dewan Milestone & Pencapaian
            </h3>
            <h2 className="text-2xl font-light text-white tracking-tight">Perkembangan Restorasi Jiwa Anda</h2>
          </div>
          <div className="flex flex-col items-end gap-1.5 min-w-[200px]">
            <div className="flex justify-between w-full text-xs text-slate-400 font-light tracking-wide">
              <span>Keberhasilan Sakral</span>
              <span className="text-cyan-glow font-mono font-medium">{unlockedCount} / {badges.length} Terbuka</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${completionPercent}%` }}
                className="h-full bg-gradient-to-r from-cyan-glow to-indigo-500 shadow-[0_0_12px_rgba(0,242,255,0.4)]"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {badges.map((badge) => {
            const IconComponent = badge.icon;
            return (
              <motion.div
                key={badge.id}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedBadge(badge)}
                className={cn(
                  "p-5 rounded-2xl border flex flex-col items-center justify-between text-center cursor-pointer transition-all duration-300 relative overflow-hidden h-40",
                  badge.isUnlocked 
                    ? `bg-gradient-to-b ${badge.color} border-white/10 hover:border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.02)]`
                    : "bg-white/[0.02] border-white/5 hover:border-white/10 opacity-60 hover:opacity-80"
                )}
              >
                {/* Decorative glow inside */}
                {badge.isUnlocked && (
                  <div 
                    className="absolute inset-x-0 -top-12 h-20 blur-2xl -z-10 rounded-full"
                    style={{ backgroundColor: badge.glowColor }}
                  />
                )}

                <div className="flex flex-col items-center gap-3">
                  <div className={cn(
                    "p-3 rounded-full relative z-10",
                    badge.isUnlocked 
                      ? "bg-white/5 shadow-[inset_0_0_12px_rgba(255,255,255,0.05)] border border-white/10" 
                      : "bg-white/[0.01]"
                  )}>
                    {badge.isUnlocked ? (
                      <IconComponent size={24} className="stroke-[1.5]" />
                    ) : (
                      <Lock size={20} className="text-slate-600 stroke-[1.5]" />
                    )}
                  </div>
                  <div>
                    <h4 className={cn(
                      "text-xs uppercase font-semibold tracking-wider",
                      badge.isUnlocked ? "text-white" : "text-slate-500"
                    )}>
                      {badge.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-1 font-light truncate max-w-[120px]">
                      {badge.requirement}
                    </p>
                  </div>
                </div>

                <div className="mt-2">
                  {badge.isUnlocked ? (
                    <span className="text-[9px] uppercase tracking-widest bg-cyan-glow/10 text-cyan-glow border border-cyan-glow/20 px-2.5 py-0.5 rounded-full font-medium">
                      Terbuka
                    </span>
                  ) : (
                    <span className="text-[9px] uppercase tracking-widest text-slate-600 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5 font-mono">
                      Terkunci
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Interactive Badge Details Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="glass-panel p-8 max-w-md w-full relative overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)]"
            >
              {/* Decorative radial lighting in dialog back */}
              <div 
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 blur-[80px] opacity-20 -z-10 rounded-full"
                style={{ backgroundColor: selectedBadge.glowColor }}
              />

              <button 
                onClick={() => setSelectedBadge(null)}
                className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-full text-slate-400 hover:text-white transition-all"
              >
                <X size={16} />
              </button>

              <div className="flex flex-col items-center text-center mt-4">
                <div className={cn(
                  "p-6 rounded-full border mb-6 relative",
                  selectedBadge.isUnlocked 
                    ? `bg-gradient-to-b ${selectedBadge.color} border-white/10 shadow-lg`
                    : "bg-white/[0.02] border-white/5 text-slate-500"
                )}>
                  {selectedBadge.isUnlocked ? (
                    <selectedBadge.icon size={48} className="stroke-[1.25] animate-pulse" />
                  ) : (
                    <Lock size={40} className="stroke-[1.25] text-slate-600" />
                  )}
                  {selectedBadge.isUnlocked && (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-dashed border border-cyan-glow/40 rounded-full -m-2"
                    />
                  )}
                </div>

                <div className="mb-2">
                  <span className={cn(
                    "text-[10px] uppercase tracking-[0.3em] font-semibold",
                    selectedBadge.isUnlocked ? "text-cyan-glow" : "text-slate-500"
                  )}>
                    {selectedBadge.isUnlocked ? "Milestone Terbuka" : "Milestone Sakral"}
                  </span>
                  <h3 className="text-2xl font-light text-white mt-1">{selectedBadge.title}</h3>
                </div>

                <p className="text-slate-400 text-sm font-light leading-relaxed px-2 mt-4">
                  {selectedBadge.description}
                </p>

                <div className="w-full h-[1px] bg-white/5 my-6" />

                <div className="w-full bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col items-start text-left gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Persyaratan</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    {selectedBadge.isUnlocked ? (
                      <CheckCircle size={16} className="text-emerald-400" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center">
                        <div className="w-2 h-2 bg-slate-600 rounded-full" />
                      </div>
                    )}
                    <span className={cn(
                      "text-xs font-mono font-medium",
                      selectedBadge.isUnlocked ? "text-slate-300" : "text-slate-500"
                    )}>
                      {selectedBadge.conditionText}
                    </span>
                  </div>
                </div>

                <div className="mt-8 w-full flex gap-3">
                  <button 
                    onClick={() => setSelectedBadge(null)}
                    className="flex-1 py-3 bg-white/[0.05] hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all rounded-full text-xs uppercase tracking-wider text-white font-medium"
                  >
                    Tutup
                  </button>
                  {selectedBadge.isUnlocked ? (
                    <button 
                      onClick={() => {
                        triggerConfetti();
                      }}
                      className="flex-1 py-3 bg-cyan-glow hover:bg-opacity-90 hover:scale-[1.02] transition-all rounded-full text-xs uppercase tracking-wider text-deep-slate font-bold shadow-[0_0_20px_rgba(0,242,255,0.25)]"
                    >
                      Resapi Rasa
                    </button>
                  ) : (
                    selectedBadge.path && (
                      <button 
                        onClick={() => {
                          setSelectedBadge(null);
                          navigate(selectedBadge.path);
                        }}
                        className="flex-1 py-3 bg-gradient-to-r from-cyan-glow/20 to-indigo-500/20 hover:from-cyan-glow/30 hover:to-indigo-500/30 border border-cyan-glow/30 hover:border-cyan-glow/50 text-cyan-glow hover:scale-[1.02] transition-all rounded-full text-xs uppercase tracking-wider font-bold shadow-[0_0_15px_rgba(0,242,255,0.1)] flex items-center justify-center gap-1.5 animate-pulse"
                      >
                        <span>{selectedBadge.actionLabel || 'Mulai'}</span>
                        <ArrowRight size={14} />
                      </button>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GlassCard({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("glass-panel p-8", className)}
    >
      {children}
    </motion.div>
  );
}
