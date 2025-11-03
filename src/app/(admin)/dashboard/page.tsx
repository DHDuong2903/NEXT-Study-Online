"use client";

import type { Doc } from "convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarClock, ChartNoAxesCombined, CodeXml, Eye, Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { getMeetingStatus, getStudentInfo, getTeacherInfo } from "@/lib/utils";
import DashboardCharts from "@/components/DashboardCharts";

const DashboardPage = () => {
  const [activeTable, setActiveTable] = useState<"users" | "questions" | "upcoming" | "completed" | null>(null);
  const [activeChart, setActiveChart] = useState<"users" | "questions" | "upcoming" | "completed" | null>("users");
  const [filterRole, setFilterRole] = useState<"teacher" | "student">("teacher");

  // Hàm xử lý click Eye: luôn set activeTable cho nút được click, và tắt activeChart
  const handleEyeClick = (table: "users" | "questions" | "upcoming" | "completed") => {
    setActiveTable(table);
    setActiveChart(null);
  };

  // Hàm xử lý click Chart: luôn set activeChart cho nút được click, và tắt activeTable
  const handleChartClick = (chart: "users" | "questions" | "upcoming" | "completed") => {
    setActiveChart(chart);
    setActiveTable(null);
  };

  // Query tất cả users (trả về mảng users với solvedQuestions là array ID)
  const users = useQuery(api.users.getUsers) as Doc<"users">[] | undefined;

  // Thêm query cho questions và rooms (classes)
  const questions = useQuery(api.questions.getQuestions);
  const rooms = useQuery(api.rooms.getAllRooms);

  // Tính toán số lượng solved questions cho từng user
  const usersWithSolvedCount = (users ?? []).map((u) => ({
    ...u,
    solvedCount: u.solvedQuestions?.length || 0, // Tính length của mảng
  }));

  const filteredUsers = usersWithSolvedCount.filter((u) => u.role === filterRole);

  const totalUsers = users?.length || 0;
  const totalQuestions = questions?.length || 0;
  const upcomingClasses =
    new Set(rooms?.filter((r) => getMeetingStatus(r) === "upcoming").map((r) => r.streamCallId)).size || 0;
  const completedClasses =
    new Set(rooms?.filter((r) => getMeetingStatus(r) === "completed").map((r) => r.streamCallId)).size || 0;

  // Hàm render bảng dựa trên activeTable
  const renderTable = () => {
    if (!activeTable) return null;

    switch (activeTable) {
      case "users":
        return (
          <div>
            <div className="flex items-center space-x-1 border-2 p-1 w-fit rounded-lg mb-4">
              <Button
                variant={filterRole === "teacher" ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => setFilterRole("teacher")}
              >
                Teacher
              </Button>
              <Button
                variant={filterRole === "student" ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => setFilterRole("student")}
              >
                Student
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Problem solved</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(filteredUsers.length === 0
                  ? [{ name: "No users", email: "", role: filterRole, solvedCount: 0 }]
                  : filteredUsers
                ).map((u, idx) => (
                  <TableRow key={u.email || idx}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.solvedCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );
      case "questions":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Author</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(questions?.length === 0 ? [{ title: "No questions", level: "", authorId: "" }] : questions || []).map(
                (q, idx) => {
                  const author = getTeacherInfo(users || [], q.authorId);
                  return (
                    <TableRow key={idx}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{q.title}</TableCell>
                      <TableCell>{q.level}</TableCell>
                      <TableCell>{author.name}</TableCell>
                    </TableRow>
                  );
                }
              )}
            </TableBody>
          </Table>
        );
      case "upcoming":
        const uniqueUpcomingIds = new Set(
          rooms?.filter((r) => getMeetingStatus(r) === "upcoming").map((r) => r.streamCallId)
        );
        const upcomingRooms = rooms?.filter((r) => uniqueUpcomingIds.has(r.streamCallId)) || [];
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>Teachers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(upcomingRooms.length === 0
                ? [{ title: "No upcoming classes", startTime: 0, teacherIds: [] }]
                : upcomingRooms
              ).map((r, idx) => {
                const teachers = r.teacherIds.map((id) => getTeacherInfo(users || [], id).name).join(", ");
                return (
                  <TableRow key={idx}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{r.title}</TableCell>
                    <TableCell>{new Date(r.startTime).toLocaleString()}</TableCell>
                    <TableCell>{teachers}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        );
      case "completed":
        const uniqueCompletedIds = new Set(
          rooms?.filter((r) => getMeetingStatus(r) === "completed").map((r) => r.streamCallId)
        );
        const completedRooms = rooms?.filter((r) => uniqueCompletedIds.has(r.streamCallId)) || [];
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Teachers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(completedRooms.length === 0
                ? [{ title: "No completed classes", startTime: 0, studentId: "", teacherIds: [] }]
                : completedRooms
              ).map((r, idx) => {
                const student = getStudentInfo(users || [], r.studentId);
                const teachers = r.teacherIds.map((id) => getTeacherInfo(users || [], id).name).join(", ");
                return (
                  <TableRow key={idx}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{r.title}</TableCell>
                    <TableCell>{new Date(r.startTime).toLocaleString()}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{teachers}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-8">
      {/* Introduce page */}
      <div>
        <h1 className="text-3xl font-bold">Manage Information</h1>
        <p className="text-muted-foreground mt-1">View detail and analyze charts</p>
      </div>

      {/* List information */}
      <div className="grid grid-cols-4 items-center gap-6">
        <div className="border-2 rounded-md w-fit md:w-full p-4 flex items-center justify-between hover:shadow-md transition-transform duration-300 hover:scale-110">
          <div className="flex gap-2 items-center">
            <Users size={20} />
            <p className="hidden lg:block">{totalUsers} Users</p>
          </div>
          <div className="space-x-2 hidden md:block">
            <Button
              variant={activeTable === "users" ? "default" : "outline"}
              size="icon"
              onClick={() => handleEyeClick("users")}
            >
              <Eye size={20} />
            </Button>
            <Button
              variant={activeChart === "users" ? "default" : "outline"}
              size="icon"
              onClick={() => handleChartClick("users")}
            >
              <ChartNoAxesCombined size={20} />
            </Button>
          </div>
        </div>

        <div className="border-2 rounded-md w-fit md:w-full p-4 flex items-center justify-between hover:shadow-md transition-transform duration-300 hover:scale-110">
          <div className="flex gap-2 items-center">
            <CodeXml size={20} />
            <p className="hidden lg:block">{totalQuestions} Questions</p>
          </div>
          <div className="space-x-2 hidden md:block">
            <Button
              variant={activeTable === "questions" ? "default" : "outline"}
              size="icon"
              onClick={() => handleEyeClick("questions")}
            >
              <Eye size={20} />
            </Button>
            <Button
              variant={activeChart === "questions" ? "default" : "outline"}
              size="icon"
              onClick={() => handleChartClick("questions")}
            >
              <ChartNoAxesCombined size={20} />
            </Button>
          </div>
        </div>

        <div className="border-2 rounded-md w-fit md:w-full p-4 flex items-center justify-between hover:shadow-md transition-transform duration-300 hover:scale-110">
          <div className="flex gap-2 items-center">
            <Calendar size={20} />
            <p className="hidden lg:block">{upcomingClasses} Class upcoming</p>
          </div>
          <div className="space-x-2 hidden md:block">
            <Button
              variant={activeTable === "upcoming" ? "default" : "outline"}
              size="icon"
              onClick={() => handleEyeClick("upcoming")}
            >
              <Eye size={20} />
            </Button>
            <Button
              variant={activeChart === "upcoming" ? "default" : "outline"}
              size="icon"
              onClick={() => handleChartClick("upcoming")}
            >
              <ChartNoAxesCombined size={20} />
            </Button>
          </div>
        </div>

        <div className="border-2 rounded-md w-fit md:w-full p-4 flex items-center justify-between hover:shadow-md transition-transform duration-300 hover:scale-110">
          <div className="flex gap-2 items-center">
            <CalendarClock size={20} />
            <p className="hidden lg:block">{completedClasses} Class completed</p>
          </div>
          <div className="space-x-2 hidden md:block">
            <Button
              variant={activeTable === "completed" ? "default" : "outline"}
              size="icon"
              onClick={() => handleEyeClick("completed")}
            >
              <Eye size={20} />
            </Button>
            <Button
              variant={activeChart === "completed" ? "default" : "outline"}
              size="icon"
              onClick={() => handleChartClick("completed")}
            >
              <ChartNoAxesCombined size={20} />
            </Button>
          </div>
        </div>
      </div>

      {/* Render chart hoặc table */}
      {activeChart ? <DashboardCharts type={activeChart} data={{ users, questions, rooms }} /> : renderTable()}
    </div>
  );
};

export default DashboardPage;
