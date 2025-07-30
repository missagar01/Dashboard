"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { CheckCircle, Plus, Clock } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar"
import AddTask from "../components/AddTask"
import TasksView from "../components/TaskView"

interface DataRow {
  id: number
  "Serial Number": string
  Name: string
  Task: string
  "Latest Revision": string
  "Total Revisions": number
  Status: string
  Week: string
}

interface Stats {
  total: number
  completed: number
  pending: number
  inProgress: number
  cancelled: number
}

interface StatsData {
  title: string
  value: number
  color: string
}

interface ChartData {
  name: string
  value: number
  color?: string
}

// Mock data for demonstration
const mockData: DataRow[] = [
  {
    id: 1,
    "Serial Number": "TSK001",
    Name: "John Doe",
    Task: "Design homepage layout",
    "Latest Revision": "v2.1",
    "Total Revisions": 3,
    Status: "Completed",
    Week: "Week 1",
  },
  {
    id: 2,
    "Serial Number": "TSK002",
    Name: "Jane Smith",
    Task: "Implement user authentication",
    "Latest Revision": "v1.0",
    "Total Revisions": 1,
    Status: "In Progress",
    Week: "Week 2",
  },
  {
    id: 3,
    "Serial Number": "TSK003",
    Name: "Mike Johnson",
    Task: "Database optimization",
    "Latest Revision": "v1.5",
    "Total Revisions": 2,
    Status: "Pending",
    Week: "Week 1",
  },
  {
    id: 4,
    "Serial Number": "TSK004",
    Name: "Sarah Wilson",
    Task: "API integration testing",
    "Latest Revision": "v3.0",
    "Total Revisions": 4,
    Status: "Completed",
    Week: "Week 3",
  },
  {
    id: 5,
    "Serial Number": "TSK005",
    Name: "David Brown",
    Task: "Mobile responsive design",
    "Latest Revision": "v1.2",
    "Total Revisions": 2,
    Status: "Cancelled",
    Week: "Week 2",
  },
  {
    id: 6,
    "Serial Number": "TSK006",
    Name: "Emily Davis",
    Task: "Performance optimization",
    "Latest Revision": "v2.0",
    "Total Revisions": 3,
    Status: "Pending",
    Week: "Week 4",
  },
  {
    id: 7,
    "Serial Number": "TSK007",
    Name: "Alex Chen",
    Task: "Security audit",
    "Latest Revision": "v1.0",
    "Total Revisions": 1,
    Status: "In Progress",
    Week: "Week 3",
  },
  {
    id: 8,
    "Serial Number": "TSK008",
    Name: "Lisa Anderson",
    Task: "Content management system",
    "Latest Revision": "v2.5",
    "Total Revisions": 5,
    Status: "Completed",
    Week: "Week 4",
  },
]

