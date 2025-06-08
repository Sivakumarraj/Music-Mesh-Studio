import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Mic, 
  Download, 
  Settings,
  Users
} from "lucide-react";
import SettingsModal from "./settings-modal";
import { type RoomWithParticipants, type LoopWithUser } from "@shared/schema";

interface SidebarProps {
  room: RoomWithParticipants;
  loops: LoopWithUser[];
  isPlaying: boolean;
  onTogglePlayback: () => void;
  onStartRecording: () => void;
  onExportMixdown: () => void;
  onRefreshLoops: () => void;
}

export default function Sidebar({ 
  room, 
  loops, 
  isPlaying, 
  onTogglePlayback, 
  onStartRecording, 
  onExportMixdown,
  onRefreshLoops 
}: SidebarProps) {
  const [showSettings, setShowSettings] = useState(false);
  const activeTracks = loops.filter(loop => loop.isActive);
  const totalDuration = Math.max(...loops.map(l => l.duration), 0);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getParticipantStatus = (participant: any) => {
    const now = new Date();
    const lastActive = new Date(participant.lastActiveAt);
    const minutesAgo = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60));
    
    if (minutesAgo < 2) return { status: "Recording...", color: "success" };
    if (minutesAgo < 5) return { status: "Listening", color: "accent" };
    return { status: `${minutesAgo}m ago`, color: "gray-500" };
  };

  return (
    <aside className="w-80 bg-dark-light border-r border-surface/20 flex flex-col">
      {/* Room Controls */}
      <div className="p-6 border-b border-surface/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-poppins font-semibold text-lg">Room Controls</h2>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowSettings(true)}
            className="hover:bg-surface/20"
          >
            <Settings className="w-4 h-4 text-gray-400" />
          </Button>
        </div>

        {/* Transport Controls */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="w-12 h-12 rounded-full bg-surface/20 hover:bg-surface/40"
          >
            <SkipBack className="w-5 h-5 text-gray-300" />
          </Button>
          
          <Button
            onClick={onTogglePlayback}
            className="w-16 h-16 btn-gradient rounded-full hover:opacity-80"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white ml-1" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-12 h-12 rounded-full bg-surface/20 hover:bg-surface/40"
          >
            <SkipForward className="w-5 h-5 text-gray-300" />
          </Button>
        </div>

        {/* Session Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-surface/10 rounded-lg p-3">
            <div className="font-mono text-2xl font-bold text-accent">{room.bpm}</div>
            <div className="text-xs text-gray-400">BPM</div>
          </div>
          <div className="bg-surface/10 rounded-lg p-3">
            <div className="font-mono text-2xl font-bold text-secondary">
              {room.keySignature.replace(" Major", "M").replace(" Minor", "m")}
            </div>
            <div className="text-xs text-gray-400">Key</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <Button 
            onClick={onStartRecording}
            className="w-full bg-primary hover:bg-primary/80 text-white py-3"
          >
            <Mic className="w-4 h-4 mr-2" />
            Start Recording
          </Button>
          <Button 
            onClick={onExportMixdown}
            variant="outline" 
            className="w-full border-surface/40 hover:bg-surface/20 text-gray-300 py-3"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Mixdown
          </Button>
        </div>
      </div>

      {/* Active Users */}
      <div className="p-6 flex-1">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="w-4 h-4 text-gray-400" />
          <h3 className="font-poppins font-semibold text-sm text-gray-400 uppercase tracking-wide">
            Active Collaborators
          </h3>
        </div>
        
        <div className="space-y-3">
          {room.participants.map((participant) => {
            const { status, color } = getParticipantStatus(participant);
            
            return (
              <div 
                key={participant.id} 
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-surface/10 transition-colors"
              >
                <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-white">
                    {participant.user.username.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{participant.user.username}</div>
                  <div className="text-xs text-gray-400">{status}</div>
                </div>
                <div className={`w-2 h-2 rounded-full ${
                  color === "success" ? "bg-success" :
                  color === "accent" ? "bg-accent" : 
                  "bg-gray-500"
                }`} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Room Stats */}
      <div className="p-6 border-t border-surface/20">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="font-mono text-lg font-bold text-accent">{loops.length}</div>
            <div className="text-xs text-gray-400">Loops</div>
          </div>
          <div>
            <div className="font-mono text-lg font-bold text-secondary">{activeTracks.length}</div>
            <div className="text-xs text-gray-400">Active</div>
          </div>
          <div>
            <div className="font-mono text-lg font-bold text-success">
              {formatTime(totalDuration)}
            </div>
            <div className="text-xs text-gray-400">Length</div>
          </div>
        </div>
      </div>

      <SettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
        room={room}
        loops={loops}
        onRefreshLoops={onRefreshLoops}
      />
    </aside>
  );
}
