import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Trash2, Sparkles, Brain, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { analyzeCanvasDrawing } from '../lib/gemini';

export default function EmotionalCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#93c5fd';
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setReport(null);
  };

  const analyze = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsAnalyzing(true);
    try {
      const imageData = canvas.toDataURL("image/png");
      const analysis = await analyzeCanvasDrawing(imageData);
      if (analysis) {
        setReport(analysis);
      }
    } catch (error) {
      console.error("Analysis Failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-sm uppercase tracking-[0.4em] text-cyan-400 mb-2">Kanvas Emosi</h2>
          <h1 className="text-4xl font-light text-white tracking-tight">Ekspresikan yang Tak Terucap</h1>
        </div>
        <div className="flex gap-3">
           <button onClick={clearCanvas} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 transition-colors">
              <Trash2 size={20} />
           </button>
           <button 
             onClick={analyze}
             disabled={isAnalyzing}
             className="px-8 py-4 bg-cyan-400 text-black rounded-2xl font-medium flex items-center gap-2 hover:bg-cyan-300 disabled:opacity-50 transition-all"
           >
              {isAnalyzing ? <Loader2 className="animate-spin text-black" size={20} /> : <Brain size={20} />}
              {isAnalyzing ? "AI Sedang Merasakan..." : "Analisis Esensi"}
           </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[400px]">
        <div className="lg:col-span-3 relative h-full">
          <canvas 
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-full bg-black/40 rounded-[2.5rem] border border-white/5 cursor-crosshair touch-none"
          />
          <div className="absolute top-8 left-8 pointer-events-none">
            <span className="text-slate-500 text-xs uppercase tracking-widest font-light">Gambarkan kondisi Anda saat ini di sini</span>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            {report ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-6"
              >
                <div>
                  <h3 className="text-slate-400 text-xs uppercase tracking-widest mb-4">Kondisi Terdeteksi</h3>
                  <p className="text-2xl text-white font-light">{report.state}</p>
                </div>
                
                <div className="space-y-4">
                  {report.metrics.map((m: any, i: number) => (
                    <div key={i} className="flex justify-between border-b border-white/5 pb-2">
                       <span className="text-slate-500 text-xs uppercase">{m.label === 'Kinetic Energy' ? 'Energi Kinetik' : m.label === 'Stroke Rhythm' ? 'Ritme Goresan' : 'Ketegangan Spasial'}</span>
                       <span className="text-slate-200 text-xs font-light">{m.value === 'Moderate' ? 'Sedang' : m.value === 'Fluid' ? 'Mengalir' : 'Rendah'}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
                  <p className="text-sm text-cyan-200/80 font-light leading-relaxed">
                    {report.recommendation === 'Your strokes indicate a state of growing clarity. We recommend a 5-minute morning meditation to solidify this inner peace.' 
                      ? 'Goresan Anda menunjukkan kejernihan yang terus tumbuh. Kami merekomendasikan meditasi pagi selama 5 menit untuk memperkuat kedamaian batin ini.' 
                      : report.recommendation}
                  </p>
                </div>

                <button className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white text-sm transition-colors border border-white/5">
                  Sinkronkan dengan Suasana Alam
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 border border-dashed border-white/10 rounded-[2.5rem] h-full flex flex-col items-center justify-center text-center text-slate-500"
              >
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <Palette size={20} />
                </div>
                <p className="text-sm font-light">Goresan Anda akan diubah menjadi titik data emosional.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
