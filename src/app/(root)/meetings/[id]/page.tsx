"use client";

import LoaderUI from "@/components/LoaderUI";
import MeetingSetup from "@/components/MeetingSetup";
import useGetCallById from "@/hooks/useGetCallById";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { StreamCall, StreamTheme } from "@stream-io/video-react-sdk";
import MeetingRoom from "@/components/MeetingRoom";

const MeetingPage = () => {
  const { id } = useParams();
  const { isLoaded } = useUser();
  const { call, isCallLoading } = useGetCallById(id);

  const [isSetupComplete, setIsSetupComplete] = useState(false);

  // Roi cuoc goi khi component unmounts
  useEffect(() => {
    return () => {
      if (call && isSetupComplete) {
        call.leave().catch((error) => {
          console.log("Error leaving call:", error);
        });
      }
    };
  }, [call, isSetupComplete]);

  // Canh bao truoc khi thoat cuoc goi
  useEffect(() => {
    if (!isSetupComplete) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isSetupComplete]);

  if (!isLoaded || isCallLoading) return <LoaderUI />;

  if (!call) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-2xl font-semibold">Meeting not found</p>
      </div>
    );
  }

  return (
    <StreamCall call={call}>
      <StreamTheme>
        {!isSetupComplete ? <MeetingSetup onSetupComplete={() => setIsSetupComplete(true)} /> : <MeetingRoom />}
      </StreamTheme>
    </StreamCall>
  );
};

export default MeetingPage;
