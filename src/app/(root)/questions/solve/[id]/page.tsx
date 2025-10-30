"use client";

import CodeEditor from "@/components/CodeEditor";
import { Id } from "convex/_generated/dataModel";

const SolvePage = ({ params }: { params: { id: string } }) => {
  const questionId = params.id as Id<"questions">;
  return <CodeEditor initialQuestionId={questionId} isSolvePage={true} />;
};

export default SolvePage;
