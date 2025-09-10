import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()), // Co the la string hoac ull
    role: v.union(v.literal("student"), v.literal("teacher")), // hoc sinh hoac giao vien
    clerkId: v.string(),
  }).index("by_clerk_id", ["clerkId"]), // Tao chi muc theo clerkId
});
