import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { CheckCircle, Cog, NotebookPen, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import EditQuestionDialog from "./EditQuestionDialog";
import { useEffect, useState, type ComponentType } from "react";
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
import { Pagination } from "./ui/pagination";

const PaginationComponent = Pagination as unknown as ComponentType<{
  total: number;
  page: number;
  onChange: (p: number) => void;
}>;

type Question = {
  _id: Id<"questions">;
  title: string;
  level: "Easy" | "Medium" | "Hard";
};

interface QuestionTableProps {
  search: string;
  filterLevel: "Easy" | "Medium" | "Hard" | "All";
}

const PAGE_SIZE = 6;

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

  // Pagination state
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [search, filterLevel, questions.length]);

  const pagedQuestions = filteredQuestions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
          {pagedQuestions.map((q, index) => {
            const globalIndex = (page - 1) * PAGE_SIZE + index;
            const isSolved = solvedIds.has(q._id);
            return (
              <TableRow key={q._id}>
                <TableCell className="font-medium ">{globalIndex + 1}</TableCell>
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

      {/* Pagination UI */}
      <div className="mt-4 relative">
        {/* Reserve fixed space so pagination doesn't move with table rows */}
        <div className="h-16" />

        {/* Left: shadcn Pagination (kept) */}
        <div className="absolute left-0 top-0">
          <PaginationComponent total={totalPages} page={page} onChange={(p: number) => setPage(p)} />
        </div>

        {/* Right: Prev/Next stacked with page indicator underneath, fixed to right */}
        <div className="absolute right-0 top-0 flex flex-col items-end">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setPage((v) => Math.max(1, v - 1))} disabled={page <= 1}>
              Prev
            </Button>

            <Button
              variant="outline"
              onClick={() => setPage((v) => Math.min(totalPages, v + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>

          <div className="mt-1 text-xs text-muted-foreground mr-1">
            Page {page} / {totalPages}
          </div>
        </div>
      </div>

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
