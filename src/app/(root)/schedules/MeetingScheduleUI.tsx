"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UserInfo from "@/components/UserInfo";
import { Loader2, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { TIME_SLOTS } from "@/constants";
import MeetingCard from "@/components/MeetingCard";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

const MeetingScheduleUI = () => {
  const client = useStreamVideoClient();
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rooms = useQuery(api.rooms.getAllRooms) ?? [];
  const users = useQuery(api.users.getUsers) ?? [];
  const createRoom = useMutation(api.rooms.createRoom);
  const students = users?.filter((user) => user.role === "student");
  const teachers = users?.filter((user) => user.role === "teacher");

  const initialFormData = () => ({
    title: "",
    description: "",
    teacher: "",
    date: new Date(),
    time: "09:00",
    studentIds: [] as string[],
    teacherIds: user?.id ? [user.id] : [],
  });

  const [formData, setFormData] = useState(initialFormData());

  // Reset dữ liệu mỗi khi mở form
  useEffect(() => {
    if (open) setFormData(initialFormData());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.id]);

  const scheduleMeeting = async () => {
    if (!client || !user) return;
    if (formData.studentIds.length === 0 || formData.teacherIds.length === 0) {
      toast.error("Please select both student and at least one teacher");
      return;
    }

    setIsCreating(true);

    try {
      const { title, description, date, time, teacherIds } = formData;
      // Loại bỏ trùng ID đề phòng chọn nhiều lần
      const studentIds = Array.from(new Set(formData.studentIds));
      const [hours, minutes] = time.split(":");
      const meetingDate = new Date(date);
      meetingDate.setHours(parseInt(hours), parseInt(minutes), 0);

      // Tạo 1 Stream Call duy nhất cho tất cả students
      const streamCallId = crypto.randomUUID();
      const call = client.call("default", streamCallId);
      await call.getOrCreate({
        data: {
          starts_at: meetingDate.toISOString(),
          custom: {
            description: title,
            additionalDetails: description,
          },
        },
      });
      // Lưu 1 room/student nhưng cùng streamCallId
      await Promise.all(
        studentIds.map(async (studentId) =>
          createRoom({
            title,
            description,
            startTime: meetingDate.getTime(),
            status: "upcoming",
            streamCallId,
            studentId,
            teacherIds,
          })
        )
      );

      setOpen(false);
      toast.success(`Scheduled ${studentIds.length} meeting(s) successfully`);
      setFormData(initialFormData());
    } catch (error) {
      console.log(error);
      toast.error("Failed to schedule meeting");
    } finally {
      setIsCreating(false);
    }
  };

  const addTeacher = (teacherId: string) => {
    if (!formData.teacherIds.includes(teacherId)) {
      setFormData((prev) => ({
        ...prev,
        teacherIds: [...prev.teacherIds, teacherId],
      }));
    }
  };

  const removeTeacher = (teacherId: string) => {
    if (teacherId === user?.id) return;
    setFormData((prev) => ({
      ...prev,
      teacherIds: prev.teacherIds.filter((id) => id !== teacherId),
    }));
  };

  const uniqueRooms = useMemo(() => {
    const map = new Map<string, (typeof rooms)[number]>();
    rooms.forEach((r) => {
      if (!map.has(r.streamCallId)) map.set(r.streamCallId, r);
    });
    return Array.from(map.values());
  }, [rooms]);

  const selectedTeachers = teachers?.filter((teacher) => formData.teacherIds.includes(teacher.clerkId));
  const availableTeachers = teachers?.filter((teacher) => !formData.teacherIds.includes(teacher.clerkId));

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Meeting Rooms</h1>
          <p className="text-muted-foreground mt-1">Schedule and manage meeting rooms</p>
        </div>

        {/* Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Schedule Meeting</Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[500px] h-[calc(100vh-200px)] overflow-auto">
            <DialogHeader>
              <DialogTitle>Schedule Meeting</DialogTitle>
              <DialogDescription></DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Room title */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="Meeting Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              {/* Room description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Meeting Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Student */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Students</label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    className="rounded-full"
                    checked={students.length > 0 && formData.studentIds.length === students.length}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        studentIds: checked ? Array.from(new Set(students.map((s) => s.clerkId))) : [],
                      }))
                    }
                  />
                  <span className="text-sm">Select all</span>
                </div>
                <ScrollArea className="h-[220px] rounded-md border p-2">
                  <div className="space-y-2">
                    {students?.map((student) => {
                      const checked = formData.studentIds.includes(student.clerkId);
                      return (
                        <label
                          key={student.clerkId}
                          className="flex items-center justify-between rounded-md p-2 hover:bg-accent"
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              className="rounded-full"
                              checked={checked}
                              onCheckedChange={(isChecked) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  studentIds: isChecked
                                    ? Array.from(new Set([...prev.studentIds, student.clerkId]))
                                    : prev.studentIds.filter((id) => id !== student.clerkId),
                                }))
                              }
                            />
                            <UserInfo user={student} />
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              {/* Teachers */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Teachers</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedTeachers?.map((teacher) => (
                    <div
                      key={teacher.clerkId}
                      className="inline-flex items-center gap-2 bg-secondary px-2 py-1 rounded-md text-sm"
                    >
                      <UserInfo user={teacher} />
                      {teacher.clerkId !== user?.id && (
                        <button
                          onClick={() => removeTeacher(teacher.clerkId)}
                          className="hover:text-destructive transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {availableTeachers?.length > 0 && (
                  <Select onValueChange={addTeacher}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add teacher" />
                    </SelectTrigger>

                    <SelectContent>
                      {availableTeachers.map((teacher) => (
                        <SelectItem key={teacher.clerkId} value={teacher.clerkId}>
                          <UserInfo user={teacher} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Date & Time */}
              <div className="flex gap-4">
                {/* Calendar */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => date && setFormData({ ...formData, date })}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border"
                  />
                </div>
                {/* Time */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Time</label>
                  <Select value={formData.time} onValueChange={(time) => setFormData({ ...formData, time })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>

                    <SelectContent>
                      {TIME_SLOTS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Action btn */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={scheduleMeeting} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    "Schedule Meeting"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Meeting Card */}
      {!rooms ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : uniqueRooms.length > 0 ? (
        <div className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {uniqueRooms.map((room) => (
              <div key={room._id} className="space-y-2">
                <MeetingCard room={room} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground text-center py-12">No meetings scheduled</div>
      )}
    </div>
  );
};

export default MeetingScheduleUI;
