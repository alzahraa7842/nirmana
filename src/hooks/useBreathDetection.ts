import { useState, useEffect, useRef } from 'react';

export function useBreathDetection() {
  const [intensity, setIntensity] = useState(0); // 0 to 100
  const [isCalibrated, setIsCalibrated] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startDetection = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyzerRef.current = audioContextRef.current.createAnalyser();
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      analyzerRef.current.fftSize = 256;
      const bufferLength = analyzerRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      
      sourceRef.current.connect(analyzerRef.current);
      setIsCalibrated(true);

      const detect = () => {
        if (!analyzerRef.current || !dataArrayRef.current) return;
        
        analyzerRef.current.getByteFrequencyData(dataArrayRef.current);
        
        // Focus on mid-high frequencies typical of wind/breath (2000Hz+)
        // By taking a slice of the higher bins
        const slice = dataArrayRef.current.slice(10, 60);
        const average = slice.reduce((a, b) => a + b) / slice.length;
        
        // Map average (0-255) to intensity (0-100) with a noise floor
        const mapping = Math.max(0, (average - 15) * 1.5);
        setIntensity(Math.min(100, Math.round(mapping)));
        
        animationFrameRef.current = requestAnimationFrame(detect);
      };

      detect();
    } catch (err) {
      console.error("Microphone access denied", err);
      setIsCalibrated(false);
    }
  };

  const stopDetection = async () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        await audioContextRef.current.close();
      } catch (err) {
        console.warn("AudioContext already closed or error closing:", err);
      }
    }
    
    audioContextRef.current = null;
    analyzerRef.current = null;
    dataArrayRef.current = null;
    sourceRef.current = null;
    setIsCalibrated(false);
  };

  return { intensity, isCalibrated, startDetection, stopDetection };
}
