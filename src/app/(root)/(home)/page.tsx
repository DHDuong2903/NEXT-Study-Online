"use client";

import ActionCard from "@/components/ActionCard";
import { QUICK_ACTIONS } from "@/constants";
import { useUserRole } from "@/hooks/useUserRole";
import { useState, useMemo } from "react";
import { api } from "../../../../convex/_generated/api";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import MeetingModal from "@/components/MeetingModal";
import LoaderUI from "@/components/LoaderUI";
import { Loader2 } from "lucide-react";
import MeetingCard from "@/components/MeetingCard";

export default function Home() {
  const router = useRouter();

  const rooms = useQuery(api.rooms.getMyRooms);
  const { isTeacher, isLoading } = useUserRole();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"start" | "join">();

  const visibleActions = useMemo(
    () => (isTeacher ? QUICK_ACTIONS : QUICK_ACTIONS.filter((a) => a.title !== "Schedules")),
    [isTeacher]
  );

  const handleQuickAction = (title: string) => {
    switch (title) {
      case "New Call":
        setModalType("start");
        setShowModal(true);
        break;
      case "Join Room":
        setModalType("join");
        setShowModal(true);
        break;
      case "Coding Questions":
        router.push("/questions");
        break;
      default:
        router.push(`/${title.toLowerCase()}`);
    }
  };

  if (isLoading) return <LoaderUI />;

  return (
    <div className="container max-w-7xl mx-auto p-6">
      {/* Wellcome */}
      <div className="rounded-lg bg-card p-6 border shadow-sm mb-10">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-violet-900 bg-clip-text text-transparent">
          Wellcome back!
        </h1>
        <p className="text-muted-foreground mt-2">
          {isTeacher ? "Manage your classrooms and students" : "Access your upcoming classes and preparations"}
        </p>
      </div>

      <>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {visibleActions.map((action) => (
            <ActionCard action={action} key={action.title} onClick={() => handleQuickAction(action.title)} />
          ))}
        </div>

        {!isTeacher && (
          <>
            <div className="mt-6">
              <h1 className="text-3xl font-bold">Your Upcoming Classes</h1>
              <p className="text-muted-foreground mt-1">View and join your scheduled classes</p>
            </div>

            <div className="mt-6">
              {rooms === undefined ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : rooms.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {rooms.map((room) => (
                    <MeetingCard key={room._id} room={room} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">You have no scheduled classes</div>
              )}
            </div>
          </>
        )}

        <MeetingModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={modalType === "join" ? "Join Meeting" : "Start Meeting"}
          isJoinMeeting={modalType === "join"}
        />
      </>
    </div>
  );
}
