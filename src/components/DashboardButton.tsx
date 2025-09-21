"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { LayoutDashboard } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

const DashboardButton = () => {
  const { isStudent, isLoading } = useUserRole();

  if (isStudent || isLoading) return null;

  return (
    <Link href="/dashboard">
      <Button className="gap-2 font-medium" size="sm">
        <LayoutDashboard />
        Dashboard
      </Button>
    </Link>
  );
};

export default DashboardButton;
