import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Wind, ShieldCheck, X, BookOpen, Heart, Activity } from 'lucide-react';
import BreathingOrb from '../components/BreathingOrb';
import BackgroundParticles from '../components/BackgroundParticles';

export default function LandingPage() {
  const navigate = useNavigate();
  const [showPhilosophy, setShowPhilosophy] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-6 bg-[#050505]">
      <BackgroundParticles />
      
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-900/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="relative z-10 text-center max-w-4xl"
      >
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="mb-8"
        >
          <BreathingOrb className="mx-auto" />
        </motion.div>

        <h1 className="text-6xl md:text-8xl font-light tracking-tighter text-white mb-4">
          NIRMANA
        </h1>
        <p className="text-xl md:text-2xl text-slate-400 font-light tracking-wide mb-8">
          Protokol Kintsugi: <span className="text-slate-200">“Jangan lacak hidupmu. Rasakan.”</span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Wind, title: "Portal Napas", desc: "Sinkronisasi bio-ritme interaktif" },
            { icon: Sparkles, title: "AI Emosional", desc: "Restorasi sedalam jiwa" },
            { icon: ShieldCheck, title: "Privasi Aman", desc: "Kerahasiaan sebagai sanctuary" }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.2 }}
              className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10"
            >
              <feature.icon className="w-6 h-6 text-cyan-400 mb-3 mx-auto" />
              <h3 className="text-white font-medium mb-1">{feature.title}</h3>
              <p className="text-slate-400 text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/login')}
            className="px-8 py-4 bg-white text-black rounded-full font-medium flex items-center justify-center gap-2 transition-shadow hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] cursor-pointer"
          >
            Mulai Sekarang <ArrowRight size={18} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowPhilosophy(true)}
            className="px-8 py-4 bg-transparent border border-white/20 text-white rounded-full font-light hover:bg-white/5 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <BookOpen size={16} className="text-cyan-400" />
            Pelajari Filosofi
          </motion.button>
        </div>
      </motion.div>

      {/* Kintsugi Philosophy Modal Overlay */}
      <AnimatePresence>
        {showPhilosophy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPhilosophy(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative z-10 w-full max-w-2xl bg-[#0a0a0c]/90 border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl overflow-y-auto max-h-[85vh] custom-scrollbar"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowPhilosophy(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="space-y-6">
                <div className="flex items-center gap-3 text-cyan-400">
                  <BookOpen size={24} className="animate-pulse" />
                  <span className="text-xs uppercase tracking-[0.3em] font-medium">Filosofi Kintsugi kami</span>
                </div>

                <h2 className="text-3xl md:text-4xl font-light text-white tracking-tight leading-tight">
                  Seni Menghargai Ketidaksempurnaan Jiwa
                </h2>

                <p className="text-slate-350 text-base md:text-lg font-serif italic leading-relaxed border-l-2 border-cyan-400/50 pl-4 py-1">
                  "Kintsugi (金継ぎ) adalah tradisi kuno di Jepang untuk merekatkan tembikar yang retak menggunakan emas cair. Alih-alih menyembunyikan pecahannya, garis retas itu justru dirayakan sebagai bagian dari keindahan bernilai tinggi."
                </p>

                <div className="text-slate-400 text-sm md:text-base font-light space-y-4 leading-relaxed">
                  <p>
                    Terkadang, hidup meretakkan impian, semangat, bahkan ketenangan batin kita. Nirmana hadir bukan untuk menghukum masa lalu Anda, melainkan menyatukan sisa-sisa semangat tersebut menjadi sebuah mahakarya baru.
                  </p>
                  <p>
                    Kami menyatukan meditasi pernapasan spiritual dengan kesadaran emosional modern untuk memulihkan kebahagiaan Anda secara bertahap:
                  </p>
                </div>

                {/* Key Aspects list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex gap-3">
                    <Activity size={20} className="text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-white text-sm font-medium mb-1">Harmonisasi Pernapasan</h4>
                      <p className="text-slate-400 text-xs font-light leading-relaxed">
                        Seimbangkan detak kehidupan secara langsung melalui kesadaran napas ritual.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex gap-3">
                    <Sparkles size={20} className="text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-white text-sm font-medium mb-1">Apresiasi & Gema AI</h4>
                      <p className="text-slate-400 text-xs font-light leading-relaxed">
                        Kami merangkul setiap ceritamu dengan balutan kehangatan, optimisme, dan motivasi.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex gap-3">
                    <Heart size={20} className="text-fuchsia-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-white text-sm font-medium mb-1">Gema Emosi Jelas</h4>
                      <p className="text-slate-400 text-xs font-light leading-relaxed">
                        Kenali dan hargai pasang-surut batin Anda dalam analisis grafik mingguan.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex gap-3">
                    <ShieldCheck size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-white text-sm font-medium mb-1">Suci & Terjaga</h4>
                      <p className="text-slate-400 text-xs font-light leading-relaxed">
                        Kisah Anda adalah sakral, disimpan aman tanpa celah di database pribadi Anda.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Interactive Action or Close */}
                <div className="pt-6 flex flex-col sm:flex-row items-center gap-4 justify-between border-t border-white/5">
                  <span className="text-xs text-slate-500 italic">
                    "Setiap retakan adalah jalan masuknya cahaya baru."
                  </span>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowPhilosophy(false)}
                      className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs rounded-full border border-white/10 transition-colors cursor-pointer"
                    >
                      Kembali ke Beranda
                    </button>
                    <button
                      onClick={() => {
                        setShowPhilosophy(false);
                        navigate('/login');
                      }}
                      className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-medium text-xs rounded-full shadow-[0_0_15px_rgba(6,182,212,0.2)] flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      Mulai Pemulihan <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
