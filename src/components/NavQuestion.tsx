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

const NavQuestion = () => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-2 items-center w-[60%]">
        <Input placeholder="Search questions..." />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="text-muted-foreground">
              Filter Questions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Level</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Easy</DropdownMenuItem>
            <DropdownMenuItem>Medium</DropdownMenuItem>
            <DropdownMenuItem>Hard</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <p className="text-muted-foreground w-[20%]">0/10 Solved</p>

      </div>

      <AddNewQuestionButton />
    </div>
  );
};

export default NavQuestion;
