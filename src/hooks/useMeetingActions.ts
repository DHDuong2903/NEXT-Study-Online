"use client";

import { useRouter } from "next/navigation";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { toast } from "sonner";

const useMeetingActions = () => {
  const router = useRouter();
  const client = useStreamVideoClient();

  const createInstantMeeting = async () => {
    if (!client) return;

    try {
      const id = crypto.randomUUID();
      const call = client.call("default", id);

      await call.getOrCreate({
        data: {
          starts_at: new Date().toISOString(),
          custom: {
            description: "Instant Meeting",
          },
        },
      });

      router.push(`/meetings/${call.id}`);
      toast.success("Meeting Created");
    } catch (error) {
      console.log(error);
      toast.error("Failed to create meeting");
    }
  };

  const joinMeeting = (callId: string) => {
    if (!callId) return toast.error("Failed to join meeting. Please try again");
    router.push(`/meetings/${callId}`);
  };

  return { createInstantMeeting, joinMeeting };
};

export default useMeetingActions;
