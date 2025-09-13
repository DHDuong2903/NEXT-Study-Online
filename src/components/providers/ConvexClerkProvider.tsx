"use client";
// use client: Bien file thanh Client Component:
// + render tren trinh duyet (client-side)
// + co the dung state, hooks, event handler

// ClerkProvider boc App de cung cap dang nhap
// useAuth la 1 hook cua Clerk de lay trang thai dang nhap va token
// Tao client ket noi Convex backend
// 1 Provider giup Convex xac thuc nguoi dung thong qua Clerk

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

// Dau ! duoc hieu la gia tri nay khong null/undefined
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const ConvexClerkProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children} {/* Noi dung cua App */}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
};
