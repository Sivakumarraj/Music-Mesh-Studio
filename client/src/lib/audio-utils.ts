export const convertBlobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get just the base64 data
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const convertBase64ToBlob = (base64: string, mimeType: string = 'audio/webm'): Blob => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const generateWaveformData = (audioData: string, bars: number = 50): number[] => {
  // Generate deterministic waveform based on audio data hash
  const hash = audioData.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const data = [];
  for (let i = 0; i < bars; i++) {
    const seed = Math.abs(hash + i * 1000);
    const height = (seed % 80) + 20; // Heights between 20-100%
    data.push(height);
  }
  
  return data;
};

export const checkAudioSupport = (): {
  mediaRecorder: boolean;
  webAudio: boolean;
  getUserMedia: boolean;
} => {
  return {
    mediaRecorder: typeof MediaRecorder !== 'undefined',
    webAudio: typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined',
    getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  };
};

export const requestMicrophonePermission = async (): Promise<boolean> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Microphone permission denied:', error);
    return false;
  }
};

export const exportMixdown = async (loops: Array<{ audioData: string; volume: number; isActive: boolean }>): Promise<Blob> => {
  // This is a simplified implementation
  // In a real application, you would use Web Audio API to mix the tracks
  
  const activeLoops = loops.filter(loop => loop.isActive);
  
  if (activeLoops.length === 0) {
    throw new Error('No active loops to export');
  }
  
  // For now, just return the first active loop as the "mixdown"
  // In reality, you'd combine all audio tracks using AudioContext
  const firstLoop = activeLoops[0];
  return convertBase64ToBlob(firstLoop.audioData);
};
