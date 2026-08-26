import { useEffect, useRef } from 'react';
import { useTourStore } from '../../stores/useTourStore';

export function AudioAmbience() {
  const isAudioMuted = useTourStore((state) => state.isAudioMuted);
  const audioVolume = useTourStore((state) => state.audioVolume);
  const contextRef = useRef(null);
  const gainRef = useRef(null);
  const sourceRef = useRef(null);

  useEffect(() => {
    // If context was closed (e.g. from previous cleanup), reset refs
    if (contextRef.current && contextRef.current.state === 'closed') {
      contextRef.current = null;
      gainRef.current = null;
      sourceRef.current = null;
    }

    if (!isAudioMuted && !contextRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return undefined;
      try {
        const context = new AudioContext();
        const gain = context.createGain();
        const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
        const output = buffer.getChannelData(0);
        let previous = 0;
        for (let index = 0; index < output.length; index += 1) {
          previous = previous * 0.985 + (Math.random() * 2 - 1) * 0.015;
          output[index] = previous * 0.12;
        }
        const source = context.createBufferSource();
        const filter = context.createBiquadFilter();
        source.buffer = buffer;
        source.loop = true;
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(context.destination);
        gain.gain.value = audioVolume * 0.15;
        source.start();
        contextRef.current = context;
        gainRef.current = gain;
        sourceRef.current = source;
      } catch (error) {
        console.warn('Audio ambience tidak tersedia:', error);
      }
    }

    const context = contextRef.current;
    const gain = gainRef.current;
    if (context && gain && context.state !== 'closed') {
      if (!isAudioMuted && !document.hidden) {
        if (context.state === 'suspended') context.resume().catch(() => {});
        gain.gain.setTargetAtTime(audioVolume * 0.15, context.currentTime, 0.1);
      } else {
        gain.gain.setTargetAtTime(0, context.currentTime, 0.1);
        if (isAudioMuted && context.state === 'running') {
          context.suspend().catch(() => {});
        }
      }
    }
    return undefined;
  }, [audioVolume, isAudioMuted]);

  useEffect(() => {
    const handleVisibility = () => {
      const context = contextRef.current;
      if (!context || context.state === 'closed') return;
      if (document.hidden) {
        context.suspend().catch(() => {});
      } else if (!useTourStore.getState().isAudioMuted && context.state === 'suspended') {
        context.resume().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      try { sourceRef.current?.stop(); } catch { /* source may already be stopped */ }
      sourceRef.current?.disconnect();
      gainRef.current?.disconnect();
      contextRef.current?.close().catch(() => {});
      sourceRef.current = null;
      gainRef.current = null;
      contextRef.current = null;
    };
  }, []);

  return null;
}
