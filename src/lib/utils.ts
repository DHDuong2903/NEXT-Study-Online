import { clsx, type ClassValue } from "clsx";
import { addHours, intervalToDuration, isAfter, isBefore, isWithinInterval } from "date-fns";
import { twMerge } from "tailwind-merge";
import { Doc } from "../../convex/_generated/dataModel";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Room = Doc<"rooms">;
type User = Doc<"users">;

export const groupRooms = (rooms: Room[]) => {
  if (!rooms) return {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rooms.reduce((acc: any, room: Room) => {
    const date = new Date(room.startTime);
    const now = new Date();

    if (room.status === "succeeded") {
      acc.succeeded = [...(acc.succeeded || []), room];
    } else if (room.status === "failed") {
      acc.failed = [...(acc.failed || []), room];
    } else if (isBefore(date, now)) {
      acc.completed = [...(acc.completed || []), room];
    } else if (isAfter(date, now)) {
      acc.upcoming = [...(acc.upcoming || []), room];
    }

    return acc;
  }, {});
};

export const getStudentInfo = (users: User[], studentId: string) => {
  const student = users?.find((user) => user.clerkId === studentId);
  return {
    name: student?.name || "Unknown Student",
    image: student?.image || "",
    initials:
      student?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("") || "US",
  };
};

export const getTeacherInfo = (users: User[], teacherId: string) => {
  const teacher = users?.find((user) => user.clerkId === teacherId);
  return {
    name: teacher?.name || "Unknown Teacher",
    image: teacher?.image || "",
    initials:
      teacher?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("") || "UI",
  };
};

export const calculateRecordingDuration = (startTime: string | Date, endTime: string | Date) => {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const duration = intervalToDuration({ start, end });

  if (duration.hours && duration.hours > 0) {
    return `${duration.hours}:${String(duration.minutes).padStart(2, "0")}:${String(duration.seconds).padStart(
      2,
      "0"
    )}`;
  }

  if (duration.minutes && duration.minutes > 0) {
    return `${duration.minutes}:${String(duration.seconds).padStart(2, "0")}`;
  }

  return `${duration.seconds} seconds`;
};

export const getMeetingStatus = (room: Room) => {
  const now = new Date();
  const roomStartTime = room.startTime;
  const endTime = addHours(roomStartTime, 1);

  if (room.status === "completed" || room.status === "failed" || room.status === "succeeded") return "completed";
  if (isWithinInterval(now, { start: roomStartTime, end: endTime })) return "live";
  if (isBefore(now, roomStartTime)) return "upcoming";
  return "completed";
};
