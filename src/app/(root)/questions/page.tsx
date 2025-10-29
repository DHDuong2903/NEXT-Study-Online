"use client";

import NavQuestion from "@/components/NavQuestion";
import QuestionTable from "@/components/QuestionTable";

const QuestionPage = () => {
  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Coding Questions</h1>
        <p className="text-muted-foreground mt-1">Coding questions for teachers</p>
      </div>

      {/* Thanh tim kiem va Nut them moi cau hoi */}
      <NavQuestion />

      {/* Danh sach cau hoi */}
      <QuestionTable />
    </div>
  );
};

export default QuestionPage;
