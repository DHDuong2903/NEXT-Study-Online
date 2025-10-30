"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "convex/_generated/dataModel";

type Question = {
  _id: Id<"questions">;
  title: string;
  description?: string;
  level: "Easy" | "Medium" | "Hard";
  starterCode?: { javascript: string; python: string };
};

export default function EditQuestionDialog({
  question,
  onClose,
}: {
  question: Question | null;
  onClose: () => void;
}) {
  const updateQuestion = useMutation(api.questions.updateQuestion);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<Question["level"]>("Easy");
  const [starterJS, setStarterJS] = useState("");
  const [starterPy, setStarterPy] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setOpen(!!question);
    if (question) {
      setTitle(question.title || "");
      setDescription(question.description || "");
      setLevel(question.level || "Easy");
      setStarterJS(question.starterCode?.javascript || "");
      setStarterPy(question.starterCode?.python || "");
    }
  }, [question]);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  const handleSave = async () => {
    if (!question) return;
    setSaving(true);
    try {
      await updateQuestion({
        id: question._id,
        updates: {
          title: title.trim(),
          description: description.trim(),
          level,
          starterCode: { javascript: starterJS, python: starterPy },
        },
      });
      toast.success("Question updated");
      handleClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update question");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Question</DialogTitle>
        </DialogHeader>

        {!question ? (
          <div>Loading...</div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Level</label>
              <Select value={level} onValueChange={(v) => setLevel(v as Question["level"])}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Starter Code (JavaScript)</label>
                <Textarea value={starterJS} onChange={(e) => setStarterJS(e.target.value)} rows={8} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Starter Code (Python)</label>
                <Textarea value={starterPy} onChange={(e) => setStarterPy(e.target.value)} rows={8} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}