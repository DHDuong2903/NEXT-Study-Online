import { useUser } from "@clerk/nextjs";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
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

const MeetingScheduleUI = () => {
  const client = useStreamVideoClient();
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const rooms = useQuery(api.rooms.getAllRooms) ?? [];
  const users = useQuery(api.users.getUsers) ?? [];
  const createRoom = useMutation(api.rooms.createRoom);
  const students = users?.filter((user) => user.role === "student");
  const teachers = users?.filter((user) => user.role === "teacher");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    teacher: "",
    date: new Date(),
    time: "09:00",
    studentId: "",
    teacherIds: user?.id ? [user.id] : [],
  });

  const scheduleMeeting = async () => {
    if (!client || !user) return;
    if (!formData.studentId || formData.teacherIds.length === 0) {
      toast.error("Please select both student and at least one teacher");
      return;
    }

    setIsCreating(true);

    try {
      const { title, description, date, time, studentId, teacherIds } = formData;
      const [hours, minutes] = time.split(":");
      const meetingDate = new Date(date);
      meetingDate.setHours(parseInt(hours), parseInt(minutes), 0);

      const id = crypto.randomUUID();
      const call = client.call("default", id);

      await call.getOrCreate({
        data: {
          starts_at: meetingDate.toISOString(),
          custom: {
            description: title,
            additionalDetails: description,
          },
        },
      });

      await createRoom({
        title,
        description,
        startTime: meetingDate.getTime(),
        status: "upcoming",
        streamCallId: id,
        studentId,
        teacherIds,
      });

      setOpen(false);
      toast.success("Meeting scheduled successfully");
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
            <Button size="lg">Schedule Meeting</Button>
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
                <label className="text-sm font-medium">Student</label>
                <Select
                  value={formData.studentId}
                  onValueChange={(studentId) => {
                    setFormData({ ...formData, studentId });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students?.map((student) => (
                      <SelectItem key={student.clerkId} value={student.clerkId}>
                        <UserInfo user={student} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
    </div>
  );
};

export default MeetingScheduleUI;
