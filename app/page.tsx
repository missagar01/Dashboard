"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { CheckCircle, Plus, Clock, RefreshCw } from "lucide-react"
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
  completedGreen: number
  completedYellow: number
  completedRed: number
  pending: number
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

// Google Apps Script configuration
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbw7DWi7erjdmCnV2BQNCf-XG4W4k8XTUgx8QnVZukiGOU6CEeegkqrLb95m91BL2Nvh/exec"
const SHEET_NAME = "Master"

import AddTask from "../components/AddTask"
import TasksView from "../components/TaskView"

export default function Dashboard() {
  // State for active section
  const [activeSection, setActiveSection] = useState<"dashboard" | "add-task" | "tasks">("dashboard")

  // State for data
  const [data, setData] = useState<DataRow[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    completedGreen: 0,
    completedYellow: 0,
    completedRed: 0,
    pending: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avgRevisions, setAvgRevisions] = useState(0)

  // Fetch data from Google Sheets
  const fetchSheetData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${SCRIPT_URL}?sheet=${SHEET_NAME}&action=fetch`)
      const result = await response.json()

      if (result.success && result.data) {
        // Convert sheet data to our format
        const sheetData = result.data
        const headers = sheetData[0] // First row contains headers

        // Skip header row and process data
        const processedData: DataRow[] = []
        let totalRevisions = 0
        let revisionCount = 0

        for (let i = 1; i < sheetData.length; i++) {
          const row = sheetData[i]
          // Only process rows that have data in column A (assuming it's the first column)
          if (row[0]) {
            const taskData: DataRow = {
              id: i,
              "Serial Number": row[0] || "",
              Name: row[1] || "",
              Task: row[2] || "",
              "Latest Revision": row[3] || "",
              "Total Revisions": Number.parseFloat(row[10]) || 0, // Column K (index 10)
              Status: row[12] || "", // Column M (index 12)
              Week: row[7] || "", // Assuming week is in column H
            }
            processedData.push(taskData)

            // Calculate total revisions for average (from column K)
            if (row[10] && !isNaN(Number.parseFloat(row[10]))) {
              totalRevisions += Number.parseFloat(row[10])
              revisionCount++
            }
          }
        }

        setData(processedData)
        calculateStatsFromData(processedData)

        // Calculate average revisions
        setAvgRevisions(revisionCount > 0 ? Math.round((totalRevisions / revisionCount) * 10) / 10 : 0)
      } else {
        throw new Error(result.error || "Failed to fetch data")
      }
    } catch (err) {
      console.error("Error fetching data:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  // Calculate stats from data based on column M and K
  const calculateStatsFromData = (dataArray: DataRow[]): void => {
    const total = dataArray.length
    let completedGreen = 0
    let completedYellow = 0
    let completedRed = 0
    let pending = 0

    dataArray.forEach((row) => {
      const isCompleted = row.Status && row.Status.toLowerCase().includes("complete")
      const revisions = row["Total Revisions"] || 0

      if (isCompleted) {
        if (revisions === 0) {
          completedGreen++
        } else if (revisions === 1) {
          completedYellow++
        } else if (revisions >= 2) {
          completedRed++
        }
      } else {
        pending++
      }
    })

    setStats({
      total,
      completedGreen,
      completedYellow,
      completedRed,
      pending,
    })
  }

  // Load data on component mount
  useEffect(() => {
    fetchSheetData()
  }, [])

  // Chart data
  const pieChartData: ChartData[] = [
    { name: "Pending", value: stats.pending, color: "#c1121f" },
    { name: "Completed (0 Rev)", value: stats.completedGreen, color: "#22c55e" },
    { name: "Completed (1 Rev)", value: stats.completedYellow, color: "#eab308" },
    { name: "Completed (2+ Rev)", value: stats.completedRed, color: "#ef4444" },
  ].filter((item) => item.value > 0)

  const barChartData: ChartData[] = [
    { name: "Pending", value: stats.pending },
    { name: "Completed (0 Rev)", value: stats.completedGreen },
    { name: "Completed (1 Rev)", value: stats.completedYellow },
    { name: "Completed (2+ Rev)", value: stats.completedRed },
  ].filter((item) => item.value > 0)

  const statsData: StatsData[] = [
    { title: "Total Tasks", value: stats.total, color: "bg-cyan-400" },
    { title: "Completed (0 Rev)", value: stats.completedGreen, color: "bg-green-400" },
    { title: "Completed (1 Rev)", value: stats.completedYellow, color: "bg-yellow-400" },
    { title: "Completed (2+ Rev)", value: stats.completedRed, color: "bg-red-400" },
    { title: "Pending", value: stats.pending, color: "bg-red-800" },
  ]

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar className="hidden md:flex">
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

        <SidebarInset className="flex-1 flex flex-col min-w-0">
          <header className="bg-white shadow-sm border-b px-4 sm:px-6 py-4 flex-shrink-0 sticky top-0 z-10">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden" />
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {activeSection === "dashboard" && "Dashboard"}
                  {activeSection === "add-task" && "Add New Task"}
                  {activeSection === "tasks" && "Task Management"}
                </h1>
              </div>

              {/* Mobile Navigation */}
              <div className="flex md:hidden gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setActiveSection("dashboard")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap ${
                    activeSection === "dashboard"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <CheckCircle className="h-4 w-4" />
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveSection("add-task")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap ${
                    activeSection === "add-task"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  Add Task
                </button>
                <button
                  onClick={() => setActiveSection("tasks")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap ${
                    activeSection === "tasks" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Clock className="h-4 w-4" />
                  Tasks
                </button>
              </div>

              <button
                onClick={fetchSheetData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 sm:p-6">
            {/* Error Display */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">Error: {error}</p>
                <button onClick={fetchSheetData} className="mt-2 text-red-600 hover:text-red-800 underline">
                  Try Again
                </button>
              </div>
            )}

            {/* Loading Display */}
            {loading && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading data from Google Sheets...
                </p>
              </div>
            )}

            {/* Dashboard Section */}
            {activeSection === "dashboard" && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {statsData.map((stat, index) => (
                    <Card key={index} className={`${stat.color} text-white border-0`}>
                      <CardContent className="p-4 sm:p-6">
                        <div className="text-center">
                          <h3 className="text-sm sm:text-lg font-medium mb-2">{stat.title}</h3>
                          <p className="text-2xl sm:text-4xl font-bold">{stat.value}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Pie Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg sm:text-xl">Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[250px] sm:h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={80}
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
                      <div className="flex justify-center mt-4 space-x-2 sm:space-x-4 flex-wrap gap-2">
                        {pieChartData.map((entry) => (
                          <div key={entry.name} className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                            <span className="text-xs sm:text-sm">
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
                      <CardTitle className="text-lg sm:text-xl">Status Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[250px] sm:h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={barChartData}>
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 12 }}
                              interval={0}
                              angle={-45}
                              textAnchor="end"
                              height={60}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Add Task Section */}
            {activeSection === "add-task" && <AddTask />}

            {/* Tasks Section */}
            {activeSection === "tasks" && <TasksView />}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
