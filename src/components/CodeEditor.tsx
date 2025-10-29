import { CODING_QUESTIONS, LANGUAGES } from "@/constants";
import { useEffect, useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizable";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { AlertCircle, Book, Lightbulb } from "lucide-react";
import Editor from "@monaco-editor/react";
import { runJavaScriptTests, runPythonTests } from "@/lib/runCode";
import type { TestResult } from "@/lib/runCode";
import { Button } from "./ui/button";

const CodeEditor = () => {
  const [selectedQuestion, setSelectedQuestion] = useState(CODING_QUESTIONS[0]);
  const [language, setLanguage] = useState<"javascript" | "python">(LANGUAGES[0].id as "javascript" | "python");
  const [code, setCode] = useState<string>(selectedQuestion.starterCode[language]);

  const [outputLines, setOutputLines] = useState<string[]>([]);
  const [error, setError] = useState<string | undefined>(undefined);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestResult[] | null>(null);

  // keep editor in sync when question or language changes
  useEffect(() => {
    setCode(selectedQuestion.starterCode[language]);
    setOutputLines([]);
    setError(undefined);
    setResults(null);
  }, [selectedQuestion, language]);

  const detectFunctionName = (src: string): string => {
    // try several common patterns: function foo(...), def foo(...), const foo = (...), let/var
    const re =
      /function\s+([A-Za-z0-9_]+)\s*\(|def\s+([A-Za-z0-9_]+)\s*\(|(?:const|let|var)\s+([A-Za-z0-9_]+)\s*=\s*\(?/;
    const m = src.match(re);
    return (m && (m[1] || m[2] || m[3])) || selectedQuestion.id.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  };

  const handleRun = async () => {
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
          // store test results for right-hand comparison
          setResults(res.results || null);

          // Use console (returned by runner) for Program Output; fallback to formatted test-summary
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
    const question = CODING_QUESTIONS.find((q) => q.id === questionId);
    if (!question) return;
    setSelectedQuestion(question);
    // effect will update code
  };

  const handleLanguageChange = (newLanguage: "javascript" | "python") => {
    setLanguage(newLanguage);
    // effect will update code
  };

  return (
    <ResizablePanelGroup direction="vertical" className="min-h-[calc(100vh-4rem-1px)]">
      {/* Question section */}
      <ResizablePanel>
        <ScrollArea className="h-full">
          <div className="p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Header */}
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

                  <Select value={selectedQuestion.id} onValueChange={handleQuestionChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select question" />
                    </SelectTrigger>
                    <SelectContent>
                      {CODING_QUESTIONS.map((q) => (
                        <SelectItem key={q.id} value={q.id}>
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

              {/* Problem description */}
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

              {/* Problem example */}
              <Card>
                <CardHeader className="flex flex-row items-center ga[-2">
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

              {/* Constraints */}
              {selectedQuestion.constraints && (
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    <CardTitle>Constraints</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1.5 text-sm marker:text-muted-foreground">
                      {selectedQuestion.constraints.map((constraint, index) => (
                        <li key={index} className="text-muted-foreground">
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

      {/* Code editor */}
      <ResizablePanel defaultSize={65} minSize={25}>
        <div className="h-full flex flex-col">
          <div className="h-full relative flex-1">
            <ResizablePanelGroup direction="vertical" className="h-full">
              {/* Top: editor (resizable) */}
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

              {/* Bottom: output area (fixed two columns 50/50, scrollable) */}
              <ResizablePanel defaultSize={35} minSize={10} className="h-40 border-t">
                <div className="h-full flex">
                  {/* Left: free program output - shows console/stdout when runner provides it */}
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

                  {/* Right: comparison vs examples (50%) */}
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
