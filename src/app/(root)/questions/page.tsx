"use client";

import { useState } from "react";
import NavQuestion from "@/components/NavQuestion";
import QuestionTable from "@/components/QuestionTable";

const QuestionPage = () => {
  const [search, setSearch] = useState(""); // State cho search
  const [filterLevel, setFilterLevel] = useState<"Easy" | "Medium" | "Hard" | "All">("All");

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Coding Questions</h1>
        <p className="text-muted-foreground mt-1">Problem solving to improve your abilities</p>
      </div>

      <NavQuestion search={search} setSearch={setSearch} filterLevel={filterLevel} setFilterLevel={setFilterLevel} />

      <QuestionTable search={search} filterLevel={filterLevel} />
    </div>
  );
};

export default QuestionPage;
