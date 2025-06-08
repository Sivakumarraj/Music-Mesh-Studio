import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Volume2, Expand, Plus } from "lucide-react";
import TrackItem from "./track-item";
import { type RoomWithParticipants, type LoopWithUser } from "@shared/schema";

interface StudioWorkspaceProps {
  room: RoomWithParticipants;
  loops: LoopWithUser[];
  onRefreshLoops: () => void;
  onStartRecording: () => void;
}

export default function StudioWorkspace({ 
  room, 
  loops, 
  onRefreshLoops, 
  onStartRecording 
}: StudioWorkspaceProps) {
  const activeTracks = loops.filter(loop => loop.isActive);
  const totalDuration = Math.max(...loops.map(l => l.duration), 0);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      {/* Studio Header */}
      <div className="bg-dark-light border-b border-surface/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <h2 className="font-poppins font-semibold text-lg">Studio Workspace</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Expand className="w-4 h-4 text-gray-400" />
              </Button>
              <div className="font-mono text-sm text-gray-400">
                0:00 / {formatTime(totalDuration)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-surface/20 rounded-lg p-1">
            <Badge variant="default" className="bg-primary text-white">
              Tracks
            </Badge>
            <Button variant="ghost" size="sm" className="text-gray-400">
              Mixer
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-gray-400" />
            <div className="w-20 h-2 bg-surface/20 rounded-full">
              <div className="w-3/4 h-full bg-gradient-to-r from-accent to-primary rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Track Area */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {loops.map((loop) => (
            <TrackItem 
              key={loop.id} 
              loop={loop} 
              onRefresh={onRefreshLoops}
            />
          ))}

          {/* Empty Track Slot */}
          <div className="bg-surface/5 border-2 border-dashed border-surface/20 rounded-xl p-8 text-center hover:border-primary/30 transition-colors">
            <Plus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-medium text-gray-300 mb-2">Add New Track</h3>
            <p className="text-sm text-gray-400 mb-4">
              Record a new loop or drag audio files here
            </p>
            <Button 
              onClick={onStartRecording}
              className="bg-primary hover:bg-primary/80 text-white"
            >
              Start Recording
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
