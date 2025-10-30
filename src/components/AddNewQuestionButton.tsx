import { useState } from "react";
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
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Plus, Trash2 } from "lucide-react"; // Thêm icons cho nút add/remove

const AddNewQuestionButton = () => {
  const createQuestion = useMutation(api.questions.createQuestion);

  // State cho các field
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<"Easy" | "Medium" | "Hard">("Easy");
  const [examples, setExamples] = useState<Array<{ input: string; output: string; explanation: string }>>([
    { input: "", output: "", explanation: "" }, // Bắt đầu với 1 example trống
  ]);
  const [javascriptCode, setJavascriptCode] = useState("");
  const [pythonCode, setPythonCode] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation cơ bản
    if (!title.trim() || !description.trim() || !javascriptCode.trim() || !pythonCode.trim()) {
      alert("Please fill in all required fields.");
      return;
    }

    // Lọc examples hợp lệ (ít nhất có input và output)
    const validExamples = examples.filter((ex) => ex.input.trim() && ex.output.trim());
    if (validExamples.length === 0) {
      alert("Please add at least one example with input and output.");
      return;
    }

    try {
      await createQuestion({
        title: title.trim(),
        description: description.trim(),
        level,
        examples: validExamples.map((ex) => ({
          input: ex.input.trim(),
          output: ex.output.trim(),
          explanation: ex.explanation.trim() || undefined, // Optional
        })),
        starterCode: {
          javascript: javascriptCode.trim(),
          python: pythonCode.trim(),
        },
        // authorId sẽ được set trong mutation từ auth
      });

      // Reset form và đóng dialog
      setTitle("");
      setDescription("");
      setLevel("Easy");
      setExamples([{ input: "", output: "", explanation: "" }]);
      setJavascriptCode("");
      setPythonCode("");
      setIsOpen(false);
    } catch (error) {
      console.error("Error creating question:", error);
      alert("Failed to add question. Please try again.");
    }
  };

  // Hàm thêm example mới
  const addExample = () => {
    setExamples([...examples, { input: "", output: "", explanation: "" }]);
  };

  // Hàm xóa example theo index
  const removeExample = (index: number) => {
    if (examples.length > 1) {
      setExamples(examples.filter((_, i) => i !== index));
    }
  };

  // Hàm cập nhật example
  const updateExample = (index: number, field: "input" | "output" | "explanation", value: string) => {
    const newExamples = [...examples];
    newExamples[index][field] = value;
    setExamples(newExamples);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Add New Question</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="mb-4">
            <DialogTitle>Coding Question</DialogTitle>
            <DialogDescription>Fill the following information to add a new question.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Two Sum"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the problem..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="level">Level</Label>
              <Select value={level} onValueChange={(value: "Easy" | "Medium" | "Hard") => setLevel(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Examples</Label>
                <Button type="button" variant="outline" size="sm" onClick={addExample}>
                  <Plus className="w-4 h-4 mr-1" /> Add Example
                </Button>
              </div>
              {examples.map((example, index) => (
                <div key={index} className="border rounded p-3 mb-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Example {index + 1}</Label>
                    {examples.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExample(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <Input
                    placeholder="Input (e.g., nums = [2,7,11,15], target = 9)"
                    value={example.input}
                    onChange={(e) => updateExample(index, "input", e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Output (e.g., [0,1])"
                    value={example.output}
                    onChange={(e) => updateExample(index, "output", e.target.value)}
                    required
                  />
                  <Textarea
                    placeholder="Explanation (optional)"
                    value={example.explanation}
                    onChange={(e) => updateExample(index, "explanation", e.target.value)}
                  />
                </div>
              ))}
            </div>
            <div>
              <Label htmlFor="javascriptCode">Starter Code (JavaScript)</Label>
              <Textarea
                id="javascriptCode"
                placeholder="function twoSum(nums, target) { // Write your solution here }"
                value={javascriptCode}
                onChange={(e) => setJavascriptCode(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="pythonCode">Starter Code (Python)</Label>
              <Textarea
                id="pythonCode"
                placeholder="def two_sum(nums, target): # Write your solution here"
                value={pythonCode}
                onChange={(e) => setPythonCode(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="submit">Add Question</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddNewQuestionButton;