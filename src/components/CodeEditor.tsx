import type { TestResult } from "@/lib/runCode";
import Image from "next/image";
import Editor from "@monaco-editor/react";
import { useEffect, useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizable";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { AlertCircle, Book, Lightbulb } from "lucide-react";
import { runJavaScriptTests, runPythonTests } from "@/lib/runCode";
import { Button } from "./ui/button";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { LANGUAGES } from "@/constants";
import { Id } from "convex/_generated/dataModel";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import LoaderUI from "./LoaderUI";

// Định nghĩa type cho Question dựa trên schema Convex
type Question = {
  _id: Id<"questions">;
  title: string;
  description: string;
  level: "Easy" | "Medium" | "Hard";
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  starterCode: {
    javascript: string;
    python: string;
  };
  constraints?: string[];
  authorId: string;
  _creationTime: number;
};

interface CodeEditorProps {
  initialQuestionId?: Id<"questions">;
  isHorizontal?: boolean;
  isSolvePage?: boolean;
  onClose?: () => void;
}

const CodeEditor = ({ initialQuestionId, isHorizontal = false, isSolvePage = false }: CodeEditorProps) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const codingQuestions = (useQuery(api.questions.getQuestions) as Question[]) || [];

  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [language, setLanguage] = useState<"javascript" | "python">(LANGUAGES[0].id as "javascript" | "python");
  const [code, setCode] = useState<string>("");

  const [outputLines, setOutputLines] = useState<string[]>([]);
  const [error, setError] = useState<string | undefined>(undefined);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestResult[] | null>(null);

  const allPassed = results && results.every((r) => r.passed);

  const markSolved = useMutation(api.questions.markQuestionSolved);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!selectedQuestion || !allPassed) return;
    try {
      await markSolved({ questionId: selectedQuestion._id });
      toast.success("Congratulations! Question marked as solved!");
    } catch (err) {
      console.error("Error marking solved:", err);
      toast.error("Failed to mark as solved.");
    }
  };

  useEffect(() => {
    if (initialQuestionId && codingQuestions.length > 0) {
      const question = codingQuestions.find((q) => q._id === initialQuestionId);
      if (question) setSelectedQuestion(question);
    } else if (codingQuestions.length > 0 && !selectedQuestion) {
      setSelectedQuestion(codingQuestions[0]);
    }
  }, [initialQuestionId, codingQuestions, selectedQuestion]);

  useEffect(() => {
    if (selectedQuestion) {
      setCode(selectedQuestion.starterCode[language]);
      setOutputLines([]);
      setError(undefined);
      setResults(null);
    }
  }, [selectedQuestion, language]);

  const detectFunctionName = (src: string): string => {
    const re =
      /function\s+([A-Za-z0-9_]+)\s*\(|def\s+([A-Za-z0-9_]+)\s*\(|(?:const|let|var)\s+([A-Za-z0-9_]+)\s*=\s*\(?/;
    const m = src.match(re);
    return (m && (m[1] || m[2] || m[3])) || (selectedQuestion?._id as string) || "defaultFunction";
  };

  const handleRun = async () => {
    if (!selectedQuestion) return;
    setOutputLines([]);
    setError(undefined);
    setRunning(true);
    setResults(null);

    try {
      const functionName = detectFunctionName(code);
      const tests = selectedQuestion.examples.map((e) => ({ input: e.input, expected: e.output }));

      if (language === "javascript") {
        const res = await runJavaScriptTests(code, functionName, tests, 8000);
        if (res.error) {
          setError(res.error);
        } else {
          setResults(res.results || null);
          const consoleOutput = Array.isArray(res.console) ? res.console : [];
          if (consoleOutput.length > 0) {
            setOutputLines(consoleOutput.map((l) => String(l)));
          } else if (res.results && res.results.length > 0) {
            setOutputLines(
              res.results.map((r: TestResult, i: number) => {
                const status = r.passed ? "PASS" : "FAIL";
                const actual = r.actual ?? "";
                const errPart = r.error ? ` | error: ${r.error}` : "";
                return `Example ${i + 1}: ${status} | expected=${r.expected} | actual=${actual}${errPart}`;
              })
            );
          } else {
            setOutputLines(["No output"]);
          }
        }
      } else if (language === "python") {
        const res = await runPythonTests(code, functionName, tests, 20000);
        if (res.error) {
          setError(res.error);
        } else {
          setResults(res.results || null);
          const consoleOutput = Array.isArray(res.console) ? res.console : [];
          if (consoleOutput.length > 0) {
            setOutputLines(consoleOutput.map((l) => String(l)));
          } else if (res.results && res.results.length > 0) {
            setOutputLines(
              res.results.map((r: TestResult, i: number) => {
                const status = r.passed ? "PASS" : "FAIL";
                const actual = r.actual ?? "";
                const errPart = r.error ? ` | error: ${r.error}` : "";
                return `Example ${i + 1}: ${status} | expected=${r.expected} | actual=${actual}${errPart}`;
              })
            );
          } else {
            setOutputLines(["No output"]);
          }
        }
      } else {
        setError("Ngôn ngữ không được hỗ trợ.");
      }
    } catch (err) {
      setError(String(err ?? "Lỗi khi chạy code"));
    } finally {
      setRunning(false);
    }
  };

  const handleQuestionChange = (questionId: string) => {
    const question = codingQuestions.find((q) => q._id === questionId);
    if (!question) return;
    setSelectedQuestion(question);
  };

  const handleLanguageChange = (newLanguage: "javascript" | "python") => {
    setLanguage(newLanguage);
  };

  const handleBackToList = () => {
    router.push("/questions");
  };

  const handleNextQuestion = () => {
    const currentIndex = codingQuestions.findIndex((q) => q._id === selectedQuestion?._id);
    const nextIndex = (currentIndex + 1) % codingQuestions.length;
    const nextQuestion = codingQuestions[nextIndex];
    if (nextQuestion) {
      router.push(`/questions/solve/${nextQuestion._id}`);
    }
  };

  if (!selectedQuestion) {
    return <LoaderUI />;
  }

  // Solve page layout: left = problem (half), right = editor + output (half)
  if (isSolvePage) {
    return (
      <div className="min-h-[calc(100vh-4rem-1px)]">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <Image
                      width={20}
                      height={20}
                      src={`/${language}.png`}
                      alt={language}
                      className="w-5 h-5 object-contain"
                    />
                    {LANGUAGES.find((l) => l.id === language)?.name}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    <div className="flex items-center gap-2">
                      <Image
                        width={20}
                        height={20}
                        src={`/${l.id}.png`}
                        alt={l.name}
                        className="w-5 h-5 object-contain"
                      />
                      {l.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleRun} disabled={running || code.trim().length === 0}>
              {running ? "Running..." : "Run Code"}
            </Button>
            <Button onClick={handleSubmit} disabled={!allPassed || !selectedQuestion}>
              Submit
            </Button>

            <Button variant="outline" onClick={handleBackToList}>
              Back to Questions
            </Button>
            <Button variant="outline" onClick={handleNextQuestion}>
              Next Question
            </Button>
          </div>
        </div>

        <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-8rem)]">
          {/* Left: Question info (50%) */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <ScrollArea className="h-full">
              <div className="p-6 h-full">
                <div className="max-w-4xl mx-auto space-y-6 h-full overflow-auto">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-semibold tracking-tight">{selectedQuestion.title}</h2>
                      </div>
                      <p className="text-sm text-muted-foreground">Choose your language and solve the problem</p>
                    </div>
                  </div>

                  <Card>
                    <CardHeader className="flex flex-row items-center gap-2">
                      <Book className="h-5 w-5 text-primary/80" />
                      <CardTitle>Problem Description</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm leading-relaxed">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="whitespace-pre-line">{selectedQuestion.description}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-yellow-500 mr-2" />
                      <CardTitle>Examples</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="w-full h-full rounded-md border">
                        <div className="p-4 space-y-4">
                          {selectedQuestion.examples.map((example, index) => (
                            <div key={index} className="space-y-2">
                              <p className="font-medium text-sm">Example {index + 1}:</p>
                              <ScrollArea className="w-full h-full rounded-md">
                                <pre className="bg-muted/50 p-3 rounded-lg text-sm font-mono">
                                  <div>Input: {example.input}</div>
                                  <div>Output: {example.output}</div>
                                  {example.explanation && (
                                    <div className="pt-2 text-muted-foreground">Explanation: {example.explanation}</div>
                                  )}
                                </pre>
                                <ScrollBar orientation="horizontal" />
                              </ScrollArea>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {selectedQuestion.constraints && (
                    <Card>
                      <CardHeader className="flex flex-row items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                        <CardTitle>Constraints</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside space-y-1.5 text-sm marker:text-muted-foreground">
                          {selectedQuestion.constraints.map((constraint, idx) => (
                            <li key={idx} className="text-muted-foreground">
                              {constraint}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </ScrollArea>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right: Editor + Output (50%) */}
          <ResizablePanel defaultSize={50} minSize={40}>
            <ResizablePanelGroup direction="vertical" className="h-full">
              <ResizablePanel defaultSize={65} minSize={25}>
                <Editor
                  height={"100%"}
                  defaultLanguage={language}
                  language={language}
                  theme="vs-dark"
                  value={code}
                  onChange={(value) => setCode(value || "")}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 18,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 16, bottom: 16 },
                    wordWrap: "on",
                    wrappingIndent: "indent",
                  }}
                />
              </ResizablePanel>

              <ResizableHandle />

              <ResizablePanel defaultSize={35} minSize={10}>
                <div className="h-full flex">
                  <div className="w-1/2 bg-black/80 text-white p-3 overflow-auto">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">Program Output</div>
                      <div className="text-sm text-muted-foreground">
                        {running ? "Running..." : results ? "Done" : "Idle"}
                      </div>
                    </div>
                    {error && <div className="text-red-400 mb-2">Error: {error}</div>}
                    {outputLines.length === 0 && !error && <div className="text-muted-foreground">No output</div>}
                    {outputLines.map((line, i) => (
                      <pre key={i} className="whitespace-pre-wrap">
                        {line}
                      </pre>
                    ))}
                  </div>

                  <div className="w-1/2 p-3 overflow-auto border-l">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">Test Cases</div>
                      <div className="text-sm text-muted-foreground">Expected / Actual</div>
                    </div>

                    {selectedQuestion.examples.map((ex, i) => {
                      const r = results?.[i];
                      const passed = r ? r.passed : undefined;
                      return (
                        <div key={i} className="mb-3 border rounded p-2">
                          <div className="text-sm font-medium">
                            Example {i + 1} —{" "}
                            {passed === undefined ? (
                              <span className="text-muted-foreground">no run</span>
                            ) : passed ? (
                              <span className="text-green-500">PASS</span>
                            ) : (
                              <span className="text-red-500">FAIL</span>
                            )}
                          </div>
                          <div className="mt-1 text-xs">
                            <strong>Input:</strong> <span className="font-mono">{ex.input}</span>
                          </div>
                          <div className="mt-1 text-xs">
                            <strong>Expected:</strong> <span className="font-mono">{ex.output}</span>
                          </div>
                          <div className="mt-1 text-xs">
                            <strong>Actual:</strong> <span className="font-mono">{r?.actual ?? "—"}</span>
                          </div>
                          {r?.error && (
                            <div className="mt-1 text-xs text-red-400">
                              <strong>Runtime error:</strong> {r.error}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    );
  }

  if (isHorizontal) {
    // horizontal layout: editor left, output right. No top-right X button.
    return (
      <div className="min-h-[calc(100vh-4rem-1px)]">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Select value={selectedQuestion._id} onValueChange={handleQuestionChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select question" />
              </SelectTrigger>
              <SelectContent>
                {codingQuestions.map((q) => (
                  <SelectItem key={q._id} value={q._id}>
                    {q.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <Image
                      width={20}
                      height={20}
                      src={`/${language}.png`}
                      alt={language}
                      className="w-5 h-5 object-contain"
                    />
                    {LANGUAGES.find((l) => l.id === language)?.name}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    <div className="flex items-center gap-2">
                      <Image
                        width={20}
                        height={20}
                        src={`/${l.id}.png`}
                        alt={l.name}
                        className="w-5 h-5 object-contain"
                      />
                      {l.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleRun} disabled={running || code.trim().length === 0}>
              {running ? "Running..." : "Run Code"}
            </Button>
            <Button onClick={handleSubmit} disabled={!allPassed || !selectedQuestion}>
              Submit
            </Button>
          </div>
          {/* Note: X close button intentionally removed; use navigation/back controls instead */}
        </div>

        <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-8rem)]">
          <ResizablePanel defaultSize={50} minSize={25}>
            <Editor
              height={"100%"}
              defaultLanguage={language}
              language={language}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 18,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 16, bottom: 16 },
                wordWrap: "on",
                wrappingIndent: "indent",
              }}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={50} minSize={25}>
            <div className="h-full flex flex-col">
              <div className="w-full bg-black/80 text-white p-3 overflow-auto flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">Program Output</div>
                  <div className="text-sm text-muted-foreground">
                    {running ? "Running..." : results ? "Done" : "Idle"}
                  </div>
                </div>
                {error && <div className="text-red-400 mb-2">Error: {error}</div>}
                {outputLines.length === 0 && !error && <div className="text-muted-foreground">No output</div>}
                {outputLines.map((line, i) => (
                  <pre key={i} className="whitespace-pre-wrap">
                    {line}
                  </pre>
                ))}
              </div>

              <div className="w-full p-3 overflow-auto border-t flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">Test Cases</div>
                  <div className="text-sm text-muted-foreground">Expected / Actual</div>
                </div>

                {selectedQuestion.examples.map((ex, i) => {
                  const r = results?.[i];
                  const passed = r ? r.passed : undefined;
                  return (
                    <div key={i} className="mb-3 border rounded p-2">
                      <div className="text-sm font-medium">
                        Example {i + 1} —{" "}
                        {passed === undefined ? (
                          <span className="text-muted-foreground">no run</span>
                        ) : passed ? (
                          <span className="text-green-500">PASS</span>
                        ) : (
                          <span className="text-red-500">FAIL</span>
                        )}
                      </div>
                      <div className="mt-1 text-xs">
                        <strong>Input:</strong> <span className="font-mono">{ex.input}</span>
                      </div>
                      <div className="mt-1 text-xs">
                        <strong>Expected:</strong> <span className="font-mono">{ex.output}</span>
                      </div>
                      <div className="mt-1 text-xs">
                        <strong>Actual:</strong> <span className="font-mono">{r?.actual ?? "—"}</span>
                      </div>
                      {r?.error && (
                        <div className="mt-1 text-xs text-red-400">
                          <strong>Runtime error:</strong> {r.error}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    );
  }

  // Default vertical (original) layout retained
  return (
    <ResizablePanelGroup direction="vertical" className="min-h-[calc(100vh-4rem-1px)]">
      <ResizablePanel>
        <ScrollArea className="h-full">
          <div className="p-6 h-full">
            <div className="max-w-4xl mx-auto space-y-6 h-full overflow-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-semibold tracking-tight">{selectedQuestion.title}</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">Choose your language and solve the problem</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button onClick={handleRun} disabled={running || code.trim().length === 0}>
                    {running ? "Running..." : "Run Code"}
                  </Button>
                  <Button onClick={handleSubmit} disabled={!allPassed || !selectedQuestion}>
                    Submit
                  </Button>

                  <Select value={selectedQuestion._id} onValueChange={handleQuestionChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select question" />
                    </SelectTrigger>
                    <SelectContent>
                      {codingQuestions.map((q) => (
                        <SelectItem key={q._id} value={q._id}>
                          {q.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <Image
                            width={20}
                            height={20}
                            src={`/${language}.png`}
                            alt={language}
                            className="w-5 h-5 object-contain"
                          />
                          {LANGUAGES.find((l) => l.id === language)?.name}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          <div className="flex items-center gap-2">
                            <Image
                              width={20}
                              height={20}
                              src={`/${l.id}.png`}
                              alt={l.name}
                              className="w-5 h-5 object-contain"
                            />
                            {l.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <Book className="h-5 w-5 text-primary/80" />
                  <CardTitle>Problem Description</CardTitle>
                </CardHeader>

                <CardContent className="text-sm leading-relaxed">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="whitespace-pre-line">{selectedQuestion.description}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500 mr-2" />
                  <CardTitle>Examples</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="w-full h-full rounded-md border">
                    <div className="p-4 space-y-4">
                      {selectedQuestion.examples.map((example, index) => (
                        <div key={index} className="space-y-2">
                          <p className="font-medium text-sm">Example {index + 1}:</p>
                          <ScrollArea className="w-full h-full rounded-md">
                            <pre className="bg-muted/50 p-3 rounded-lg text-sm font-mono">
                              <div>Input: {example.input}</div>
                              <div>Output: {example.output}</div>
                              {example.explanation && (
                                <div className="pt-2 text-muted-foreground">Explanation: {example.explanation}</div>
                              )}
                            </pre>
                            <ScrollBar orientation="horizontal" />
                          </ScrollArea>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {selectedQuestion.constraints && (
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    <CardTitle>Constraints</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1.5 text-sm marker:text-muted-foreground">
                      {selectedQuestion.constraints.map((constraint, idx) => (
                        <li key={idx} className="text-muted-foreground">
                          {constraint}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </ScrollArea>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={65} minSize={25}>
        <div className="h-full flex flex-col">
          <div className="h-full relative flex-1">
            <ResizablePanelGroup direction="vertical" className="h-full">
              <ResizablePanel defaultSize={65} minSize={20} className="h-full">
                <Editor
                  height={"100%"}
                  defaultLanguage={language}
                  language={language}
                  theme="vs-dark"
                  value={code}
                  onChange={(value) => setCode(value || "")}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 18,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 16, bottom: 16 },
                    wordWrap: "on",
                    wrappingIndent: "indent",
                  }}
                />
              </ResizablePanel>

              <ResizableHandle />

              <ResizablePanel defaultSize={35} minSize={10} className="h-40 border-t">
                <div className="h-full flex">
                  <div className="w-1/2 bg-black/80 text-white p-3 overflow-auto">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">Program Output</div>
                      <div className="text-sm text-muted-foreground">
                        {running ? "Running..." : results ? "Done" : "Idle"}
                      </div>
                    </div>

                    {error && <div className="text-red-400 mb-2">Error: {error}</div>}
                    {outputLines.length === 0 && !error && <div className="text-muted-foreground">No output</div>}
                    {outputLines.map((line, i) => (
                      <pre key={i} className="whitespace-pre-wrap">
                        {line}
                      </pre>
                    ))}
                  </div>

                  <div className="w-1/2 p-3 overflow-auto border-l">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">Test Cases</div>
                      <div className="text-sm text-muted-foreground">Expected / Actual</div>
                    </div>

                    {selectedQuestion.examples.map((ex, i) => {
                      const r = results?.[i];
                      const passed = r ? r.passed : undefined;
                      return (
                        <div key={i} className="mb-3 border rounded p-2">
                          <div className="text-sm font-medium">
                            Example {i + 1} —{" "}
                            {passed === undefined ? (
                              <span className="text-muted-foreground">no run</span>
                            ) : passed ? (
                              <span className="text-green-500">PASS</span>
                            ) : (
                              <span className="text-red-500">FAIL</span>
                            )}
                          </div>
                          <div className="mt-1 text-xs">
                            <strong>Input:</strong> <span className="font-mono">{ex.input}</span>
                          </div>
                          <div className="mt-1 text-xs">
                            <strong>Expected:</strong> <span className="font-mono">{ex.output}</span>
                          </div>
                          <div className="mt-1 text-xs">
                            <strong>Actual:</strong> <span className="font-mono">{r?.actual ?? "—"}</span>
                          </div>
                          {r?.error && (
                            <div className="mt-1 text-xs text-red-400">
                              <strong>Runtime error:</strong> {r.error}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default CodeEditor;
