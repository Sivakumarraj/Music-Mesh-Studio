import { 
  users, rooms, loops, roomParticipants,
  type User, type InsertUser,
  type Room, type InsertRoom,
  type Loop, type InsertLoop,
  type RoomParticipant, type InsertRoomParticipant,
  type RoomWithParticipants, type LoopWithUser
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Room methods
  getRoom(id: number): Promise<Room | undefined>;
  getRoomWithParticipants(id: number): Promise<RoomWithParticipants | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  getPublicRooms(): Promise<Room[]>;
  getUserRooms(userId: number): Promise<Room[]>;

  // Loop methods
  getLoopsForRoom(roomId: number): Promise<LoopWithUser[]>;
  createLoop(loop: InsertLoop): Promise<Loop>;
  updateLoop(id: number, updates: Partial<Loop>): Promise<Loop | undefined>;
  deleteLoop(id: number): Promise<boolean>;

  // Room participant methods
  joinRoom(roomId: number, userId: number): Promise<RoomParticipant>;
  leaveRoom(roomId: number, userId: number): Promise<boolean>;
  updateParticipantActivity(roomId: number, userId: number): Promise<void>;
  getRoomParticipants(roomId: number): Promise<(RoomParticipant & { user: User })[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getRoom(id: number): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room || undefined;
  }

  async getRoomWithParticipants(id: number): Promise<RoomWithParticipants | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    if (!room) return undefined;

    const participants = await this.getRoomParticipants(id);
    const roomLoops = await this.getLoopsForRoom(id);

    return {
      ...room,
      participants,
      loops: roomLoops.map(loop => ({
        id: loop.id,
        roomId: loop.roomId,
        userId: loop.userId,
        name: loop.name,
        audioData: loop.audioData,
        duration: loop.duration,
        volume: loop.volume,
        isActive: loop.isActive,
        createdAt: loop.createdAt,
      }))
    };
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const [room] = await db
      .insert(rooms)
      .values(insertRoom)
      .returning();
    return room;
  }

  async getPublicRooms(): Promise<Room[]> {
    return await db.select().from(rooms).where(eq(rooms.isPublic, true));
  }

  async getUserRooms(userId: number): Promise<Room[]> {
    return await db.select().from(rooms).where(eq(rooms.creatorId, userId));
  }

  async getLoopsForRoom(roomId: number): Promise<LoopWithUser[]> {
    const roomLoops = await db.query.loops.findMany({
      where: eq(loops.roomId, roomId),
      with: {
        user: true
      }
    });

    return roomLoops.map(loop => ({
      ...loop,
      user: loop.user
    }));
  }

  async createLoop(insertLoop: InsertLoop): Promise<Loop> {
    const [loop] = await db
      .insert(loops)
      .values(insertLoop)
      .returning();
    return loop;
  }

  async updateLoop(id: number, updates: Partial<Loop>): Promise<Loop | undefined> {
    const [loop] = await db
      .update(loops)
      .set(updates)
      .where(eq(loops.id, id))
      .returning();
    return loop || undefined;
  }

  async deleteLoop(id: number): Promise<boolean> {
    const result = await db.delete(loops).where(eq(loops.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async joinRoom(roomId: number, userId: number): Promise<RoomParticipant> {
    // Check if participant already exists
    const existing = await db.query.roomParticipants.findFirst({
      where: and(
        eq(roomParticipants.roomId, roomId),
        eq(roomParticipants.userId, userId)
      )
    });

    if (existing) {
      // Update last active time
      const [updated] = await db
        .update(roomParticipants)
        .set({ lastActiveAt: new Date() })
        .where(eq(roomParticipants.id, existing.id))
        .returning();
      return updated;
    }

    const [participant] = await db
      .insert(roomParticipants)
      .values({ roomId, userId })
      .returning();
    return participant;
  }

  async leaveRoom(roomId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(roomParticipants)
      .where(and(
        eq(roomParticipants.roomId, roomId),
        eq(roomParticipants.userId, userId)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  async updateParticipantActivity(roomId: number, userId: number): Promise<void> {
    await db
      .update(roomParticipants)
      .set({ lastActiveAt: new Date() })
      .where(and(
        eq(roomParticipants.roomId, roomId),
        eq(roomParticipants.userId, userId)
      ));
  }

  async getRoomParticipants(roomId: number): Promise<(RoomParticipant & { user: User })[]> {
    const participants = await db.query.roomParticipants.findMany({
      where: eq(roomParticipants.roomId, roomId),
      with: {
        user: true
      }
    });

    return participants.map(participant => ({
      ...participant,
      user: participant.user
    }));
  }
}

export const storage = new DatabaseStorage();
