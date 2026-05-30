import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Flower2, Sun, CloudRain, Wind, TreePine, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { useCircadian } from '../hooks/useCircadian';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function RecoveryGarden() {
  const phase = useCircadian();
  const [bloom, setBloom] = useState(64);

  useEffect(() => {
    if (!auth.currentUser) return;
    const statsPath = `users/${auth.currentUser.uid}/stats/current`;
    const unsubscribe = onSnapshot(doc(db, statsPath), (snap) => {
      if (snap.exists()) {
        setBloom(snap.data().gardenBloom || 0);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, statsPath));
    return () => unsubscribe();
  }, []);
  
  // Data representing different plants with growth factors
  const plants = [
    { 
      type: 'flower', 
      color: 'text-rose-400', 
      level: bloom, 
      delay: 0.1, 
      label: 'Mekarnya Jurnal',
      desc: 'Tumbuh dari refleksi batin Anda melalui penulisan jurnal.'
    },
    { 
      type: 'tree', 
      color: 'text-emerald-400', 
      level: Math.max(0, bloom - 20), 
      delay: 0.5, 
      label: 'Ek Meditasi',
      desc: 'Semakin kokoh dengan durasi meditasi suara yang panjang.'
    },
    { 
      type: 'flower', 
      color: 'text-cyan-400', 
      level: Math.max(0, bloom - 10), 
      delay: 0.3, 
      label: 'Lili Napas',
      desc: 'Mewangi seiring keteraturan ritme napas di portal pernapasan.'
    },
    { 
      type: 'grass', 
      color: 'text-green-500', 
      level: Math.min(100, bloom + 10), 
      delay: 0.7, 
      label: 'Lumut Konsistensi',
      desc: 'Merimbun berkat kehadiran Anda yang setia setiap hari.'
    },
  ];

  return (
    <div className="h-full flex flex-col space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-2">Taman Pulih</h2>
          <h1 className="text-4xl font-light text-white tracking-tight">Tempat suci Anda yang kian tumbuh</h1>
        </div>
        <div className="flex gap-4">
           <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
              <Sun size={16} className="text-amber-400" />
              <span className="text-[10px] uppercase font-medium text-white">8j Cahaya</span>
           </div>
           <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
              <CloudRain size={16} className="text-blue-400" />
              <span className="text-[10px] uppercase font-medium text-white">2j Hujan Refleksi</span>
           </div>
        </div>
      </div>

      <div className={cn(
        "flex-1 relative rounded-[3rem] border border-white/5 overflow-hidden transition-colors duration-[4000ms]",
        phase === 'morning' && "bg-gradient-to-b from-sky-400/20 to-emerald-900/40",
        phase === 'afternoon' && "bg-gradient-to-b from-blue-400/20 to-green-900/40",
        phase === 'evening' && "bg-gradient-to-b from-orange-400/10 to-indigo-950/60",
        phase === 'night' && "bg-gradient-to-b from-slate-900 to-black"
      )}>
        {/* Animated Background Atmosphere */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full animate-pulse" />
        </div>

        {/* The Garden Floor */}
        <div className="absolute bottom-0 w-full h-1/4 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Interactive Plants */}
        <div className="absolute bottom-12 left-12 right-12 flex justify-around items-end h-64">
           {plants.map((p, i) => (
             <div key={i} className="group relative flex flex-col items-center">
               {/* Tooltip */}
               <div className="absolute bottom-full mb-6 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-none z-30">
                  <div className="bg-deep-slate/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl w-48">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] text-cyan-glow font-bold uppercase tracking-wider">{p.label}</span>
                       <span className="text-xs text-white font-mono">{p.level}%</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-3">
                       <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${p.level}%` }}
                        className="h-full bg-cyan-glow shadow-[0_0_8px_rgba(0,242,255,0.5)]" 
                       />
                    </div>
                    <p className="text-[9px] leading-relaxed text-slate-400 font-light">
                      {p.desc}
                    </p>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-deep-slate/90 rotate-45 border-r border-b border-white/10" />
                  </div>
               </div>

               <motion.div
                 initial={{ scale: 0, y: 100 }}
                 animate={{ scale: p.level / 100, y: 0 }}
                 transition={{ duration: 2, delay: p.delay, type: "spring" }}
                 className={cn("mb-2 relative cursor-help", p.color)}
               >
                 {p.type === 'flower' && <Flower2 size={80} className="drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />}
                 {p.type === 'tree' && <TreePine size={100} className="drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]" />}
                 {p.type === 'grass' && <Sparkles size={40} className="drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />}
                 
                 {/* Glow effect on hover */}
                 <div className="absolute inset-0 bg-current opacity-0 group-hover:opacity-20 blur-xl transition-opacity rounded-full" />
               </motion.div>
               
               <div className="bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/5">
                 <span className="text-[10px] text-slate-500 uppercase tracking-widest whitespace-nowrap">{p.label}</span>
               </div>
             </div>
           ))}
        </div>

        {/* Ambient Particles */}
        <div className="absolute inset-0 pointer-events-none">
           {[...Array(15)].map((_, i) => (
             <motion.div
               key={i}
               animate={{
                 y: [0, -100, 0],
                 x: [0, (Math.random() - 0.5) * 50, 0],
                 opacity: [0, 0.5, 0],
               }}
               transition={{
                 duration: 5 + Math.random() * 5,
                 repeat: Infinity,
                 delay: Math.random() * 5,
               }}
               className="absolute w-1 h-1 bg-white/40 rounded-full"
               style={{
                 left: `${Math.random() * 100}%`,
                 bottom: `${Math.random() * 30}%`,
               }}
             />
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="p-6 bg-white/5 border border-white/5 rounded-3xl">
            <h4 className="text-slate-500 text-[10px] uppercase tracking-widest mb-2">Nutrisi Jiwa</h4>
            <div className="flex gap-2">
               <div className="w-2 h-2 bg-cyan-400 rounded-full" />
               <div className="w-2 h-2 bg-emerald-400 rounded-full" />
               <div className="w-2 h-2 bg-white/20 rounded-full" />
            </div>
         </div>
         <div className="p-6 bg-white/5 border border-white/5 rounded-3xl md:col-span-2">
            <p className="text-sm text-slate-400 font-light italic">
              “Taman Anda saat ini menunjukkan konsistensi tinggi dalam latihan pernapasan. Ek Meditasi memerlukan lebih banyak keheningan untuk mencapai kedewasaan penuh.”
            </p>
         </div>
      </div>
    </div>
  );
}
