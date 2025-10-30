import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

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

  const router = useRouter();

  return (
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
                  className="border-2 hover:border-green-500"
                  variant="outline"
                  onClick={() => router.push(`/questions/solve/${q._id}`)}
                >
                  Solve
                </Button>
                {isTeacher && (
                  <>
                    <Button className="border-2 hover:border-blue-500" variant="outline">
                      Edit
                    </Button>
                    <Button className="border-2 hover:border-red-500" variant="outline">
                      Delete
                    </Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default QuestionTable;
