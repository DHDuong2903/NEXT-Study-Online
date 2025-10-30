import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    clerkId: v.string(),
    email: v.string(),
    image: v.optional(v.string()), // Co the la string hoac ull
    role: v.union(v.literal("student"), v.literal("teacher")), // hoc sinh hoac giao vien
    solvedQuestions: v.optional(v.array(v.id("questions"))), // Cac cau hoi da giai
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
    participants: v.optional(v.array(v.string())), // Danh sach nguoi tham gia
  })
    .index("by_student_id", ["studentId"])
    .index("by_stream_call_id", ["streamCallId"]),

  comments: defineTable({
    content: v.string(),
    rating: v.number(),
    authorId: v.string(),
    roomId: v.id("rooms"), // Khoa ngoai: tham chieu den bang rooms
  }).index("by_room_id", ["roomId"]),

  questions: defineTable({
    title: v.string(),
    description: v.string(),
    level: v.union(v.literal("Easy"), v.literal("Medium"), v.literal("Hard")),
    examples: v.array(
      v.object({
        input: v.string(),
        output: v.string(),
        explanation: v.optional(v.string()),
      })
    ),
    starterCode: v.object({
      javascript: v.string(),
      python: v.string(),
    }),
    constraints: v.optional(v.array(v.string())),
    authorId: v.string(), // ID của teacher tạo question (từ auth)
  }).index("by_author_id", ["authorId"]),
});
