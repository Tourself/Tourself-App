
import { useLanguage } from './contexts';
import { useState, useCallback, useRef, useEffect } from 'react';
import { geminiService, decode, decodeAudioData } from './services';

export const useTranslations = () => {
  const { t, language } = useLanguage();
  return { t, language };
};

// --- NEW TTS HOOK ---
// FIX: Cast `window` to `any` to access `webkitAudioContext` for older browser compatibility, resolving a TypeScript error.
const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
const outputNode = outputAudioContext.createGain();
outputNode.connect(outputAudioContext.destination);

export const useTTS = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const play = useCallback(async (text: string) => {
    if (isLoading || isPlaying) {
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const base64Audio = await geminiService.generateSpeech(text);
      if (!base64Audio) {
        throw new Error('No audio data received.');
      }

      const audioBuffer = await decodeAudioData(
        decode(base64Audio),
        outputAudioContext,
        24000,
        1,
      );

      // Stop any previously playing audio
      if (sourceRef.current) {
        sourceRef.current.stop();
      }

      const source = outputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(outputNode);
      source.onended = () => {
        setIsPlaying(false);
        sourceRef.current = null;
      };
      
      source.start();
      sourceRef.current = source;
      setIsPlaying(true);
      
    } catch (err) {
      console.error("TTS Error:", err);
      setError('Failed to play audio.');
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isPlaying]);

  const stop = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      // onended will set isPlaying to false
    }
  }, []);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
        if (sourceRef.current) {
            sourceRef.current.stop();
        }
    }
  }, []);

  return { play, stop, isPlaying, isLoading, error };
};