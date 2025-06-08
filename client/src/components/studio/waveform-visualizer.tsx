import { useEffect, useMemo } from "react";

interface WaveformVisualizerProps {
  audioData: string; // Base64 encoded audio data
  duration: number;
  color: 'primary' | 'secondary' | 'accent';
  isActive: boolean;
}

export default function WaveformVisualizer({ 
  audioData, 
  duration, 
  color, 
  isActive 
}: WaveformVisualizerProps) {
  
  // Generate mock waveform data based on audio data hash
  const waveformData = useMemo(() => {
    // Create deterministic waveform based on audioData
    const hash = audioData.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const bars = 50;
    const data = [];
    
    for (let i = 0; i < bars; i++) {
      // Use hash and position to generate consistent heights
      const seed = Math.abs(hash + i * 1000);
      const height = (seed % 80) + 20; // Heights between 20-100%
      data.push(height);
    }
    
    return data;
  }, [audioData]);

  const getColorClass = () => {
    switch (color) {
      case 'primary':
        return 'bg-primary';
      case 'secondary':
        return 'bg-secondary';
      case 'accent':
        return 'bg-accent';
      default:
        return 'bg-primary';
    }
  };

  return (
    <div className="flex items-end justify-center h-16 space-x-1">
      {waveformData.map((height, index) => (
        <div
          key={index}
          className={`w-1 rounded-sm transition-all duration-200 ${
            isActive ? getColorClass() : 'bg-surface/40'
          }`}
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}
