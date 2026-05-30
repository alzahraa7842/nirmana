import { useRef, useState, useCallback } from 'react';

export type SoundscapeType = 'rain' | 'forest' | 'echo' | 'wind';

export function useProceduralAudio() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mainGainRef = useRef<GainNode | null>(null);
  const activeSourcesRef = useRef<Record<SoundscapeType, { sources: AudioNode[], gain: GainNode } | null>>({
    rain: null,
    forest: null,
    echo: null,
    wind: null
  });
  const [activeTypes, setActiveTypes] = useState<Set<SoundscapeType>>(new Set());
  const [volumes, setVolumes] = useState<Record<SoundscapeType, number>>({
    rain: 0.5,
    forest: 0.5,
    echo: 0.5,
    wind: 0.5
  });

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      mainGainRef.current = audioCtxRef.current.createGain();
      mainGainRef.current.connect(audioCtxRef.current.destination);
      mainGainRef.current.gain.setValueAtTime(1, audioCtxRef.current.currentTime);
    }
  };

  const createWhiteNoise = (ctx: AudioContext) => {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;
    whiteNoise.loop = true;
    return whiteNoise;
  };

  const playRain = (ctx: AudioContext, destination: AudioNode) => {
    const noise = createWhiteNoise(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    
    const rumble = ctx.createOscillator();
    rumble.type = 'triangle';
    rumble.frequency.setValueAtTime(40, ctx.currentTime);
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.2, ctx.currentTime);
    
    noise.connect(filter);
    filter.connect(destination);
    rumble.connect(rumbleGain);
    rumbleGain.connect(destination);
    
    noise.start();
    rumble.start();
    return [noise, rumble];
  };

  const playForest = (ctx: AudioContext, destination: AudioNode) => {
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(220, ctx.currentTime);
    
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.5, ctx.currentTime);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(20, ctx.currentTime);
    
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    
    osc1.connect(destination);
    osc1.start();
    lfo.start();
    return [osc1, lfo];
  };

  const playWind = (ctx: AudioContext, destination: AudioNode) => {
    const noise = createWhiteNoise(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, ctx.currentTime);
    filter.Q.setValueAtTime(10, ctx.currentTime);

    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.1, ctx.currentTime);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(300, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noise.connect(filter);
    filter.connect(destination);

    noise.start();
    lfo.start();
    return [noise, lfo];
  };

  const stop = useCallback((type: SoundscapeType) => {
    const active = activeSourcesRef.current[type];
    if (active && audioCtxRef.current) {
      active.gain.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.5);
      setTimeout(() => {
        active.sources.forEach(s => {
          try { (s as any).stop(); } catch(e) {}
        });
        activeSourcesRef.current[type] = null;
        setActiveTypes(prev => {
          const next = new Set(prev);
          next.delete(type);
          return next;
        });
      }, 600);
    }
  }, []);

  const play = useCallback((type: SoundscapeType) => {
    initAudio();
    const ctx = audioCtxRef.current!;
    const mainDest = mainGainRef.current!;

    if (activeTypes.has(type)) {
      stop(type);
      return;
    }

    ctx.resume();
    const typeGain = ctx.createGain();
    typeGain.connect(mainDest);
    typeGain.gain.setValueAtTime(0, ctx.currentTime);
    typeGain.gain.setTargetAtTime(volumes[type], ctx.currentTime, 1);

    let newSources: AudioNode[] = [];
    switch(type) {
      case 'rain': newSources = playRain(ctx, typeGain); break;
      case 'forest': newSources = playForest(ctx, typeGain); break;
      case 'wind': newSources = playWind(ctx, typeGain); break;
      case 'echo': newSources = playForest(ctx, typeGain); break; // Placeholder
    }

    activeSourcesRef.current[type] = { sources: newSources, gain: typeGain };
    setActiveTypes(prev => new Set(prev).add(type));
  }, [activeTypes, stop, volumes]);

  const setVolume = useCallback((type: SoundscapeType, value: number) => {
    setVolumes(prev => ({ ...prev, [type]: value }));
    const active = activeSourcesRef.current[type];
    if (active && audioCtxRef.current) {
      active.gain.gain.setTargetAtTime(value, audioCtxRef.current.currentTime, 0.1);
    }
  }, []);

  const stopAll = useCallback(() => {
    (Object.keys(activeSourcesRef.current) as SoundscapeType[]).forEach(type => {
      stop(type);
    });
  }, [stop]);

  return { play, stop, stopAll, activeTypes, volumes, setVolume };
}
