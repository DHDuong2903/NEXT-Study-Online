import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { CheckCircle, Cog, NotebookPen, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import EditQuestionDialog from "./EditQuestionDialog";
import { useState } from "react";
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
} from "./ui/alert-dialog";

type Question = {
  _id: Id<"questions">;
  title: string;
  level: "Easy" | "Medium" | "Hard";
};

interface QuestionTableProps {
  search: string;
  filterLevel: "Easy" | "Medium" | "Hard" | "All";
}

const QuestionTable = ({ search, filterLevel }: QuestionTableProps) => {
  const questions = (useQuery(api.questions.getQuestions) as Question[]) || [];

  const currentUser = useQuery(api.users.getCurrentUser) as
    | { solvedQuestions?: Id<"questions">[]; role?: "teacher" | "student" }
    | null
    | undefined;

  const solvedIds = new Set(currentUser?.solvedQuestions || []);
  const isTeacher = currentUser?.role === "teacher";

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.title.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = filterLevel === "All" || q.level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  const [editing, setEditing] = useState<Question | null>(null);
  const [deleting, setDeleting] = useState<Question | null>(null);

  const deleteQuestion = useMutation(api.questions.deleteQuestion);
  const router = useRouter();

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteQuestion({ id: deleting._id });
      toast.success("Question deleted");
      setDeleting(null);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete question");
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Level</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredQuestions.map((q, index) => {
            const isSolved = solvedIds.has(q._id);
            return (
              <TableRow key={q._id}>
                <TableCell className="font-medium ">{index + 1}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-2 align-middle">
                    <CheckCircle className={`w-4 h-4 ${isSolved ? "text-green-500" : "text-gray-300"}`} />
                    {q.title}
                  </span>
                </TableCell>

                <TableCell>{q.level}</TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button
                    className="group border-2 hover:border-green-500 transition-colors"
                    variant="outline"
                    onClick={() => router.push(`/questions/solve/${q._id}`)}
                  >
                    <NotebookPen className="w-4 h-4 text-muted-foreground transition-colors group-hover:text-green-500" />
                    <span className="transition-colors group-hover:text-green-500">Solve</span>
                  </Button>
                  {isTeacher && (
                    <>
                      <Button
                        className="group border-2 hover:border-blue-500 transition-colors"
                        variant="outline"
                        onClick={() => setEditing(q)}
                      >
                        <Cog className="w-4 h-4 text-muted-foreground transition-colors group-hover:text-blue-500" />
                        <span className="transition-colors group-hover:text-blue-500">Edit</span>
                      </Button>
                      <Button
                        className="group border-2 hover:border-red-500 transition-colors"
                        variant="outline"
                        onClick={() => setDeleting(q)}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground transition-colors group-hover:text-red-500" />
                        <span className="transition-colors group-hover:text-red-500">Delete</span>
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <EditQuestionDialog question={editing} onClose={() => setEditing(null)} />

      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the question <strong>{deleting?.title}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleting(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 text-white" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default QuestionTable;
