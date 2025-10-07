import useMeetingActions from "@/hooks/useMeetingActions";
import { Doc } from "../../convex/_generated/dataModel";
import { getMeetingStatus } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Calendar } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { format } from "date-fns";

type Room = Doc<"rooms">;
const MeetingCard = ({ room }: { room: Room }) => {
  const { joinMeeting } = useMeetingActions();

  const status = getMeetingStatus(room);
  const formattedDate = format(new Date(room.startTime), "EEEE, MMMM d . h:mm a");

  return (
    <Card>
      <CardHeader className="space-y-2">
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

      <CardContent>
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
      </CardContent>
    </Card>
  );
};

export default MeetingCard;
