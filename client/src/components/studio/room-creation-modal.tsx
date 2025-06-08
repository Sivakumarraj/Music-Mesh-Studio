import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type InsertRoom } from "@shared/schema";

interface RoomCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: { id: number; username: string };
}

export default function RoomCreationModal({
  open,
  onOpenChange,
  currentUser
}: RoomCreationModalProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    bpm: 120,
    keySignature: "C Major",
    isPublic: true
  });

  const createRoomMutation = useMutation({
    mutationFn: async (roomData: InsertRoom) => {
      const response = await apiRequest("POST", "/api/rooms", roomData);
      return response.json();
    },
    onSuccess: async (room) => {
      // Join the room after creating it
      await apiRequest("POST", `/api/rooms/${room.id}/join`, {
        userId: currentUser.id
      });
      
      toast({
        title: "Room Created",
        description: `"${room.name}" has been created successfully!`,
      });
      
      // Invalidate rooms query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      
      // Navigate to the new room
      setLocation(`/studio/${room.id}`);
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create room. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to create room:", error);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      bpm: 120,
      keySignature: "C Major",
      isPublic: true
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a room name.",
        variant: "destructive",
      });
      return;
    }

    createRoomMutation.mutate({
      ...formData,
      name: formData.name.trim(),
      creatorId: currentUser.id
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const keySignatures = [
    "C Major", "G Major", "D Major", "A Major", "E Major", "B Major", "F# Major",
    "C# Major", "F Major", "Bb Major", "Eb Major", "Ab Major", "Db Major", "Gb Major",
    "A Minor", "E Minor", "B Minor", "F# Minor", "C# Minor", "G# Minor", "D# Minor",
    "A# Minor", "D Minor", "G Minor", "C Minor", "F Minor", "Bb Minor", "Eb Minor"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-dark-light border-surface/20 max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="font-poppins font-semibold text-xl">
              Create Jam Room
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="p-2 hover:bg-surface/20"
            >
              <X className="w-4 h-4 text-gray-400" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Room Name */}
          <div className="space-y-2">
            <Label htmlFor="roomName">Room Name</Label>
            <Input
              id="roomName"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Epic Jam Session"
              className="bg-surface/20 border-surface/40 focus:border-primary"
              required
            />
          </div>

          {/* Room Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bpm">BPM</Label>
              <Input
                id="bpm"
                type="number"
                min="60"
                max="200"
                value={formData.bpm}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  bpm: parseInt(e.target.value) || 120 
                }))}
                className="bg-surface/20 border-surface/40 focus:border-primary"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="keySignature">Key Signature</Label>
              <Select
                value={formData.keySignature}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  keySignature: value 
                }))}
              >
                <SelectTrigger className="bg-surface/20 border-surface/40 focus:border-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-dark border-surface/20">
                  {keySignatures.map((key) => (
                    <SelectItem key={key} value={key}>
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="space-y-3">
            <Label>Privacy</Label>
            <RadioGroup
              value={formData.isPublic ? "public" : "private"}
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                isPublic: value === "public" 
              }))}
              className="flex space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public" className="cursor-pointer">
                  Public
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private" className="cursor-pointer">
                  Private
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-gray-400">
              {formData.isPublic 
                ? "Anyone can discover and join your room"
                : "Only people with the link can join"
              }
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              className="flex-1 border-surface/40 hover:bg-surface/20"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 btn-gradient text-white"
              disabled={createRoomMutation.isPending}
            >
              {createRoomMutation.isPending ? "Creating..." : "Create Room"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
