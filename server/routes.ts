import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRoomSchema, insertLoopSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.post("/api/users/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser(userData);
      res.json({ id: user.id, username: user.username });
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.post("/api/users/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({ id: user.id, username: user.username });
    } catch (error) {
      res.status(400).json({ message: "Login failed" });
    }
  });

  // Room routes
  app.get("/api/rooms", async (req, res) => {
    try {
      const rooms = await storage.getPublicRooms();
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  app.get("/api/rooms/:id", async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const room = await storage.getRoomWithParticipants(roomId);
      
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      res.json(room);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch room" });
    }
  });

  app.post("/api/rooms", async (req, res) => {
    try {
      const roomData = insertRoomSchema.parse(req.body);
      const room = await storage.createRoom(roomData);
      res.json(room);
    } catch (error) {
      res.status(400).json({ message: "Invalid room data" });
    }
  });

  app.post("/api/rooms/:id/join", async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }

      const participant = await storage.joinRoom(roomId, userId);
      res.json(participant);
    } catch (error) {
      res.status(400).json({ message: "Failed to join room" });
    }
  });

  app.post("/api/rooms/:id/leave", async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }

      const success = await storage.leaveRoom(roomId, userId);
      res.json({ success });
    } catch (error) {
      res.status(400).json({ message: "Failed to leave room" });
    }
  });

  app.post("/api/rooms/:id/activity", async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }

      await storage.updateParticipantActivity(roomId, userId);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Failed to update activity" });
    }
  });

  // Loop routes
  app.get("/api/rooms/:id/loops", async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const loops = await storage.getLoopsForRoom(roomId);
      res.json(loops);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch loops" });
    }
  });

  app.post("/api/rooms/:id/loops", async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const loopData = insertLoopSchema.parse({
        ...req.body,
        roomId
      });

      const loop = await storage.createLoop(loopData);
      res.json(loop);
    } catch (error) {
      res.status(400).json({ message: "Invalid loop data" });
    }
  });

  app.patch("/api/loops/:id", async (req, res) => {
    try {
      const loopId = parseInt(req.params.id);
      const updates = req.body;

      const loop = await storage.updateLoop(loopId, updates);
      if (!loop) {
        return res.status(404).json({ message: "Loop not found" });
      }

      res.json(loop);
    } catch (error) {
      res.status(400).json({ message: "Failed to update loop" });
    }
  });

  app.delete("/api/loops/:id", async (req, res) => {
    try {
      const loopId = parseInt(req.params.id);
      const success = await storage.deleteLoop(loopId);
      
      if (!success) {
        return res.status(404).json({ message: "Loop not found" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete loop" });
    }
  });

  // Export mixdown endpoint
  app.post("/api/rooms/:id/export", async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const loops = await storage.getLoopsForRoom(roomId);
      const activeLoops = loops.filter(loop => loop.isActive);

      // In a real implementation, this would combine audio tracks
      // For now, return metadata about the export
      res.json({
        success: true,
        exportId: `export_${Date.now()}`,
        loopsCount: activeLoops.length,
        totalDuration: Math.max(...activeLoops.map(l => l.duration), 0),
        downloadUrl: `/api/exports/export_${Date.now()}.wav`
      });
    } catch (error) {
      res.status(500).json({ message: "Export failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
