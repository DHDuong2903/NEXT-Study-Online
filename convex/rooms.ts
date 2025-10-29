import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createRoom = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    status: v.string(),
    streamCallId: v.string(),
    studentId: v.string(),
    teacherIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    return await ctx.db.insert("rooms", { ...args });
  },
});

export const updateRoomStatus = mutation({
  args: {
    roomId: v.id("rooms"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.roomId, {
      status: args.status,
      ...(args.status === "completed" ? { endTime: Date.now() } : {}),
    });
  },
});

export const getAllRooms = query({
  handler: async (ctx) => {
    const identity = ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const rooms = await ctx.db.query("rooms").collect();
    return rooms;
  },
});

export const getMyRooms = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_student_id", (q) => q.eq("studentId", identity.subject))
      .collect();
    return rooms;
  },
});

export const getRoomByStreamCallId = query({
  args: { streamCallId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("rooms")
      .withIndex("by_stream_call_id", (q) => q.eq("streamCallId", args.streamCallId))
      .first();
  },
});

export const deleteRoom = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    // Chỉ teacher tham gia room mới được xóa
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || user.role !== "teacher" || !room.teacherIds.includes(identity.subject)) {
      throw new Error("Forbidden");
    }

    // Lấy tất cả rooms cùng streamCallId và xóa hết (để student cũng mất)
    const siblings = await ctx.db
      .query("rooms")
      .withIndex("by_stream_call_id", (q) => q.eq("streamCallId", room.streamCallId))
      .collect();

    // Xóa comment của từng room rồi xóa room
    for (const r of siblings) {
      const comments = await ctx.db
        .query("comments")
        .withIndex("by_room_id", (q) => q.eq("roomId", r._id))
        .collect();
      for (const c of comments) await ctx.db.delete(c._id);
      await ctx.db.delete(r._id);
    }
    return true;
  },
});
