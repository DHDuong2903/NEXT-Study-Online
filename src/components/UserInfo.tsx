import { UserCircle } from "lucide-react";
import { Doc } from "../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

type User = Doc<"users">;
const UserInfo = ({ user }: { user: User }) => {
  return (
    <div className="flex items-center gap-2">
      <Avatar className="w-6 h-6">
        <AvatarImage src={user.image} />
        <AvatarFallback>
          <UserCircle className="w-4 h-4" />
        </AvatarFallback>
      </Avatar>
      <span>{user.name}</span>
    </div>
  );
};

export default UserInfo;
