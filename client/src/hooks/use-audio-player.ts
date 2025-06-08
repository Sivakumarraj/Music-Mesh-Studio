import { useState, useRef, useCallback, useEffect } from "react";

interface UseAudioPlayerOptions {
  volume?: number;
  loop?: boolean;
}

interface UseAudioPlayerReturn {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  loadAudio: (audioData: string) => void;
  error: string | null;
}

export function useAudioPlayer(
  options: UseAudioPlayerOptions = {}
): UseAudioPlayerReturn {
  const { volume: initialVolume = 1, loop = false } = options;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(initialVolume);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateTime = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const startTimeUpdate = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(updateTime, 100);
  }, [updateTime]);

  const stopTimeUpdate = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const loadAudio = useCallback((audioData: string) => {
    try {
      setError(null);
      
      // Convert base64 to blob
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/webm' });
      const audioUrl = URL.createObjectURL(blob);

      // Clean up existing audio
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.loop = loop;
      audio.volume = volume;

      audio.onloadedmetadata = () => {
        setDuration(audio.duration);
      };

      audio.onplay = () => {
        setIsPlaying(true);
        startTimeUpdate();
      };

      audio.onpause = () => {
        setIsPlaying(false);
        stopTimeUpdate();
      };

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        stopTimeUpdate();
      };

      audio.onerror = () => {
        setError('Failed to load audio');
        setIsPlaying(false);
        stopTimeUpdate();
      };

      audio.ontimeupdate = updateTime;

    } catch (err) {
      console.error('Error loading audio:', err);
      setError('Failed to load audio data');
    }
  }, [loop, volume, startTimeUpdate, stopTimeUpdate, updateTime]);

  const play = useCallback(async () => {
    if (!audioRef.current) {
      setError('No audio loaded');
      return;
    }

    try {
      setError(null);
      await audioRef.current.play();
    } catch (err) {
      console.error('Error playing audio:', err);
      setError('Failed to play audio');
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(time, duration));
    }
  }, [duration]);

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimeUpdate();
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
    };
  }, [stopTimeUpdate]);

  return {
    isPlaying,
    currentTime,
    duration,
    volume,
    play,
    pause,
    stop,
    seek,
    setVolume,
    loadAudio,
    error
  };
}
