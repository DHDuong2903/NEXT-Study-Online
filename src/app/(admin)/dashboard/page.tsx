"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { toast } from "sonner";
import LoaderUI from "@/components/LoaderUI";
import { getStudentInfo, groupRooms } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROOM_CATEGORY } from "@/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, CheckCircle, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";

type Room = Doc<"rooms">;

const DashboardPage = () => {
  const users = useQuery(api.users.getUsers);
  const rooms = useQuery(api.rooms.getAllRooms);
  const updateStatus = useMutation(api.rooms.updateRoomStatus);

  const handleStatusUpdate = async (roomId: Id<"rooms">, status: string) => {
    try {
      await updateStatus({ roomId: roomId, status });
      toast.success(`Room status updated as ${status}`);
    } catch (error) {
      console.log(error);
      toast.error("Failed to update room status");
    }
  };

  if (!rooms || !users) return <LoaderUI />;

  const groupedRooms = groupRooms(rooms);

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center mb-8">
        <Link href="/schedules">
          <Button>Schedule New Meeting</Button>
        </Link>
      </div>

      <div className="space-y-4">
        {ROOM_CATEGORY.map(
          (category) =>
            groupedRooms[category.id]?.length > 0 && (
              <section key={category.id}>
                {/* Category title */}
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-xl font-semibold">{category.title}</h2>
                  <Badge variant={category.variant}>{groupedRooms[category.id]?.length}</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedRooms[category.id].map((room: Room) => {
                    const studentInfo = getStudentInfo(users, room.studentId);
                    const startTime = new Date(room.startTime);

                    return (
                      <Card key={room._id} className="hover:shadow-md transition-all">
                        {/* Student info */}
                        <CardHeader className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={studentInfo?.image} />
                              <AvatarFallback>{studentInfo?.initials}</AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-base">{studentInfo.name}</CardTitle>
                              <p className="text-sm text-muted-foreground">{room.title}</p>
                            </div>
                          </div>
                        </CardHeader>

                        {/* Date & Time */}
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(startTime, "MMM dd")}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {format(startTime, "hh:mm a")}
                            </div>
                          </div>
                        </CardContent>

                        {/* Pass/Fail Button */}
                        <CardFooter className="p-4 pt-0 flex flex-col gap-3">
                          {room.status === "completed" && (
                            <div className="flex gap-2 w-full">
                              <Button className="flex-1" onClick={() => handleStatusUpdate(room._id, "succeeded")}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Pass
                              </Button>

                              <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={() => handleStatusUpdate(room._id, "failed")}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Fail
                              </Button>
                            </div>
                          )}
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