export default function Dashboard() {
  // State for active section
  const [activeSection, setActiveSection] = useState<"dashboard" | "add-task" | "tasks">("dashboard")

  // State for data
  const [data, setData] = useState<DataRow[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    completed: 0,
    pending: 0,
    inProgress: 0,
    cancelled: 0,
  })

  // Calculate stats from data
  const calculateStatsFromData = (dataArray: DataRow[]): void => {
    const total = dataArray.length
    const completed = dataArray.filter((row) => row.Status && row.Status.toLowerCase().includes("completed")).length
    const pending = dataArray.filter(
      (row) => !row.Status || row.Status === "" || row.Status.toLowerCase().includes("pending"),
    ).length
    const inProgress = dataArray.filter(
      (row) =>
        row.Status && (row.Status.toLowerCase().includes("progress") || row.Status.toLowerCase().includes("ongoing")),
    ).length
    const cancelled = dataArray.filter((row) => row.Status && row.Status.toLowerCase().includes("cancelled")).length

    setStats({
      total,
      completed,
      pending,
      inProgress,
      cancelled,
    })
  }

  // Initialize with mock data
  useEffect(() => {
    setData(mockData)
    calculateStatsFromData(mockData)
  }, [])

  // Chart data
  const pieChartData: ChartData[] = [
    { name: "Pending", value: stats.pending, color: "#ef4444" },
    { name: "Completed", value: stats.completed, color: "#22c55e" },
    { name: "In Progress", value: stats.inProgress, color: "#eab308" },
    { name: "Cancelled", value: stats.cancelled, color: "#3b82f6" },
  ].filter((item) => item.value > 0)

  const barChartData: ChartData[] = [
    { name: "Pending", value: stats.pending },
    { name: "Completed", value: stats.completed },
    { name: "In Progress", value: stats.inProgress },
    { name: "Cancelled", value: stats.cancelled },
  ].filter((item) => item.value > 0)

  const statsData: StatsData[] = [
    { title: "Total Tasks", value: stats.total, color: "bg-cyan-400" },
    { title: "Completed", value: stats.completed, color: "bg-green-400" },
    { title: "Pending", value: stats.pending, color: "bg-red-400" },
    { title: "In Progress", value: stats.inProgress, color: "bg-yellow-400" },
    { title: "Cancelled", value: stats.cancelled, color: "bg-blue-400" },
  ]

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader>
            <h2 className="text-lg font-semibold px-2">Task Management</h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("dashboard")}
                      isActive={activeSection === "dashboard"}
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Dashboard</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("add-task")}
                      isActive={activeSection === "add-task"}
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Task</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setActiveSection("tasks")} isActive={activeSection === "tasks"}>
                      <Clock className="h-4 w-4" />
                      <span>Tasks</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Powered By{" "}
                <a
                  href="https://www.botivate.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Botivate
                </a>
              </p>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="bg-white shadow-sm border-b px-6 py-4 flex-shrink-0 sticky top-0 z-10">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-2xl font-bold text-gray-900">
                  {activeSection === "dashboard" && "Dashboard"}
                  {activeSection === "add-task" && "Add New Task"}
                  {activeSection === "tasks" && "Task Management"}
                </h1>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            {/* Dashboard Section */}
            {activeSection === "dashboard" && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {statsData.map((stat, index) => (
                    <Card key={index} className={`${stat.color} text-white border-0`}>
                      <CardContent className="p-6">
                        <div className="text-center">
                          <h3 className="text-lg font-medium mb-2">{stat.title}</h3>
                          <p className="text-4xl font-bold">{stat.value}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pie Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={120}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-center mt-4 space-x-4 flex-wrap">
                        {pieChartData.map((entry) => (
                          <div key={entry.name} className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                            <span className="text-sm">
                              {entry.name} ({entry.value})
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bar Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Status Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={barChartData}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Tasks Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Tasks Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <h4 className="font-semibold text-green-800">This Week</h4>
                        <p className="text-2xl font-bold text-green-600">
                          {data.filter((task) => task.Week === "Week 4").length}
                        </p>
                        <p className="text-sm text-green-600">Active Tasks</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-800">Avg Revisions</h4>
                        <p className="text-2xl font-bold text-blue-600">
                          {data.length > 0
                            ? Math.round(
                                (data.reduce((sum, task) => sum + task["Total Revisions"], 0) / data.length) * 10,
                              ) / 10
                            : 0}
                        </p>
                        <p className="text-sm text-blue-600">Per Task</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <h4 className="font-semibold text-purple-800">Team Members</h4>
                        <p className="text-2xl font-bold text-purple-600">
                          {new Set(data.map((task) => task.Name)).size}
                        </p>
                        <p className="text-sm text-purple-600">Active</p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <h4 className="font-semibold text-orange-800">Completion Rate</h4>
                        <p className="text-2xl font-bold text-orange-600">
                          {data.length > 0 ? Math.round((stats.completed / data.length) * 100) : 0}%
                        </p>
                        <p className="text-sm text-orange-600">Overall</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Add Task Section */}
            {activeSection === "add-task" && <AddTask />}

            {/* Tasks Section */}
            {activeSection === "tasks" && <TasksView data={data} />}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
