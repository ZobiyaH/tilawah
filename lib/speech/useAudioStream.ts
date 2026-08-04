/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { registerAudioContext, unregisterAudioContext } from "./audioRegistry";
import { useRecitationStore } from "../store/recitationStore";

/**
 * Custom hook to manage the media microphone stream and Web Audio analyser node.
 */
export function useAudioStream(isListening: boolean) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const micGain = useRecitationStore((state) => state.micGain);

  // Dynamic real-time adjustment of gain without tearing down the media stream
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(micGain, audioCtxRef.current.currentTime);
      console.log("Mic gain sensitivity updated dynamically to:", micGain);
    }
  }, [micGain]);

  useEffect(() => {
    if (!isListening) {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        unregisterAudioContext();
        audioCtxRef.current.close();
      }
      audioCtxRef.current = null;
      analyserRef.current = null;
      gainNodeRef.current = null;
      return;
    }

    let active = true;

    async function initStream() {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true
        });
        if (!active) {
          audioStream.getTracks().forEach((track) => track.stop());
          return;
        }

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        const ctx = new AudioContextClass();
        if (ctx.state === "suspended") {
          await ctx.resume();
        }
        const analyserNode = ctx.createAnalyser();
        analyserNode.fftSize = 256;

        const source = ctx.createMediaStreamSource(audioStream);
        
        // 2.5x gain boost node
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(micGain, ctx.currentTime);
        gainNodeRef.current = gainNode;

        // DynamicsCompressorNode to limit extreme peak feedback
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-50, ctx.currentTime);
        compressor.knee.setValueAtTime(40, ctx.currentTime);
        compressor.ratio.setValueAtTime(12, ctx.currentTime);
        compressor.attack.setValueAtTime(0, ctx.currentTime);
        compressor.release.setValueAtTime(0.25, ctx.currentTime);

        // Connections: source -> gainNode -> compressor -> analyser
        source.connect(gainNode);
        gainNode.connect(compressor);
        compressor.connect(analyserNode);

        registerAudioContext(ctx);
        audioCtxRef.current = ctx;
        analyserRef.current = analyserNode;
        setStream(audioStream);
      } catch (err) {
        console.error("Failed to initialize audio stream:", err);
      }
    }

    initStream();

    return () => {
      active = false;
      unregisterAudioContext();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]); // Keep dependency array minimal to prevent requests loop

  return { stream, analyser: analyserRef.current };
}
