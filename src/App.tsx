/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { doc, getDocFromCache, getDocFromServer } from 'firebase/firestore';
import { db } from './lib/firebase';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import BreathingPortal from './pages/BreathingPortal';
import EmotionalCanvas from './pages/EmotionalCanvas';
import ShatteredJournal from './pages/ShatteredJournal';
import RecoveryGarden from './pages/RecoveryGarden';
import ZenSoundscape from './pages/ZenSoundscape';
import ProfilePage from './pages/ProfilePage';
import AppLayout from './layouts/AppLayout';
import HeartbeatCursor from './components/HeartbeatCursor';
import { useCircadian } from './hooks/useCircadian';
import { cn } from './lib/utils';

export default function App() {
  const phase = useCircadian();

  useEffect(() => {
    async function testConnection() {
      try {
        // First try cache, then server to be fast
        await getDocFromServer(doc(db, 'test', 'connection')).catch(() => {
          console.warn("Koneksi awal ke server Firebase lambat atau bermasalah.");
        });
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration or network status.");
        }
      }
    }
    testConnection();
  }, []);
  
  return (
    <div className={cn(
      "min-h-screen transition-all duration-[3000ms] ease-in-out selection:bg-cyan-glow/30 relative overflow-hidden",
      phase === 'morning' && "bg-slate-950 text-slate-200",
      phase === 'afternoon' && "bg-slate-900 text-slate-100",
      phase === 'evening' && "bg-[#0a0c10] text-indigo-100",
      phase === 'night' && "bg-[#050505] text-slate-400"
    )}>
      <div className="aurora-bg opacity-30" />
      <HeartbeatCursor />
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/app/*" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="breathing" element={<BreathingPortal />} />
            <Route path="canvas" element={<EmotionalCanvas />} />
            <Route path="journal" element={<ShatteredJournal />} />
            <Route path="garden" element={<RecoveryGarden />} />
            <Route path="soundscape" element={<ZenSoundscape />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  );
}
