// eslint-disable-next-line import/no-anonymous-default-export
export default {
  providers: [
    {
      domain: "https://cosmic-puma-54.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};

// File này nói với Convex:
// “Hãy chấp nhận JWT được phát hành từ Clerk project ở domain cosmic-puma-54.clerk.accounts.dev, và chỉ những JWT nào có aud = convex mới hợp lệ.”
