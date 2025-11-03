import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ComposedChart,
} from "recharts";
import type { Doc } from "convex/_generated/dataModel";
import { getTeacherInfo, getStudentInfo, getMeetingStatus } from "@/lib/utils";

interface DashboardChartsProps {
  type: "users" | "questions" | "upcoming" | "completed";
  data: {
    users?: Doc<"users">[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    questions?: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rooms?: any[];
  };
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const DashboardCharts = ({ type, data }: DashboardChartsProps) => {
  const renderChart = () => {
    switch (type) {
      case "users":
        // Pie Chart: Teacher vs Student
        const roleData = [
          { name: "Teacher", value: (data.users || []).filter((u) => u.role === "teacher").length },
          { name: "Student", value: (data.users || []).filter((u) => u.role === "student").length },
        ];
        // Bar Chart: Top 10 solved questions
        const solvedData = (data.users || [])
          .map((u) => ({ name: u.name, solved: u.solvedQuestions?.length || 0 }))
          .sort((a, b) => b.solved - a.solved)
          .slice(0, 10);
        // Line Chart: Xu hướng số lượng users theo thời gian (dùng _creationTime thực)
        const userTrendMap = new Map<string, number>();
        (data.users || []).forEach((u) => {
          if (u._creationTime) {
            const date = new Date(u._creationTime).toISOString().split("T")[0]; // YYYY-MM-DD
            userTrendMap.set(date, (userTrendMap.get(date) || 0) + 1);
          }
        });
        const userTrendData = Array.from(userTrendMap, ([date, count]) => ({ date, count })).sort((a, b) =>
          a.date.localeCompare(b.date)
        );

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-4 border rounded-md bg-white shadow">
              <h3 className="text-lg font-semibold mb-4 text-black">Teacher vs Student (Pie Chart)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={roleData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label
                  >
                    {roleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="p-4 border rounded-md bg-white shadow">
              <h3 className="text-lg font-semibold mb-4 text-black">Top 10 Solved Questions (Bar Chart)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={solvedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="solved" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="p-4 border rounded-md bg-white shadow">
              <h3 className="text-lg font-semibold mb-4 text-black">User Trend Over Time (Line Chart)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case "questions":
        // Bar Chart: Questions by level
        const levelData = [
          { name: "Easy", value: (data.questions || []).filter((q) => q.level === "Easy").length },
          { name: "Medium", value: (data.questions || []).filter((q) => q.level === "Medium").length },
          { name: "Hard", value: (data.questions || []).filter((q) => q.level === "Hard").length },
        ];
        // Pie Chart: Questions by author
        const authorMap = new Map<string, number>();
        (data.questions || []).forEach((q) => {
          const authorName = getTeacherInfo(data.users || [], q.authorId).name;
          authorMap.set(authorName, (authorMap.get(authorName) || 0) + 1);
        });
        const authorData = Array.from(authorMap, ([name, value]) => ({ name, value }));
        // Combo Chart: Bar for level + Line for trend over time (based on _creationTime)
        const questionTrendMap = new Map<string, number>();
        (data.questions || []).forEach((q) => {
          if (q._creationTime) {
            const date = new Date(q._creationTime).toISOString().split("T")[0]; // YYYY-MM-DD
            questionTrendMap.set(date, (questionTrendMap.get(date) || 0) + 1);
          }
        });
        const comboData = levelData.map((item) => ({
          ...item,
          trend: questionTrendMap.get(item.name) || 0, // Giả định map theo level, có thể điều chỉnh
        }));

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-4 border rounded-md bg-white shadow">
              <h3 className="text-lg font-semibold mb-4 text-black">Questions by Level (Bar Chart)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={levelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="p-4 border rounded-md bg-white shadow">
              <h3 className="text-lg font-semibold mb-4 text-black">Questions by Author (Pie Chart)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={authorData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label
                  >
                    {authorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="p-4 border rounded-md bg-white shadow">
              <h3 className="text-lg font-semibold mb-4 text-black">Questions Trend (Combo Chart)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={comboData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                  <Line type="monotone" dataKey="trend" stroke="#ff7300" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case "upcoming":
        // Bar Chart: Upcoming classes by day
        const upcomingMap = new Map<string, number>();
        (data.rooms || [])
          .filter((r) => getMeetingStatus(r) === "upcoming")
          .forEach((r) => {
            const date = new Date(r.startTime).toDateString();
            upcomingMap.set(date, (upcomingMap.get(date) || 0) + 1);
          });
        const upcomingData = Array.from(upcomingMap, ([name, value]) => ({ name, value }));
        // Pie Chart: Classes by teacher
        const teacherMap = new Map<string, number>();
        (data.rooms || [])
          .filter((r) => getMeetingStatus(r) === "upcoming")
          .forEach((r) => {
            r.teacherIds.forEach((id: string) => {
              const teacherName = getTeacherInfo(data.users || [], id).name;
              teacherMap.set(teacherName, (teacherMap.get(teacherName) || 0) + 1);
            });
          });
        const teacherData = Array.from(teacherMap, ([name, value]) => ({ name, value }));

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-4 border rounded-md bg-white shadow">
              <h3 className="text-lg font-semibold mb-4 text-black">Upcoming Classes by Date (Bar Chart)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={upcomingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#ff7300" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="p-4 border rounded-md bg-white shadow">
              <h3 className="text-lg font-semibold mb-4 text-black">Upcoming Classes by Teacher (Pie Chart)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={teacherData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label
                  >
                    {teacherData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case "completed":
        // Bar Chart: Completed classes by day
        const completedMap = new Map<string, number>();
        (data.rooms || [])
          .filter((r) => getMeetingStatus(r) === "completed")
          .forEach((r) => {
            const date = new Date(r.startTime).toDateString();
            completedMap.set(date, (completedMap.get(date) || 0) + 1);
          });
        const completedData = Array.from(completedMap, ([name, value]) => ({ name, value }));
        // Pie Chart: Classes by student
        const studentMap = new Map<string, number>();
        (data.rooms || [])
          .filter((r) => getMeetingStatus(r) === "completed")
          .forEach((r) => {
            const studentName = getStudentInfo(data.users || [], r.studentId).name;
            studentMap.set(studentName, (studentMap.get(studentName) || 0) + 1);
          });
        const studentData = Array.from(studentMap, ([name, value]) => ({ name, value }));
        // Line Chart: Trend over time
        const completedTrendData = Array.from(completedMap, ([date, count]) => ({ date, count }));

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-4 border rounded-md bg-white shadow">
              <h3 className="text-lg font-semibold mb-4 text-black">Completed Classes by Date (Bar Chart)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={completedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#00ff00" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="p-4 border rounded-md bg-white shadow">
              <h3 className="text-lg font-semibold mb-4 text-black">Completed Classes by Student (Pie Chart)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={studentData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label
                  >
                    {studentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="p-4 border rounded-md bg-white shadow">
              <h3 className="text-lg font-semibold mb-4 text-black">Completed Classes Trend (Line Chart)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={completedTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      default:
        return <p>No chart available for this type.</p>;
    }
  };

  return (
    <div className="p-4 border rounded-md bg-white shadow">
      <h2 className="text-xl font-bold mb-4 capitalize text-black">{type} Charts</h2>
      {renderChart()}
    </div>
  );
};

export default DashboardCharts;
