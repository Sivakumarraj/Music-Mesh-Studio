import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Music, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { queryClient } from "@/lib/queryClient";
import StudioWorkspace from "@/components/studio/studio-workspace";
import Sidebar from "@/components/studio/sidebar";
import RecordingModal from "@/components/studio/recording-modal";
import { type RoomWithParticipants, type LoopWithUser } from "@shared/schema";

export default function Studio() {
  const { roomId } = useParams();
  const [currentUser] = useState({ id: 1, username: "Demo User" });
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const { data: room, isLoading, error } = useQuery<RoomWithParticipants>({
    queryKey: [`/api/rooms/${roomId}`],
    refetchInterval: 5000, // Sync every 5 seconds
    enabled: !!roomId,
  });

  const { data: loops = [], refetch: refetchLoops } = useQuery<LoopWithUser[]>({
    queryKey: [`/api/rooms/${roomId}/loops`],
    refetchInterval: 5000,
    enabled: !!roomId,
  });

  // Update activity periodically
  useEffect(() => {
    if (!roomId) return;

    const updateActivity = async () => {
      try {
        await fetch(`/api/rooms/${roomId}/activity`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUser.id }),
          credentials: "include",
        });
      } catch (error) {
        console.error("Failed to update activity:", error);
      }
    };

    const interval = setInterval(updateActivity, 30000); // Every 30 seconds
    updateActivity(); // Initial call

    return () => clearInterval(interval);
  }, [roomId, currentUser.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Music className="w-8 h-8 text-white" />
          </div>
          <p className="text-lg text-muted-foreground">Loading studio...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 bg-card border-surface/20">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Room Not Found</h1>
            <p className="text-muted-foreground">
              The jam room you're looking for doesn't exist or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Navigation Header */}
      <header className="bg-dark border-b border-surface/20 px-6 py-4 flex items-center justify-between z-50">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <Music className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-poppins font-bold text-xl">SoundBoard</h1>
          </div>
          
          <div className="hidden md:flex items-center space-x-4 px-4 py-2 bg-surface/20 rounded-lg">
            <span className="font-mono text-sm text-accent">{room.name}</span>
            <div className="w-1 h-1 bg-surface rounded-full"></div>
            <span className="font-mono text-xs text-gray-400">{room.bpm} BPM</span>
            <div className="w-1 h-1 bg-surface rounded-full"></div>
            <span className="font-mono text-xs text-gray-400">{room.keySignature}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 px-3 py-2 bg-success/20 rounded-lg">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <span className="text-sm text-success">
              {room.participants.length} active
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 gradient-accent rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-white">
                {currentUser.username.charAt(0)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          room={room}
          loops={loops}
          isPlaying={isPlaying}
          onTogglePlayback={() => setIsPlaying(!isPlaying)}
          onStartRecording={() => setIsRecording(true)}
          onExportMixdown={() => {
            // Handle export
            console.log("Exporting mixdown...");
          }}
          onRefreshLoops={refetchLoops}
        />
        
        <StudioWorkspace 
          room={room}
          loops={loops}
          onRefreshLoops={refetchLoops}
          onStartRecording={() => setIsRecording(true)}
        />
      </div>

      <RecordingModal
        open={isRecording}
        onOpenChange={setIsRecording}
        roomId={parseInt(roomId!)}
        currentUser={currentUser}
        onLoopCreated={() => {
          refetchLoops();
          queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}/loops`] });
        }}
      />
    </div>
  );
}
