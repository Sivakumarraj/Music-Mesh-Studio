import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Music, 
  Volume2, 
  VolumeX, 
  Headphones, 
  Trash2,
  Guitar,
  Mic
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import WaveformVisualizer from "./waveform-visualizer";
import { type LoopWithUser } from "@shared/schema";

interface TrackItemProps {
  loop: LoopWithUser;
  onRefresh: () => void;
}

export default function TrackItem({ loop, onRefresh }: TrackItemProps) {
  const [volume, setVolume] = useState(loop.volume * 100);
  const [isMuted, setIsMuted] = useState(!loop.isActive);

  const updateLoopMutation = useMutation({
    mutationFn: async (updates: Partial<{ volume: number; isActive: boolean }>) => {
      const response = await apiRequest("PATCH", `/api/loops/${loop.id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      onRefresh();
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${loop.roomId}/loops`] });
    },
  });

  const deleteLoopMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/loops/${loop.id}`);
      return response.json();
    },
    onSuccess: () => {
      onRefresh();
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${loop.roomId}/loops`] });
    },
  });

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    updateLoopMutation.mutate({ volume: newVolume / 100 });
  };

  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    updateLoopMutation.mutate({ isActive: !newMuted });
  };

  const handleDelete = () => {
    if (confirm(`Delete "${loop.name}"?`)) {
      deleteLoopMutation.mutate();
    }
  };

  const getTrackIcon = () => {
    const name = loop.name.toLowerCase();
    if (name.includes('drum')) return Music;
    if (name.includes('guitar')) return Guitar;
    if (name.includes('bass')) return Music;
    return Mic;
  };

  const getTrackColor = () => {
    const name = loop.name.toLowerCase();
    if (name.includes('drum')) return 'primary';
    if (name.includes('guitar')) return 'secondary';
    if (name.includes('bass')) return 'accent';
    return 'primary';
  };

  const TrackIcon = getTrackIcon();
  const trackColor = getTrackColor();
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCreatedAt = (date: Date) => {
    const now = new Date();
    const created = new Date(date);
    const minutesAgo = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (minutesAgo < 1) return "Just now";
    if (minutesAgo < 60) return `${minutesAgo}m ago`;
    const hoursAgo = Math.floor(minutesAgo / 60);
    if (hoursAgo < 24) return `${hoursAgo}h ago`;
    return created.toLocaleDateString();
  };

  return (
    <div className={`bg-dark-light rounded-xl p-4 border border-surface/20 ${
      isMuted ? 'opacity-60' : ''
    } transition-opacity`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            trackColor === 'primary' ? 'gradient-primary' :
            trackColor === 'secondary' ? 'gradient-secondary' :
            'gradient-accent'
          }`}>
            <TrackIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-sm">{loop.name}</h3>
            <p className="text-xs text-gray-400">
              by {loop.user.username} • {formatCreatedAt(loop.createdAt)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-surface/20"
          >
            <Headphones className="w-4 h-4 text-gray-400" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleMute}
            className="p-2 hover:bg-surface/20"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-gray-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-gray-400" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="p-2 hover:bg-surface/20 hover:text-destructive"
            disabled={deleteLoopMutation.isPending}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Waveform Visualization */}
      <div className="bg-surface/10 rounded-lg p-4 mb-3">
        <WaveformVisualizer 
          audioData={loop.audioData}
          duration={loop.duration}
          color={trackColor}
          isActive={!isMuted}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>0:00</span>
          <span>{formatTime(loop.duration / 2)}</span>
          <span>{formatTime(loop.duration)}</span>
        </div>
      </div>

      {/* Volume Control */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 flex-1">
          <Volume2 className="w-4 h-4 text-gray-400" />
          <Slider
            value={[volume]}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            className="flex-1"
            disabled={updateLoopMutation.isPending}
          />
          <Volume2 className="w-4 h-4 text-gray-400" />
        </div>
        <span className="font-mono text-sm text-gray-400 w-12">
          {Math.round(volume)}%
        </span>
      </div>
    </div>
  );
}
