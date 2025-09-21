import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const addComment = mutation({
  args: {
    roomId: v.id("rooms"),
    content: v.string(),
    rating: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    return await ctx.db.insert("comments", {
      roomId: args.roomId,
      content: args.content,
      rating: args.rating,
      teacherId: identity.subject,
    });
  },
});

export const getComments = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_room_id", (q) => q.eq("roomId", args.roomId))
      .collect();
    return comments;
  },
});
