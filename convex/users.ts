import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// mutation: thao tac thay doi du lieu (them, sua, xoa)
// query: thao tac truy van du lieu (lay du lieu)

export const syncUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    clerkId: v.string(),
    image: v.optional(v.string()),
  },
  // ctx: viết tắt của context, nó là tham số mà Convex truyền vào cho mỗi mutation hay query.
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users") // truy vấn bảng "users"
      .filter((q) => q.eq(q.field("clerkId"), args.clerkId)) // eq: equal, lọc những bản ghi có trường "clerkId" bằng với args.clerkId
      .first();

    if (existingUser) return; // Nếu đã tồn tại user với clerkId này thì không làm gì cả

    return await ctx.db.insert("users", {
      ...args, // { name, email, clerkId, image }
      role: "student",
    });
  },
});

export const getUsers = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("User is not authenticated");

    const users = await ctx.db.query("users").collect();
    return users;
  },
});

export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    return user;
  },
});
