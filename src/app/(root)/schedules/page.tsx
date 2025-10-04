"use client";

import LoaderUI from "@/components/LoaderUI";
import { useUserRole } from "@/hooks/useUserRole";
import { useRouter } from "next/navigation";
import MeetingScheduleUI from "./MeetingScheduleUI";

const SchedulePage = () => {
  const router = useRouter();

  const { isTeacher, isLoading } = useUserRole();

  if (isLoading) return <LoaderUI />;

  if (!isTeacher) return router.push("/");

  return <MeetingScheduleUI />;
};

export default SchedulePage;
