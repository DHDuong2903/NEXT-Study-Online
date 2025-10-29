import useMeetingActions from "@/hooks/useMeetingActions";
import { Doc } from "../../convex/_generated/dataModel";
import { getMeetingStatus } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Calendar } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { format } from "date-fns";
import CommentDialog from "./CommentDialog";
import { useState } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

type Room = Doc<"rooms">;
const MeetingCard = ({ room }: { room: Room }) => {
  const { joinMeeting } = useMeetingActions();
  const { isStudent, isTeacher } = useUserRole();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const deleteRoom = useMutation(api.rooms.deleteRoom);

  const status = getMeetingStatus(room);
  const formattedDate = format(new Date(room.startTime), "EEEE, MMMM d . h:mm a");

  return (
    <Card className="h-full flex flex-col">
      <CardHeader
        className={`space-y-2 ${isStudent || isTeacher ? "cursor-pointer" : ""}`}
        onClick={() => {
          if (isStudent || isTeacher) setCommentsOpen(true);
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            {formattedDate}
          </div>

          <Badge variant={status === "live" ? "default" : status === "upcoming" ? "secondary" : "outline"}>
            {status === "live" ? "Live Now" : status === "upcoming" ? "Upcoming" : "Completed"}
          </Badge>
        </div>

        <CardTitle>{room.title}</CardTitle>

        {room.description && <CardDescription className="line-clamp-2">{room.description}</CardDescription>}
      </CardHeader>

      <CardContent className="mt-auto">
        {status === "live" && (
          <Button className="w-full" onClick={() => joinMeeting(room.streamCallId)}>
            Join Meeting
          </Button>
        )}

        {status === "upcoming" && (
          <Button variant="outline" className="w-full" disabled>
            Waiting to Start
          </Button>
        )}

        {isTeacher && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full mt-2" onClick={(e) => e.stopPropagation()}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this meeting?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The meeting and its comments will be removed for everyone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await deleteRoom({ roomId: room._id });
                      toast.success("Meeting deleted");
                    } catch (err) {
                      console.error(err);
                      toast.error("Failed to delete meeting");
                    }
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>

      <CommentDialog roomId={room._id} isOpen={commentsOpen} onOpenChange={setCommentsOpen} hideTrigger />
    </Card>
  );
};

export default MeetingCard;
