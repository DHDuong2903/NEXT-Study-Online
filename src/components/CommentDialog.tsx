import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { MessageSquare, Star } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { getTeacherInfo } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { format } from "date-fns";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";

const CommentDialog = ({
  roomId,
  isOpen: controlledIsOpen,
  onOpenChange,
  hideTrigger,
}: {
  roomId: Id<"rooms">;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof controlledIsOpen === "boolean" && typeof onOpenChange === "function";
  const isOpen = isControlled ? controlledIsOpen! : internalOpen;
  const setIsOpen = (v: boolean) => {
    if (isControlled) onOpenChange!(v);
    else setInternalOpen(v);
  };

  const [comment, setComment] = useState("");
  const [rating, setRating] = useState("3");

  const addComment = useMutation(api.comments.addComment);
  const users = useQuery(api.users.getUsers);
  const existingComments = useQuery(api.comments.getComments, { roomId });

  const handleSubmit = async () => {
    if (!comment.trim()) return toast.error("Please enter a comment");

    try {
      await addComment({
        roomId,
        content: comment.trim(),
        rating: parseInt(rating),
      });

      toast.success("Comment submitted");
      setComment("");
      setRating("3");
      setIsOpen(false);
    } catch (error) {
      console.log(error);
      toast.error("Failed to submit comment");
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
        />
      ))}
    </div>
  );

  if (existingComments === undefined || users === undefined) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button variant="secondary" className="w-full">
            <MessageSquare className="w-4 h-4 mr-2" />
            Add Comment
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Meeting Comment</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {existingComments.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Previous Comments</h4>
                <Badge variant="outline">
                  {existingComments.length} Comment{existingComments.length !== 1 ? "s" : ""}
                </Badge>
              </div>

              {/* Display existing comments */}
              <ScrollArea className="h-[240px]">
                <div className="space-y-4">
                  {existingComments.map((comment, index) => {
                    const author = getTeacherInfo(users, comment.authorId);
                    return (
                      <div key={index} className="rounded-lg border p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={author.image} />
                              <AvatarFallback>{author.initials}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{author.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(comment._creationTime, "MMM d, yyyy 'at' h:mm a")}
                              </p>
                            </div>
                          </div>
                          {renderStars(comment.rating)}
                        </div>
                        <p className="text-sm text-muted-foreground">{comment.content}</p>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          <div className="space-y-4">
            {/* Rating */}
            <div className="space-y-2">
              <Label>Rating</Label>
              <Select value={rating} onValueChange={setRating}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rating" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <SelectItem key={star} value={star.toString()}>
                      <div className="flex items-center gap-2">{renderStars(star)}</div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <Label>Your Comment</Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write comment here..."
                className="h-32"
              />
            </div>
          </div>
        </div>

        {/* Button */}
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CommentDialog;
