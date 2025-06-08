import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Users, Clock, Plus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import RoomCreationModal from "@/components/studio/room-creation-modal";
import { type Room } from "@shared/schema";

export default function Home() {
  const [, setLocation] = useLocation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentUser] = useState({ id: 1, username: "Demo User" }); // Demo user

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["/api/rooms"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const joinRoomMutation = useMutation({
    mutationFn: async (roomId: number) => {
      const response = await apiRequest("POST", `/api/rooms/${roomId}/join`, {
        userId: currentUser.id
      });
      return response.json();
    },
    onSuccess: (_, roomId) => {
      setLocation(`/studio/${roomId}`);
    },
  });

  const handleJoinRoom = (roomId: number) => {
    joinRoomMutation.mutate(roomId);
  };

  const handleCreateRoom = () => {
    setShowCreateModal(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-surface/20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <Music className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-poppins font-bold text-2xl">SoundBoard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">Welcome back, {currentUser.username}</span>
            <div className="w-8 h-8 gradient-accent rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-white">
                {currentUser.username.charAt(0)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="font-poppins font-bold text-4xl mb-4">
            Create Music Together
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join collaborative jam rooms and create amazing music with musicians worldwide
          </p>
          <Button 
            onClick={handleCreateRoom}
            className="btn-gradient text-white px-8 py-3 text-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Jam Room
          </Button>
        </div>

        {/* Room List */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-poppins font-semibold text-2xl">Active Jam Rooms</h3>
            <Badge variant="secondary" className="bg-success/20 text-success">
              {rooms.length} rooms available
            </Badge>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-card border-surface/20">
                  <CardHeader>
                    <div className="h-6 bg-surface/20 rounded animate-pulse" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-4 bg-surface/20 rounded animate-pulse" />
                      <div className="h-4 bg-surface/20 rounded animate-pulse w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <Card className="bg-card border-surface/20 text-center py-12">
              <CardContent>
                <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-semibold text-lg mb-2">No Active Rooms</h4>
                <p className="text-muted-foreground">Be the first to create a jam room!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room: Room) => (
                <Card key={room.id} className="bg-card border-surface/20 hover:border-primary/30 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="font-poppins">{room.name}</span>
                      <Badge variant="outline" className="border-accent text-accent">
                        {room.isPublic ? "Public" : "Private"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{room.bpm} BPM</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Music className="w-4 h-4 text-muted-foreground" />
                          <span>{room.keySignature}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>Active now</span>
                      </div>

                      <Button 
                        onClick={() => handleJoinRoom(room.id)}
                        className="w-full bg-primary hover:bg-primary/80 text-white"
                        disabled={joinRoomMutation.isPending}
                      >
                        {joinRoomMutation.isPending ? "Joining..." : "Join Room"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="text-center">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Music className="w-8 h-8 text-white" />
            </div>
            <h4 className="font-poppins font-semibold text-lg mb-2">Record Loops</h4>
            <p className="text-muted-foreground">
              Record audio loops up to 30 seconds with high-quality Web Audio API
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h4 className="font-poppins font-semibold text-lg mb-2">Real-time Collaboration</h4>
            <p className="text-muted-foreground">
              Collaborate with musicians in real-time with automatic sync every 5 seconds
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 gradient-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <h4 className="font-poppins font-semibold text-lg mb-2">Mix & Export</h4>
            <p className="text-muted-foreground">
              Mix tracks with individual volume controls and export professional mixdowns
            </p>
          </div>
        </div>
      </main>

      <RoomCreationModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal}
        currentUser={currentUser}
      />
    </div>
  );
}
