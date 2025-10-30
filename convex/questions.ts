import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createQuestion = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user || user.role !== "teacher") throw new Error("Forbidden");
    return await ctx.db.insert("questions", { ...args, authorId: identity.subject });
  },
});

// Query để lấy tất cả questions (thay thế CODING_QUESTIONS)
export const getQuestions = query({
  handler: async (ctx) => {
    return await ctx.db.query("questions").collect();
  },
});

// Query để lấy question theo ID (nếu cần)
export const getQuestionById = query({
  args: { id: v.id("questions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const markQuestionSolved = mutation({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    // Kiểm tra nếu question đã solved (để tránh duplicate)
    const solved = user.solvedQuestions || [];
    if (solved.includes(args.questionId)) {
      return { message: "Question already solved" };
    }

    // Thêm questionId vào solvedQuestions
    await ctx.db.patch(user._id, {
      solvedQuestions: [...solved, args.questionId],
    });

    return { message: "Question marked as solved" };
  },
});

export const updateQuestion = mutation({
  args: {
    id: v.id("questions"),
    updates: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      level: v.optional(v.union(v.literal("Easy"), v.literal("Medium"), v.literal("Hard"))),
      examples: v.optional(
        v.array(
          v.object({
            input: v.string(),
            output: v.string(),
            explanation: v.optional(v.string()),
          })
        )
      ),
      starterCode: v.optional(
        v.object({
          javascript: v.string(),
          python: v.string(),
        })
      ),
      constraints: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Only teachers can update questions
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user || user.role !== "teacher") throw new Error("Forbidden");

    const question = await ctx.db.get(args.id);
    if (!question) throw new Error("Question not found");

    // Apply patch - only provided fields will be updated
    await ctx.db.patch(args.id, args.updates);

    return { message: "Question updated" };
  },
});

export const deleteQuestion = mutation({
  args: { id: v.id("questions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user || user.role !== "teacher") throw new Error("Forbidden");

    const question = await ctx.db.get(args.id);
    if (!question) throw new Error("Question not found");

    await ctx.db.delete(args.id);

    return { message: "Question deleted" };
  },
});
