import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";

const AddNewQuestionButton = () => {
  return (
    <Dialog>
      <form>
        <DialogTrigger asChild>
          <Button>Add New Question</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader className="mb-4">
            <DialogTitle>Coding Question</DialogTitle>
            <DialogDescription>Fill the following information to add a new question.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-2">
            <div className="w-full">
              <Label className="sr-only">Title</Label>
              <Input id="title" placeholder="Title" type="text" />
            </div>
            <div className="w-full">
              <Label className="sr-only">Description</Label>
              <Textarea id="description" placeholder="Description" />
            </div>
            <div className="w-full">
              <Label className="sr-only">Level</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select level..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full">
              <Label className="sr-only">Examples</Label>
              <Input id="examples" placeholder="Examples" type="text" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Add</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
};

export default AddNewQuestionButton;
