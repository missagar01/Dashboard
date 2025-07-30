"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, CheckCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

interface SheetRow {
  id: number
  rowIndex: number // Actual row index in sheet (for updates)
  taskId: string
  doerName: string
  task: string
  date: string
  columnJ: string // Column J date for filtering
  columnK: string // Column K value for determining extend column
  status: string
  columnL: string // This will determine pending vs history
}


interface TaskUpdate {
  taskId: string
  status: string
  extendDate: string
  isSelected: boolean
}

export default function TasksView() {
  const [data, setData] = useState<SheetRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [taskUpdates, setTaskUpdates] = useState<{[key: string]: TaskUpdate}>({})
  const [dateFilter, setDateFilter] = useState<string>("all") // Add this missing state

  // Fetch data from Google Sheets
  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log("Fetching data from Google Sheets...")
      
      // First, let's test without sheet parameter to see what sheets are available
      const testResponse = await fetch("https://script.google.com/macros/s/AKfycbw7DWi7erjdmCnV2BQNCf-XG4W4k8XTUgx8QnVZukiGOU6CEeegkqrLb95m91BL2Nvh/exec")
      const testResult = await testResponse.json()
      console.log("Test response (no sheet param):", testResult)
      
      // Now try with Master sheet
      const response = await fetch("https://script.google.com/macros/s/AKfycbw7DWi7erjdmCnV2BQNCf-XG4W4k8XTUgx8QnVZukiGOU6CEeegkqrLb95m91BL2Nvh/exec?sheet=Master&action=fetch")
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log("Response from Google Apps Script:", result)
      
      if (result.success && result.data) {
        // Skip header row and map the data
        const mappedData = result.data.slice(1).map((row: any[], index: number) => ({
          id: index,
          rowIndex: index + 2, // +2 because we skip header and arrays are 0-based but sheets are 1-based
          taskId: row[0] || '', // Column A
          doerName: row[1] || '', // Column B
          task: row[2] || '', // Column C
          date: row[3] || '', // Column D
          columnJ: row[9] || '', // Column J (index 9) - this is the date we'll filter by
          columnK: row[10] || '0', // Column K (index 10) - this determines which column to update for extend
          status: row[12] || '', // Column M
          columnL: row[11] || '' // Column L (index 11 since array is 0-based)
        })).filter((row: SheetRow) => row.taskId) // Filter out empty rows
        
        console.log("Mapped data:", mappedData)
        setData(mappedData)
      } else {
        throw new Error(result.error || 'Failed to fetch data')
      }
    } catch (err) {
      console.error("Error fetching data:", err)
      setError(`Failed to load tasks: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchData()
  }, [])

  // Handle checkbox change
  const handleCheckboxChange = (taskId: string, checked: boolean) => {
    setTaskUpdates(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        taskId,
        isSelected: checked,
        status: prev[taskId]?.status || '',
        extendDate: prev[taskId]?.extendDate || ''
      }
    }))
  }

  // Handle status change
  const handleStatusChange = (taskId: string, status: string) => {
    setTaskUpdates(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        taskId,
        status,
        isSelected: prev[taskId]?.isSelected || false,
        extendDate: status === 'Done' ? '' : prev[taskId]?.extendDate || ''
      }
    }))
  }

  // Handle extend date change
  const handleExtendDateChange = (taskId: string, date: string) => {
    setTaskUpdates(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        taskId,
        extendDate: date,
        isSelected: prev[taskId]?.isSelected || false,
        status: prev[taskId]?.status || ''
      }
    }))
  }

  // Submit updates
// Submit updates
const handleSubmit = async () => {
  const selectedTasks = Object.values(taskUpdates).filter(update => update.isSelected && update.status)
  
  if (selectedTasks.length === 0) {
    alert("Please select tasks and set their status before submitting.")
    return
  }

  setSubmitting(true)
  
  try {
    for (const update of selectedTasks) {
      const task = data.find(t => t.taskId === update.taskId)
      if (!task) continue

      const formData = new FormData()
      formData.append('sheetName', 'Master')
      
      if (update.status === 'Done') {
        // For Done: Update Column L with current date and Column M with "Complete"
        formData.append('action', 'update')
        formData.append('rowIndex', task.rowIndex.toString())
        
        // Create array for the row with current values, updating only L and M
        const rowData = new Array(13).fill('')
        rowData[11] = new Date().toISOString().split('T')[0] // Column L - current date
        rowData[12] = 'Complete' // Column M - status
        
        formData.append('rowData', JSON.stringify(rowData))
      } else if (update.status === 'Extend' && update.extendDate) {
        // For Extend: Check Column K value to determine target column
        formData.append('action', 'update')
        formData.append('rowIndex', task.rowIndex.toString())
        
        // Get Column K value (index 10)
        const columnKValue = task.columnK || '0' // Default to 0 if not present
        
        // Create array for the row with current values
        const rowData = new Array(13).fill('')
        
        // Determine which column to update based on Column K value
        switch (columnKValue.toString()) {
          case '0':
            rowData[4] = update.extendDate // Column E
            break
          case '1':
            rowData[5] = update.extendDate // Column F
            break
          case '2':
            rowData[6] = update.extendDate // Column G
            break
          case '3':
            rowData[7] = update.extendDate // Column H
            break
          case '4':
            rowData[8] = update.extendDate // Column I
            break
          default:
            rowData[4] = update.extendDate // Default to Column E
            break
        }
        
        formData.append('rowData', JSON.stringify(rowData))
      }

      const response = await fetch("https://script.google.com/macros/s/AKfycbw7DWi7erjdmCnV2BQNCf-XG4W4k8XTUgx8QnVZukiGOU6CEeegkqrLb95m91BL2Nvh/exec", {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(`Failed to update task ${update.taskId}: ${result.error}`)
      }
    }

    alert("Tasks updated successfully!")
    setTaskUpdates({}) // Clear selections
    await fetchData() // Refresh data
  } catch (err) {
    console.error("Error updating tasks:", err)
    alert(`Error updating tasks: ${err instanceof Error ? err.message : 'Unknown error'}`)
  } finally {
    setSubmitting(false)
  }
}

  // Get status badge color
  const getStatusBadgeColor = (status: string): string => {
    if (!status || status === "") return "bg-orange-100 text-orange-800"
    const statusLower = status.toLowerCase()
    if (statusLower.includes("completed") || statusLower.includes("complete")) return "bg-green-100 text-green-800"
    if (statusLower.includes("pending")) return "bg-orange-100 text-orange-800"
    if (statusLower.includes("progress") || statusLower.includes("ongoing")) return "bg-yellow-100 text-yellow-800"
    if (statusLower.includes("cancelled")) return "bg-red-100 text-red-800"
    return "bg-gray-100 text-gray-800"
  }

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0]
  }

  // Format date to dd/mm/yyyy
  const formatDate = (dateString: string) => {
    if (!dateString) return "No date"
    
    try {
      const date = new Date(dateString)
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    } catch {
      return dateString // Return original if parsing fails
    }
  }

  // Filter tasks based on column L
  const allPendingTasks = data.filter(task => !task.columnL || task.columnL.trim() === '')
  const completedTasks = data.filter(task => task.columnL && task.columnL.trim() !== '')
  
  // Apply date filter to pending tasks
  const pendingTasks = (() => {
    const today = getTodayDate()
    
    switch (dateFilter) {
      case "today":
        return allPendingTasks.filter(task => task.columnJ === today)
      case "overdue":
        return allPendingTasks.filter(task => {
          if (!task.columnJ) return false
          return task.columnJ < today
        })
      case "upcoming":
        return allPendingTasks.filter(task => {
          if (!task.columnJ) return false
          return task.columnJ > today
        })
      case "all":
      default:
        return allPendingTasks
    }
  })()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading tasks...
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-2xl font-bold">Tasks</h2>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full sm:w-auto">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter tasks..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="today">Today Tasks</SelectItem>
              <SelectItem value="overdue">Overdue Tasks</SelectItem>
              <SelectItem value="upcoming">Upcoming Tasks</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || Object.values(taskUpdates).filter(u => u.isSelected).length === 0}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            {submitting ? "Updating..." : "Submit Updates"}
          </Button>
          <Button onClick={fetchData} variant="outline" size="sm" className="w-full sm:w-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingTasks.length})
            {dateFilter !== "all" && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {dateFilter === "today" ? "Today" : dateFilter === "overdue" ? "Overdue" : "Upcoming"}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            History ({completedTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>
                Pending Tasks 
                {dateFilter !== "all" && (
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    (Filtered by: {dateFilter === "today" ? "Today" : dateFilter === "overdue" ? "Overdue" : "Upcoming"})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  <table className="w-full border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-semibold min-w-[60px]">Select</th>
                        <th className="text-left p-2 font-semibold min-w-[100px]">Task ID</th>
                        <th className="text-left p-2 font-semibold min-w-[120px]">Doer Name</th>
                        <th className="text-left p-2 font-semibold min-w-[200px]">Task</th>
                        <th className="text-left p-2 font-semibold min-w-[100px]">Original Date</th>
                        <th className="text-left p-2 font-semibold min-w-[100px]">Due Date</th>
                        <th className="text-left p-2 font-semibold min-w-[100px]">Current Status</th>
                        <th className="text-left p-2 font-semibold min-w-[120px]">Action</th>
                        <th className="text-left p-2 font-semibold min-w-[140px]">Extend Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingTasks.length > 0 ? (
                        pendingTasks.map((row) => {
                          const update = taskUpdates[row.taskId] || { taskId: row.taskId, status: '', extendDate: '', isSelected: false }
                          return (
                            <tr key={row.id} className="border-b hover:bg-gray-50">
                              <td className="p-2">
                                <Checkbox 
                                  checked={update.isSelected}
                                  onCheckedChange={(checked) => handleCheckboxChange(row.taskId, checked as boolean)}
                                />
                              </td>
                              <td className="p-2 font-medium text-blue-600 text-sm">{row.taskId}</td>
                              <td className="p-2 font-medium text-sm">{row.doerName}</td>
                              <td className="p-2 text-sm max-w-[200px] break-words">{row.task}</td>
                              <td className="p-2">
                                <Badge variant="outline" className="text-black text-xs whitespace-nowrap">
                                  {formatDate(row.date)}
                                </Badge>
                              </td>
                              <td className="p-2">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs whitespace-nowrap ${
                                    row.columnJ < getTodayDate() 
                                      ? "bg-red-50 text-red-700 border-red-200" 
                                      : row.columnJ === getTodayDate()
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : "bg-gray-50 text-gray-700"
                                  }`}
                                >
                                  {formatDate(row.columnJ)}
                                </Badge>
                              </td>
                              <td className="p-2">
                                <Badge variant="secondary" className={`text-xs ${getStatusBadgeColor(row.status)}`}>
                                  {row.status || "Pending"}
                                </Badge>
                              </td>
                              <td className="p-2">
                                <Select 
                                  value={update.status} 
                                  onValueChange={(value) => handleStatusChange(row.taskId, value)}
                                  disabled={!update.isSelected}
                                >
                                  <SelectTrigger className="w-full min-w-[100px] h-8 text-xs">
                                    <SelectValue placeholder="Select..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Done">Done</SelectItem>
                                    <SelectItem value="Extend">Extend</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="p-2">
                                <Input
                                  type="date"
                                  value={update.extendDate}
                                  onChange={(e) => handleExtendDateChange(row.taskId, e.target.value)}
                                  disabled={!update.isSelected || update.status !== 'Extend'}
                                  className="w-full min-w-[130px] h-8 text-xs"
                                />
                              </td>
                            </tr>
                          )
                        })
                      ) : (
                        <tr>
                          <td colSpan={9} className="text-center py-8 text-gray-500">
                            {dateFilter === "all" 
                              ? "No pending tasks found." 
                              : `No ${dateFilter} pending tasks found.`
                            }
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Completed Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  <table className="w-full border-collapse min-w-[800px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-semibold min-w-[100px]">Task ID</th>
                        <th className="text-left p-2 font-semibold min-w-[120px]">Doer Name</th>
                        <th className="text-left p-2 font-semibold min-w-[200px]">Task</th>
                        <th className="text-left p-2 font-semibold min-w-[100px]">Date</th>
                        <th className="text-left p-2 font-semibold min-w-[100px]">Status</th>
                        <th className="text-left p-2 font-semibold min-w-[120px]">Completion Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedTasks.length > 0 ? (
                        completedTasks.map((row) => (
                          <tr key={row.id} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-medium text-blue-600 text-sm">{row.taskId}</td>
                            <td className="p-2 font-medium text-sm">{row.doerName}</td>
                            <td className="p-2 text-sm max-w-[200px] break-words">{row.task}</td>
                            <td className="p-2">
                              <Badge variant="outline" className="text-black text-xs whitespace-nowrap">
                                {formatDate(row.date)}
                              </Badge>
                            </td>
                            <td className="p-2">
                              <Badge variant="secondary" className={`text-xs ${getStatusBadgeColor(row.status)}`}>
                                {row.status || "Completed"}
                              </Badge>
                            </td>
                            <td className="p-2">
                              <Badge variant="outline" className="bg-green-50 text-green-700 text-xs whitespace-nowrap">
                                {formatDate(row.columnL)}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-gray-500">
                            No completed tasks found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}