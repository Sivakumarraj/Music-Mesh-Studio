import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  Trash2, 
  Music, 
  AlertTriangle,
  Volume2,
  Users,
  Clock
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type RoomWithParticipants, type LoopWithUser } from "@shared/schema";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: RoomWithParticipants;
  loops: LoopWithUser[];
  onRefreshLoops: () => void;
}

export default function SettingsModal({
  open,
  onOpenChange,
  room,
  loops,
  onRefreshLoops
}: SettingsModalProps) {
  const [deleteMode, setDeleteMode] = useState<'single' | 'all' | null>(null);
  const { toast } = useToast();

  const deleteAllLoopsMutation = useMutation({
    mutationFn: async () => {
      const deletePromises = loops.map(loop => 
        apiRequest("DELETE", `/api/loops/${loop.id}`)
      );
      await Promise.all(deletePromises);
    },
    onSuccess: () => {
      toast({
        title: "All Tracks Deleted",
        description: "All recorded tracks have been removed from this room.",
      });
      onRefreshLoops();
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${room.id}/loops`] });
      setDeleteMode(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete some tracks. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteLoopMutation = useMutation({
    mutationFn: async (loopId: number) => {
      await apiRequest("DELETE", `/api/loops/${loopId}`);
    },
    onSuccess: () => {
      toast({
        title: "Track Deleted",
        description: "The selected track has been removed.",
      });
      onRefreshLoops();
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${room.id}/loops`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete track. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteAll = () => {
    if (loops.length === 0) {
      toast({
        title: "No Tracks",
        description: "There are no tracks to delete in this room.",
      });
      return;
    }
    setDeleteMode('all');
  };

  const confirmDeleteAll = () => {
    deleteAllLoopsMutation.mutate();
  };

  const handleDeleteSingle = (loop: LoopWithUser) => {
    if (confirm(`Delete "${loop.name}" by ${loop.user.username}?`)) {
      deleteLoopMutation.mutate(loop.id);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-dark-light border-surface/20 max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-poppins font-semibold text-xl">Room Settings</h2>
              <p className="text-gray-400 font-normal text-sm">{room.name}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Room Information */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Room Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface/10 rounded-lg p-3">
                <div className="flex items-center space-x-2 text-sm text-gray-400 mb-1">
                  <Clock className="w-4 h-4" />
                  <span>BPM</span>
                </div>
                <div className="font-mono text-xl font-bold text-accent">{room.bpm}</div>
              </div>
              <div className="bg-surface/10 rounded-lg p-3">
                <div className="flex items-center space-x-2 text-sm text-gray-400 mb-1">
                  <Music className="w-4 h-4" />
                  <span>Key</span>
                </div>
                <div className="font-mono text-xl font-bold text-secondary">
                  {room.keySignature.replace(" Major", "M").replace(" Minor", "m")}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center space-x-4">
              <Badge variant={room.isPublic ? "default" : "secondary"} className="bg-primary/20 text-primary">
                {room.isPublic ? "Public Room" : "Private Room"}
              </Badge>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Users className="w-4 h-4" />
                <span>{room.participants.length} active participants</span>
              </div>
            </div>
          </div>

          <Separator className="bg-surface/20" />

          {/* Track Management */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Track Management</h3>
              <Badge variant="outline" className="border-accent text-accent">
                {loops.length} tracks recorded
              </Badge>
            </div>

            {loops.length === 0 ? (
              <div className="bg-surface/10 rounded-lg p-6 text-center">
                <Music className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-400">No tracks recorded yet</p>
                <p className="text-sm text-gray-500">Start recording to see tracks here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Individual Track List */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {loops.map((loop) => (
                    <div key={loop.id} className="flex items-center justify-between bg-surface/10 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                          <Music className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{loop.name}</div>
                          <div className="text-xs text-gray-400">
                            by {loop.user.username} • {formatTime(loop.duration)} • {Math.round(loop.volume * 100)}%
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={loop.isActive ? "default" : "secondary"} className="text-xs">
                          {loop.isActive ? "Active" : "Muted"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSingle(loop)}
                          className="p-2 hover:bg-destructive/20 hover:text-destructive"
                          disabled={deleteLoopMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delete All Option */}
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-destructive">Danger Zone</h4>
                      <p className="text-sm text-gray-400 mt-1">
                        Delete all recorded tracks in this room. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                  
                  {deleteMode === 'all' ? (
                    <div className="mt-4 flex space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteMode(null)}
                        className="border-surface/40 hover:bg-surface/20"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={confirmDeleteAll}
                        className="bg-destructive hover:bg-destructive/80 text-white"
                        disabled={deleteAllLoopsMutation.isPending}
                      >
                        {deleteAllLoopsMutation.isPending ? "Deleting..." : `Delete All ${loops.length} Tracks`}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteAll}
                      className="mt-4 border-destructive/40 text-destructive hover:bg-destructive/20"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete All Tracks
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-primary hover:bg-primary/80 text-white"
            >
              Close Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}