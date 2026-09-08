/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import { registerAudioContext, unregisterAudioContext } from './audioRegistry';
import { useRecitationStore } from '../store/recitationStore';

/**
 * Custom hook to manage the media microphone stream and Web Audio analyser node with mobile resilience.
 */
export function useAudioStream(isListening: boolean) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const micGain = useRecitationStore((state) => state.micGain);

  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      try {
        gainNodeRef.current.gain.setValueAtTime(micGain, audioCtxRef.current.currentTime);
      } catch {}
    }
  }, [micGain]);

  useEffect(() => {
    if (!isListening) {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        unregisterAudioContext();
        audioCtxRef.current.close().catch(() => {});
      }
      audioCtxRef.current = null;
      analyserRef.current = null;
      gainNodeRef.current = null;
      return;
    }

    let active = true;

    async function initStream() {
      try {
        // Mobile-resilient audio constraints without rigid sampleRate that crashes mobile iOS/Android
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: false,
            autoGainControl: true,
            channelCount: 1,
          }
        });
        if (!active) {
          audioStream.getTracks().forEach((track) => track.stop());
          return;
        }

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        const ctx = new AudioContextClass();
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
        const analyserNode = ctx.createAnalyser();
        analyserNode.fftSize = 256;

        const source = ctx.createMediaStreamSource(audioStream);
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(micGain, ctx.currentTime);
        gainNodeRef.current = gainNode;

        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-50, ctx.currentTime);
        compressor.knee.setValueAtTime(40, ctx.currentTime);
        compressor.ratio.setValueAtTime(12, ctx.currentTime);
        compressor.attack.setValueAtTime(0, ctx.currentTime);
        compressor.release.setValueAtTime(0.25, ctx.currentTime);

        source.connect(gainNode);
        gainNode.connect(compressor);
        compressor.connect(analyserNode);

        registerAudioContext(ctx);
        audioCtxRef.current = ctx;
        analyserRef.current = analyserNode;
        setStream(audioStream);
      } catch (err) {
        console.error('Failed to initialize audio stream:', err);
      }
    }

    initStream();

    return () => {
      active = false;
      unregisterAudioContext();
    };
  }, [isListening, micGain]);

  return { stream, analyser: analyserRef.current };
}
