import AddNewQuestionButton from "./AddNewQuestionButton";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

interface NavQuestionProps {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  filterLevel: "Easy" | "Medium" | "Hard" | "All";
  setFilterLevel: React.Dispatch<React.SetStateAction<"Easy" | "Medium" | "Hard" | "All">>;
}

const NavQuestion = ({ search, setSearch, filterLevel, setFilterLevel }: NavQuestionProps) => {
  const questions = useQuery(api.questions.getQuestions) || [];
  const currentUser = useQuery(api.users.getCurrentUser) as
    | { solvedQuestions?: Id<"questions">[]; role?: "teacher" | "student" }
    | null
    | undefined;

  const total = questions.length;
  const solvedCount = currentUser?.solvedQuestions?.length ?? 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-2 items-center w-[60%]">
        <Input placeholder="Search questions..." value={search} onChange={(e) => setSearch(e.target.value)} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="text-muted-foreground">
              Filter Questions ({filterLevel})
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Level</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setFilterLevel("All")}>All</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterLevel("Easy")}>Easy</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterLevel("Medium")}>Medium</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterLevel("Hard")}>Hard</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <p className="text-muted-foreground w-[20%]">
          {solvedCount}/{total} Solved
        </p>
      </div>

      {currentUser?.role === "teacher" && <AddNewQuestionButton />}
    </div>
  );
};

export default NavQuestion;
