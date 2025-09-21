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

  rooms: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    status: v.string(),
    streamCallId: v.string(),
    studentId: v.string(),
    teacherIds: v.array(v.string()),
  })
    .index("by_student_id", ["studentId"])
    .index("by_stream_call_id", ["streamCallId"]),

  comments: defineTable({
    content: v.string(),
    rating: v.number(),
    teacherId: v.string(),
    roomId: v.id("rooms"), // Khoa ngoai: tham chieu den bang rooms
  }).index("by_room_id", ["roomId"]),
});
