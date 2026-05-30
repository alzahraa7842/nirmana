import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  Wind, 
  Palette, 
  PenTool, 
  Flower2, 
  Mic2, 
  LogOut,
  User,
  CloudRain,
  Sun,
  Cloud,
  Moon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useCircadian } from '../hooks/useCircadian';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Beranda', path: '/app' },
  { icon: Wind, label: 'Portal Napas', path: '/app/breathing' },
  { icon: Palette, label: 'Kanvas Emosi', path: '/app/canvas' },
  { icon: PenTool, label: 'Jurnal Retak', path: '/app/journal' },
  { icon: Flower2, label: 'Taman Pemulihan', path: '/app/garden' },
  { icon: Mic2, label: 'Suasana Alam Zen', path: '/app/soundscape' },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const phase = useCircadian();
  const [photoURL, setPhotoURL] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const userRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setPhotoURL(doc.data().photoURL || null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-deep-slate">
      {/* Sidebar */}
      <aside className="w-20 md:w-24 border-r border-white/5 flex flex-col items-center py-8 z-10 transition-all bg-black/40">
        <div className="mb-12 font-bold text-2xl tracking-tighter text-cyan-glow">N</div>

        <nav className="flex-1 flex flex-col items-center space-y-8 w-full mt-8">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                title={item.label}
                className={cn(
                  "w-12 h-12 flex items-center justify-center rounded-xl transition-all border group relative",
                  isActive 
                    ? "bg-cyan-glow/10 border-cyan-glow/40 text-cyan-glow shadow-[0_0_15px_rgba(0,242,255,0.2)]" 
                    : "bg-white/[0.03] border-white/5 text-slate-500 hover:border-white/20 hover:text-slate-300"
                )}
              >
                <item.icon size={20} className="transition-transform group-hover:scale-110" />
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active"
                    className="absolute -left-4 w-1 h-6 bg-cyan-glow rounded-full shadow-[0_0_10px_rgba(0,242,255,0.5)]"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="w-10 h-px bg-white/10 my-10" />

        <div className="flex flex-col items-center space-y-8 pb-10">
          <Link 
            to="/app/profile" 
            className={cn(
              "w-12 h-12 flex items-center justify-center rounded-xl transition-all border group relative overflow-hidden",
              location.pathname === '/app/profile'
                ? "bg-cyan-glow/10 border-cyan-glow/40 text-cyan-glow shadow-[0_0_15px_rgba(0,242,255,0.2)]" 
                : "bg-white/[0.03] border-white/5 text-slate-500 hover:border-white/20 hover:text-slate-300"
            )}
          >
            {photoURL ? (
              <img src={photoURL} alt="Profile" className="w-full h-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
            ) : (
              <User size={20} className="transition-transform group-hover:scale-110" />
            )}
            {location.pathname === '/app/profile' && (
              <motion.div 
                layoutId="sidebar-active"
                className="absolute -left-4 w-1 h-6 bg-cyan-glow rounded-full shadow-[0_0_10px_rgba(0,242,255,0.5)]"
              />
            )}
          </Link>
          <button 
            onClick={handleLogout}
            title="Keluar"
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/5 text-rose-500/50 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
          >
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Topbar */}
        <header className="px-10 py-8 flex justify-between items-center z-20">
          <div className="flex flex-col">
            <h1 className="text-4xl font-light tracking-tight text-white flex items-center gap-3">
              Nirmana <span className="italic font-serif text-2xl text-gold/60">Protokol Kintsugi</span>
            </h1>
            <p className="text-slate-500 text-xs tracking-[0.2em] uppercase mt-1">Antarmuka Harmoni Emosional v2.4</p>
          </div>
          
          <div className="flex space-x-12 items-center">
            <div className="text-right">
              <div className="text-cyan-glow text-xs font-semibold uppercase tracking-wider mb-1 flex items-center justify-end">
                <span className="w-2 h-2 rounded-full bg-cyan-glow shadow-[0_0_8px_rgba(0,242,255,0.8)] mr-2"></span>
                Langit Cerah Tenang
              </div>
              <div className="text-slate-400 text-sm font-light">Detak Saat Ini: 64 BPM</div>
            </div>
            <Link to="/app/profile" className="w-12 h-12 rounded-full border border-white/20 p-1 bg-white/5 overflow-hidden group">
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-violet-500 to-cyan-glow flex items-center justify-center overflow-hidden">
                {photoURL ? (
                  <img src={photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User size={20} className="text-white/40" />
                )}
              </div>
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-10 pb-10 relative z-10 custom-scrollbar">
          <Outlet />
        </div>

        {/* Ambient Subtle Noise Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-50"></div>
      </main>
    </div>
  );
}
