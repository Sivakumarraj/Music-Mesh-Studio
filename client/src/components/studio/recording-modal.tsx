import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mic, Square, Play, Pause } from "lucide-react";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RecordingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: number;
  currentUser: { id: number; username: string };
  onLoopCreated: () => void;
}

export default function RecordingModal({
  open,
  onOpenChange,
  roomId,
  currentUser,
  onLoopCreated
}: RecordingModalProps) {
  const [loopName, setLoopName] = useState("");
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'recorded'>('idle');
  const { toast } = useToast();

  const {
    isRecording,
    recordingTime,
    audioBlob,
    startRecording,
    stopRecording,
    playRecording,
    isPlaying,
    error: audioError
  } = useAudioRecorder({ maxDuration: 30 });

  const createLoopMutation = useMutation({
    mutationFn: async (loopData: {
      name: string;
      audioData: string;
      duration: number;
      userId: number;
    }) => {
      const response = await apiRequest("POST", `/api/rooms/${roomId}/loops`, loopData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Loop Created",
        description: "Your audio loop has been saved successfully!",
      });
      onLoopCreated();
      handleClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save the loop. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (audioError) {
      toast({
        title: "Recording Error",
        description: audioError,
        variant: "destructive",
      });
    }
  }, [audioError, toast]);

  useEffect(() => {
    if (audioBlob && recordingState === 'recording') {
      setRecordingState('recorded');
    }
  }, [audioBlob, recordingState]);

  const handleStartRecording = async () => {
    try {
      await startRecording();
      setRecordingState('recording');
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  const handleSave = async () => {
    if (!audioBlob || !loopName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a name for your loop.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64String = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix to get just the base64 data
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      createLoopMutation.mutate({
        name: loopName.trim(),
        audioData: base64String,
        duration: recordingTime,
        userId: currentUser.id,
      });
    } catch (error) {
      console.error("Failed to process audio:", error);
      toast({
        title: "Error",
        description: "Failed to process the audio. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setLoopName("");
    setRecordingState('idle');
    onOpenChange(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return Math.min((recordingTime / 30) * 100, 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-dark-light border-surface/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Mic className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-poppins font-semibold text-xl mb-2">
              {recordingState === 'idle' ? 'Record New Loop' :
               recordingState === 'recording' ? 'Recording...' :
               'Recording Complete'}
            </h2>
            <p className="text-gray-400 font-normal">
              Maximum duration: 30 seconds
            </p>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Loop Name Input */}
          <div className="space-y-2">
            <Label htmlFor="loopName">Loop Name</Label>
            <Input
              id="loopName"
              value={loopName}
              onChange={(e) => setLoopName(e.target.value)}
              placeholder="e.g., Guitar Rhythm, Drum Beat..."
              className="bg-surface/20 border-surface/40 focus:border-primary focus:ring-primary text-foreground placeholder:text-muted-foreground"
              disabled={isRecording}
            />
          </div>

          {/* Recording Progress */}
          {(isRecording || recordingState === 'recorded') && (
            <div>
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>
                  {isRecording ? 'Recording...' : 'Recorded'}
                </span>
                <span className="font-mono">{formatTime(recordingTime)}</span>
              </div>
              <div className="h-2 bg-surface/20 rounded-full">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-200"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            </div>
          )}

          {/* Waveform Preview */}
          {(isRecording || recordingState === 'recorded') && (
            <div className="bg-surface/10 rounded-lg p-4">
              <div className="flex items-center justify-center h-16 space-x-1">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded transition-all duration-75 ${
                      isRecording ? 'bg-primary animate-pulse' : 'bg-primary'
                    }`}
                    style={{
                      height: `${Math.random() * 60 + 20}%`,
                      animationDelay: `${i * 100}ms`
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Playback Controls */}
          {recordingState === 'recorded' && audioBlob && (
            <div className="flex justify-center">
              <Button
                onClick={playRecording}
                variant="outline"
                className="border-surface/40 hover:bg-surface/20"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 mr-2" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                {isPlaying ? 'Pause' : 'Play Preview'}
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {recordingState === 'idle' && (
              <>
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="flex-1 border-surface/40 hover:bg-surface/20"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStartRecording}
                  className="flex-1 btn-gradient text-white"
                  disabled={!loopName.trim()}
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Start Recording
                </Button>
              </>
            )}

            {recordingState === 'recording' && (
              <Button
                onClick={handleStopRecording}
                className="w-full bg-destructive hover:bg-destructive/80 text-white"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop Recording
              </Button>
            )}

            {recordingState === 'recorded' && (
              <>
                <Button
                  onClick={() => setRecordingState('idle')}
                  variant="outline"
                  className="flex-1 border-surface/40 hover:bg-surface/20"
                >
                  Re-record
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-1 btn-gradient text-white"
                  disabled={createLoopMutation.isPending || !loopName.trim()}
                >
                  {createLoopMutation.isPending ? 'Saving...' : 'Save Loop'}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
