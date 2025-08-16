"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, Clock, RefreshCw, Search } from "lucide-react"
import { memo, useCallback, useEffect, useMemo, useState } from "react"

interface SheetRow {
  id: number
  rowIndex: number // Actual row index in sheet (for updates)
  taskId: string
  week: string // Add week field
  doerName: string
  task: string
  date: string
  columnJ: string // Column J date for filtering
  columnK: string // Column K value for determining extend column
  status: string
  columnL: string // This will determine pending vs history
  columnM: string // Add Column M data
  columnO: string // Add this line
}

interface TaskUpdate {
  taskId: string
  status: string
  extendDate: string
  remarks: string
  isSelected: boolean
}

export default function TasksView() {
  const [data, setData] = useState<SheetRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [taskUpdates, setTaskUpdates] = useState<{ [key: string]: TaskUpdate }>({})
  const [dateFilter, setDateFilter] = useState<string>("all") // Add this missing state
  const [searchTerm, setSearchTerm] = useState<string>("") // Add search state
  const [doerList, setDoerList] = useState<string[]>([])
  const [transferSelections, setTransferSelections] = useState<{ [key: string]: string }>({})

  // Whether there is at least one selected task and all selected have non-empty remarks
  const hasEligibleSelection = useMemo(() => {
    const selected = Object.values(taskUpdates).filter((u) => u.isSelected)
    if (selected.length === 0) return false
    return selected.every((u) => u.remarks && u.remarks.trim().length > 0)
  }, [taskUpdates])

  // Fetch doer list from Doer List sheet
  const fetchDoerList = useCallback(async () => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbw7DWi7erjdmCnV2BQNCf-XG4W4k8XTUgx8QnVZukiGOU6CEeegkqrLb95m91BL2Nvh/exec?sheet=Doer%20List&action=fetch",
      )
      const result = await response.json()

      if (result.success && result.data) {
        // Extract names from Column A (index 0), skip header
        const names = result.data.slice(1).map((row: any[]) => row[0] || "").filter((name: string) => name.trim() !== "")
        setDoerList(names)
      }
    } catch (err) {
      console.error("Failed to fetch doer list:", err)
    }
  }, [])

  // Fetch data from Google Sheets
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // First, let's test without sheet parameter to see what sheets are available
      const testResponse = await fetch(
        "https://script.google.com/macros/s/AKfycbw7DWi7erjdmCnV2BQNCf-XG4W4k8XTUgx8QnVZukiGOU6CEeegkqrLb95m91BL2Nvh/exec",
      )
      const testResult = await testResponse.json()

      // Now try with Master sheet
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbw7DWi7erjdmCnV2BQNCf-XG4W4k8XTUgx8QnVZukiGOU6CEeegkqrLb95m91BL2Nvh/exec?sheet=Master&action=fetch",
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.data) {
        // Skip header row and map the data
        const mappedData = result.data
          .slice(1)
          .map((row: any[], index: number) => ({
            id: index,
            rowIndex: index + 2, // +2 because we skip header and arrays are 0-based but sheets are 1-based
            taskId: row[0] || "", // Column A
            week: row[13] || "", // Column M for week data
            doerName: row[1] || "", // Column B
            task: row[2] || "", // Column C
            date: row[3] || "", // Column D
            columnJ: row[9] || "", // Column J (index 9) - this is the date we'll filter by
            columnK: row[10] || "0", // Column K (index 10) - this determines which column to update for extend
            status: row[12] || "", // Column M for status as well
            columnL: row[11] || "", // Column L (index 11 since array is 0-based)
            columnM: row[12] || "", // Column M data
            columnO: row[14] || "", // Add this line
          }))
          .filter((row: SheetRow) => row.taskId) // Filter out empty rows

        setData(mappedData)
      } else {
        throw new Error(result.error || "Failed to fetch data")
      }
    } catch (err) {
      setError(`Failed to load tasks: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load data on component mount
  useEffect(() => {
    fetchData()
    fetchDoerList()
  }, [fetchData, fetchDoerList])

  // Handle checkbox change
  const handleCheckboxChange = useCallback((taskId: string, checked: boolean) => {
    setTaskUpdates((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        taskId,
        isSelected: checked,
        status: prev[taskId]?.status || "",
        extendDate: prev[taskId]?.extendDate || "",
        remarks: prev[taskId]?.remarks || "",
      },
    }))
  }, [])

  // Handle status change
  const handleStatusChange = useCallback((taskId: string, status: string) => {
    setTaskUpdates((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        taskId,
        status,
        isSelected: prev[taskId]?.isSelected || false,
        extendDate: status === "Extend" ? prev[taskId]?.extendDate || "" : "",
      },
    }))
  }, [])

  // Handle extend date change
  const handleExtendDateChange = useCallback((taskId: string, date: string) => {
    setTaskUpdates((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        taskId,
        extendDate: date,
        isSelected: prev[taskId]?.isSelected || false,
        status: prev[taskId]?.status || "",
      },
    }))
  }, [])

  // Handle remarks change
  const handleRemarksChange = useCallback((taskId: string, text: string) => {
    setTaskUpdates((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        taskId,
        remarks: text,
        isSelected: prev[taskId]?.isSelected || false,
        status: prev[taskId]?.status || "",
      },
    }))
  }, [])

  // Handle transfer selection
  const handleTransferSelection = useCallback((taskId: string, selectedDoer: string) => {
    setTransferSelections((prev) => ({
      ...prev,
      [taskId]: selectedDoer,
    }))
  }, [])

  // Submit updates
  const handleSubmit = useCallback(async () => {
    const selectedTasks = Object.values(taskUpdates).filter(
      (update) => update.isSelected && (update.remarks && update.remarks.trim().length > 0),
    )

    if (selectedTasks.length === 0) {
      alert("Please select tasks and add remarks before submitting.")
      return
    }

    setSubmitting(true)
    try {
      for (const update of selectedTasks) {
        const task = data.find((t) => t.taskId === update.taskId)
        if (!task) continue

        const formData = new FormData()
        formData.append("sheetName", "Master")

        if (update.status === "Done") {
          // For Done: Update Column L with current date and Column M with "Complete"
          formData.append("action", "update")
          formData.append("rowIndex", task.rowIndex.toString())

          // Create array for the row with current values, updating only L, M and P (remarks)
          const rowData = new Array(16).fill("")
          rowData[11] = new Date().toISOString().split("T")[0] // Column L - current date
          rowData[12] = "Complete" // Column M - status
          rowData[15] = update.remarks || "" // Column P - remarks
          formData.append("rowData", JSON.stringify(rowData))
        } else if (update.status === "Cancel") {
          // For Cancel: Update Column L with current date and Column M with "Cancel"
          formData.append("action", "update")
          formData.append("rowIndex", task.rowIndex.toString())

          const rowData = new Array(16).fill("")
          rowData[11] = new Date().toISOString().split("T")[0] // Column L - current date
          rowData[12] = "Cancel" // Column M - status
          rowData[15] = update.remarks || "" // Column P - remarks
          formData.append("rowData", JSON.stringify(rowData))
        } else if (update.status === "Transfer") {
          const selectedDoer = transferSelections[update.taskId]
          if (!selectedDoer) {
            alert(`Please select a doer for transfer of task ${update.taskId}`)
            continue
          }

          // Get last TN ID from Master
          const masterResponse = await fetch(
            "https://script.google.com/macros/s/AKfycbw7DWi7erjdmCnV2BQNCf-XG4W4k8XTUgx8QnVZukiGOU6CEeegkqrLb95m91BL2Nvh/exec?sheet=Master&action=fetch"
          )
          const masterResult = await masterResponse.json()

          let newTaskId = "TN-1"
          if (masterResult.success && masterResult.data && masterResult.data.length > 1) {
            const lastTaskId = masterResult.data[masterResult.data.length - 1][0]
            const match = lastTaskId.match(/^TN-(\d+)$/)
            if (match) {
              const lastNumber = parseInt(match[1], 10) || 0
              newTaskId = `TN-${lastNumber + 1}`
            }
          }

          // Format date as dd/mm/yyyy
          const formatDate = (date) => {
            const d = new Date(date)
            const day = String(d.getDate()).padStart(2, "0")
            const month = String(d.getMonth() + 1).padStart(2, "0")
            const year = d.getFullYear()
            return `${day}/${month}/${year}`
          }

          // 1️⃣ Update current task to Transfer
          const formData = new FormData()
          formData.append("sheetName", "Master")
          formData.append("action", "update")
          formData.append("rowIndex", task.rowIndex.toString())

          const rowData = new Array(16).fill("")
          rowData[11] = new Date().toISOString().split("T")[0] // Column L (yyyy-mm-dd)
          rowData[12] = "Transfer" // Column M
          rowData[15] = update.remarks || "" // Column P
          formData.append("rowData", JSON.stringify(rowData))

          const transferResponse = await fetch(
            "https://script.google.com/macros/s/AKfycbw7DWi7erjdmCnV2BQNCf-XG4W4k8XTUgx8QnVZukiGOU6CEeegkqrLb95m91BL2Nvh/exec",
            { method: "POST", body: formData }
          )
          const transferResult = await transferResponse.json()
          if (!transferResult.success) {
            throw new Error(`Failed to transfer task ${update.taskId}: ${transferResult.error}`)
          }

          // 2️⃣ Append new row with only required columns
          const newFormData = new FormData()
          newFormData.append("sheetName", "Master")
          newFormData.append("action", "insert")

          const newRowData = new Array(16).fill("") // keep 16 columns but empty
          newRowData[0] = newTaskId // Column A
          newRowData[1] = selectedDoer // Column B
          newRowData[2] = task.task // Column C
          newRowData[3] = formatDate(task.date) // Column D in dd/mm/yyyy
          newRowData[12] = "Pending" // Column M

          newFormData.append("rowData", JSON.stringify(newRowData))

          const appendResponse = await fetch(
            "https://script.google.com/macros/s/AKfycbw7DWi7erjdmCnV2BQNCf-XG4W4k8XTUgx8QnVZukiGOU6CEeegkqrLb95m91BL2Nvh/exec",
            { method: "POST", body: newFormData }
          )
          const appendResult = await appendResponse.json()
          if (!appendResult.success) {
            throw new Error(`Failed to append new task row: ${appendResult.error}`)
          }

          console.log(`✅ Transfer complete: Old task updated, new task ${newTaskId} added`)
          continue
        }
        else if (update.status === "Extend" && update.extendDate) {
          // For Extend: Check Column K value to determine target column
          formData.append("action", "update")
          formData.append("rowIndex", task.rowIndex.toString())

          // Get Column K value (index 10)
          const columnKValue = task.columnK || "0" // Default to 0 if not present

          // Create array for the row with current values (ensure space up to Column P for remarks)
          const rowData = new Array(16).fill("")

          // Determine which column to update based on Column K value
          switch (columnKValue.toString()) {
            case "0":
              rowData[4] = update.extendDate // Column E
              break
            case "1":
              rowData[5] = update.extendDate // Column F
              break
            case "2":
              rowData[6] = update.extendDate // Column G
              break
            case "3":
              rowData[7] = update.extendDate // Column H
              break
            case "4":
              rowData[8] = update.extendDate // Column I
              break
            default:
              rowData[4] = update.extendDate // Default to Column E
              break
          }

          // Ensure current status shows Pending after extending
          rowData[12] = "Pending" // Column M

          // Always write remarks to Column P
          rowData[15] = update.remarks || ""
          formData.append("rowData", JSON.stringify(rowData))
        } else if (update.status === "Hold") {
          // For Hold: Update Column M to "Hold" and write remarks to Column P
          formData.append("action", "update")
          formData.append("rowIndex", task.rowIndex.toString())

          const rowData = new Array(16).fill("")
          rowData[12] = "Hold" // Column M - status
          rowData[15] = update.remarks || "" // Column P - remarks
          formData.append("rowData", JSON.stringify(rowData))
        } else {
          // For other statuses (e.g., Hold) or when only remarks need saving
          if ((update.remarks || "").trim().length > 0) {
            formData.append("action", "update")
            formData.append("rowIndex", task.rowIndex.toString())
            const rowData = new Array(16).fill("")
            rowData[15] = update.remarks || ""
            formData.append("rowData", JSON.stringify(rowData))
          } else {
            // Skip if nothing to update
            continue
          }
        }

        const response = await fetch(
          "https://script.google.com/macros/s/AKfycbw7DWi7erjdmCnV2BQNCf-XG4W4k8XTUgx8QnVZukiGOU6CEeegkqrLb95m91BL2Nvh/exec",
          {
            method: "POST",
            body: formData,
          },
        )

        const result = await response.json()
        if (!result.success) {
          throw new Error(`Failed to update task ${update.taskId}: ${result.error}`)
        }
      }

      alert("Tasks updated successfully!")
      setTaskUpdates({}) // Clear selections
      setTransferSelections({}) // Clear transfer selections
      await fetchData() // Refresh data
    } catch (err) {
      alert(`Error updating tasks: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setSubmitting(false)
    }
  }, [data, taskUpdates, transferSelections, fetchData])

  // Get status badge color
  const getStatusBadgeColor = (status: string): string => {
    if (!status || status === "") return "bg-orange-100 text-orange-800"
    const statusLower = status.toLowerCase()
    if (statusLower.includes("completed") || statusLower.includes("complete")) return "bg-green-100 text-green-800"
    if (statusLower.includes("pending")) return "bg-orange-100 text-orange-800"
    if (statusLower.includes("hold")) return "bg-blue-100 text-blue-800"
    if (statusLower.includes("progress") || statusLower.includes("ongoing")) return "bg-yellow-100 text-yellow-800"
    if (statusLower.includes("cancelled")) return "bg-red-100 text-red-800"
    if (statusLower.includes("cancel")) return "bg-red-100 text-red-800"
    if (statusLower.includes("transfer")) return "bg-purple-100 text-purple-800"
    return "bg-gray-100 text-gray-800"
  }

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0]
  }

  // Format date to dd/mm/yyyy - if already in dd/mm/yyyy format, return as is
  const formatDate = (dateString: string) => {
    if (!dateString) return "No date"

    // If it's already in dd/mm/yyyy format, return as is
    if (dateString.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      return dateString
    }

    try {
      const date = new Date(dateString)
      if (!isNaN(date.getTime())) {
        const day = date.getDate().toString().padStart(2, "0")
        const month = (date.getMonth() + 1).toString().padStart(2, "0")
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
      }
    } catch {
      // If parsing fails, return original string
    }
    return dateString
  }

  // Search filter function
  const filterTasksBySearch = (tasks: SheetRow[]) => {
    if (!searchTerm.trim()) return tasks
    const searchLower = searchTerm.toLowerCase().trim()
    return tasks.filter(
      (task) =>
        task.taskId.toLowerCase().includes(searchLower) ||
        task.week.toLowerCase().includes(searchLower) ||
        task.doerName.toLowerCase().includes(searchLower) ||
        task.task.toLowerCase().includes(searchLower) ||
        task.date.toLowerCase().includes(searchLower) ||
        task.columnJ.toLowerCase().includes(searchLower) ||
        task.status.toLowerCase().includes(searchLower) ||
        formatDate(task.columnJ).toLowerCase().includes(searchLower) ||
        formatDate(task.columnL).toLowerCase().includes(searchLower),
    )
  }

  // Filter tasks based on column L
  const allPendingTasks = useMemo(() => data.filter((task) => !task.columnL || task.columnL.trim() === ""), [data])
  const completedTasks = useMemo(() => data.filter((task) => task.columnL && task.columnL.trim() !== ""), [data])

  // Helper function to convert date string to yyyy-mm-dd format for comparison
  const normalizeDate = (dateString: string) => {
    if (!dateString) return ""

    // If it's already in yyyy-mm-dd format, return as is
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString
    }

    // If it's in dd/mm/yyyy format, convert to yyyy-mm-dd
    if (dateString.includes("/")) {
      const parts = dateString.split("/")
      if (parts.length === 3) {
        const day = parts[0].padStart(2, "0")
        const month = parts[1].padStart(2, "0")
        const year = parts[2]
        const normalized = `${year}-${month}-${day}`
        return normalized
      }
    }

    // Try to parse as date and convert
    try {
      const date = new Date(dateString)
      if (!isNaN(date.getTime())) {
        const normalized = date.toISOString().split("T")[0]
        return normalized
      }
    } catch (error) {

    }
    return dateString
  }

  // Apply date filter to pending tasks based on Column O text values
  const dateFilteredPendingTasks = useMemo(() => {
    switch (dateFilter) {
      case "today":
        return allPendingTasks.filter((task) => (task.columnO?.toLowerCase().trim() || "") === "today")
      case "overdue":
        return allPendingTasks.filter((task) => (task.columnO?.toLowerCase().trim() || "") === "overdue")
      case "upcoming":
        return allPendingTasks.filter((task) => (task.columnO?.toLowerCase().trim() || "") === "upcoming")
      case "all":
      default:
        return allPendingTasks
    }
  }, [allPendingTasks, dateFilter])

  // Apply search filter to both pending and completed tasks
  const pendingTasks = useMemo(() => filterTasksBySearch(dateFilteredPendingTasks), [dateFilteredPendingTasks, searchTerm])
  const searchFilteredCompletedTasks = useMemo(() => filterTasksBySearch(completedTasks), [completedTasks, searchTerm])

  // Memoized mobile pending row component
  const PendingMobileCard = useMemo(() => {
    return memo(function PendingMobileCard({
      row,
      isSelected,
      status,
      extendDate,
      remarks,
      handleCheckboxChange,
      handleStatusChange,
      handleExtendDateChange,
      handleRemarksChange,
      handleTransferSelection,
      transferSelections,
      doerList,
      normalizeDate,
      getTodayDate,
      formatDate,
      getStatusBadgeColor,
    }: any) {
      const [localRemarks, setLocalRemarks] = useState(remarks || "")
      useEffect(() => {
        setLocalRemarks(remarks || "")
      }, [remarks, row.taskId])
      // Debounce syncing remarks to parent to avoid laggy typing
      useEffect(() => {
        if (!isSelected) return
        const h = setTimeout(() => {
          handleRemarksChange(row.taskId, localRemarks)
        }, 300)
        return () => clearTimeout(h)
      }, [localRemarks, isSelected, row.taskId, handleRemarksChange])
      return (
        <Card key={row.id} className="border border-gray-200">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => handleCheckboxChange(row.taskId, checked as boolean)}
                />
                <div>
                  <div className="font-medium text-blue-600 text-sm">{row.taskId}</div>
                  <div className="text-xs text-gray-500">{row.week}</div>
                  <div className="font-medium text-sm">{row.doerName}</div>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`text-xs whitespace-nowrap ${normalizeDate(row.columnJ) < getTodayDate()
                    ? "bg-red-50 text-red-700 border-red-200"
                    : normalizeDate(row.columnJ) === getTodayDate()
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-gray-50 text-gray-700"
                  }`}
              >
                {formatDate(row.columnJ)}
              </Badge>
            </div>

            <div className="text-sm text-gray-700 break-words">{row.task}</div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={`text-xs ${getStatusBadgeColor(row.columnM)}`}>
                {row.columnM || "Pending"}
              </Badge>
            </div>

            <div className="space-y-2">
              <Select
                value={status}
                onValueChange={(value) => handleStatusChange(row.taskId, value)}
                disabled={!isSelected}
              >
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Select action..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Done">Done</SelectItem>
                  <SelectItem value="Hold">Hold</SelectItem>
                  <SelectItem value="Extend">Extend</SelectItem>
                  <SelectItem value="Cancel">Cancel</SelectItem>
                  <SelectItem value="Transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>

              {status === "Transfer" && (
                <Select
                  value={transferSelections[row.taskId] || ""}
                  onValueChange={(value) => handleTransferSelection(row.taskId, value)}
                  disabled={!isSelected}
                >
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue placeholder="Select doer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {doerList.map((doer: string) => (
                      <SelectItem key={doer} value={doer}>
                        {doer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {status === "Extend" && (
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={extendDate}
                    onChange={(e) => handleExtendDateChange(row.taskId, e.target.value)}
                    disabled={!isSelected}
                    className="h-8 text-xs"
                    placeholder="Select extend date"
                  />
                  <Input
                    type="text"
                    value={localRemarks}
                    onChange={(e) => setLocalRemarks(e.target.value)}
                    onBlur={() => handleRemarksChange(row.taskId, localRemarks)}
                    disabled={!isSelected}
                    className="h-8 text-xs"
                    placeholder="Extend Remarks"
                  />
                </div>
              )}
              {status !== "Extend" && isSelected && (
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={localRemarks}
                    onChange={(e) => setLocalRemarks(e.target.value)}
                    onBlur={() => handleRemarksChange(row.taskId, localRemarks)}
                    disabled={!isSelected}
                    className="h-8 text-xs"
                    placeholder="Remarks"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )
    })
  }, [])

  // Memoized desktop pending row component
  const PendingDesktopRow = useMemo(() => {
    return memo(function PendingDesktopRow({
      row,
      isSelected,
      status,
      extendDate,
      remarks,
      handleCheckboxChange,
      handleStatusChange,
      handleExtendDateChange,
      handleRemarksChange,
      handleTransferSelection,
      transferSelections,
      doerList,
      normalizeDate,
      getTodayDate,
      formatDate,
      getStatusBadgeColor,
    }: any) {
      const [localRemarks, setLocalRemarks] = useState(remarks || "")
      useEffect(() => {
        setLocalRemarks(remarks || "")
      }, [remarks, row.taskId])



      // Debounce syncing remarks to parent to avoid lag on desktop as well
      useEffect(() => {
        if (!isSelected) return
        const h = setTimeout(() => {
          handleRemarksChange(row.taskId, localRemarks)
        }, 300)
        return () => clearTimeout(h)
      }, [localRemarks, isSelected, row.taskId, handleRemarksChange])



      return (
        <tr key={row.id} className="border-b hover:bg-gray-50">
          <td className="p-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => handleCheckboxChange(row.taskId, checked as boolean)}
            />
          </td>
          <td className="p-3 font-medium text-blue-600 text-sm">{row.taskId}</td>
          <td className="p-3 text-sm">{row.week}</td>
          <td className="p-3 font-medium text-sm">{row.doerName}</td>
          <td className="p-3 text-sm max-w-[200px] break-words">{row.task}</td>
          <td className="p-3">
            <Badge
              variant="outline"
              className={`text-xs whitespace-nowrap ${normalizeDate(row.columnJ) < getTodayDate()
                  ? "bg-red-50 text-red-700 border-red-200"
                  : normalizeDate(row.columnJ) === getTodayDate()
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-gray-50 text-gray-700"
                }`}
            >
              {formatDate(row.columnJ)}
            </Badge>
          </td>
          <td className="p-3">
            <Badge variant="secondary" className={`text-xs ${getStatusBadgeColor(row.columnM)}`}>
              {row.columnM || "Pending"}
            </Badge>
          </td>
          <td className="p-3">
            <Select
              value={status}
              onValueChange={(value) => handleStatusChange(row.taskId, value)}
              disabled={!isSelected}
            >
              <SelectTrigger className="w-full min-w-[100px] h-8 text-xs">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Done">Done</SelectItem>
                <SelectItem value="Hold">Hold</SelectItem>
                <SelectItem value="Extend">Extend</SelectItem>
                <SelectItem value="Cancel">Cancel</SelectItem>
                <SelectItem value="Transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
          </td>
           <td className="p-3">
      <Input
        type="date"
        value={extendDate}
        onChange={(e) => handleExtendDateChange(row.taskId, e.target.value)}
        disabled={!isSelected || status !== "Extend"}
        className="h-8 text-xs min-w-[130px]"
      />
    </td>

    {/* Remarks Column */}
    <td className="p-3">
      <Input
        type="text"
        value={localRemarks}
        onChange={(e) => setLocalRemarks(e.target.value)}
        onBlur={() => handleRemarksChange(row.taskId, localRemarks)}
        disabled={!isSelected}
        className="h-8 text-xs min-w-[120px]"
        placeholder={status === "Extend" ? "Extend Remarks" : "Remarks"}
      />
    </td>
          <td className="p-3">
            <Select
              value={transferSelections[row.taskId] || ""}
              onValueChange={(value) => handleTransferSelection(row.taskId, value)}
              disabled={!isSelected || status !== "Transfer"}
            >
              <SelectTrigger className="w-full min-w-[120px] h-8 text-xs">
                <SelectValue placeholder="Select doer..." />
              </SelectTrigger>
              <SelectContent>
                {doerList.map((doer: string) => (
                  <SelectItem key={doer} value={doer}>
                    {doer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </td>
        </tr>
      )
    })
  }, [])

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
    <div className="w-full max-w-full">
      {/* Fixed actions so Refresh + Submit stay visible while scrolling */}
      <div className="fixed top-2 right-2 z-50 flex items-center gap-2 bg-white/95 shadow-md border border-gray-200 rounded-md px-2 py-1">
        <Button onClick={fetchData} variant="outline" size="sm" className="whitespace-nowrap bg-transparent">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || !hasEligibleSelection}
          size="sm"
          className={`whitespace-nowrap ${submitting || !hasEligibleSelection ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          title={submitting ? "Updating..." : !hasEligibleSelection ? "Select tasks and add remarks to enable" : "Submit updates"}
        >
          {submitting ? "Updating..." : "Submit Updates"}
        </Button>
      </div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between sticky top-0 z-50 bg-white border-b border-gray-100 py-2 px-2 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-bold">Tasks</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
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
            <Button onClick={fetchData} variant="outline" size="sm" className="whitespace-nowrap bg-transparent">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !hasEligibleSelection}
              className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
            >
              {submitting ? "Updating..." : "Submit Updates"}
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="pending" className="flex items-center gap-2 text-xs sm:text-sm">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Pending</span>
            <span className="sm:hidden">Pending</span>({pendingTasks.length})
            {dateFilter !== "all" && (
              <span className="hidden lg:inline text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {dateFilter === "today" ? "Today" : dateFilter === "overdue" ? "Overdue" : "Upcoming"}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2 text-xs sm:text-sm">
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
            <span className="sm:hidden">History</span>({searchFilteredCompletedTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">
                Pending Tasks
                {dateFilter !== "all" && (
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    (Filtered by: {dateFilter === "today" ? "Today" : dateFilter === "overdue" ? "Overdue" : "Upcoming"}
                    )
                  </span>
                )}
                {searchTerm && <span className="text-sm font-normal text-gray-600 ml-2">- Search: "{searchTerm}"</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {/* Mobile Card View */}
              <div className="block lg:hidden">
                {pendingTasks.length > 0 ? (
                  <div className="space-y-4 p-4">
                    {pendingTasks.map((row) => {
                      const u = taskUpdates[row.taskId]
                      return (
                        <PendingMobileCard
                          key={row.id}
                          row={row}
                          isSelected={u?.isSelected ?? false}
                          status={u?.status ?? ""}
                          extendDate={u?.extendDate ?? ""}
                          remarks={u?.remarks ?? ""}
                          handleCheckboxChange={handleCheckboxChange}
                          handleStatusChange={handleStatusChange}
                          handleExtendDateChange={handleExtendDateChange}
                          handleRemarksChange={handleRemarksChange}
                          handleTransferSelection={handleTransferSelection}
                          transferSelections={transferSelections}
                          doerList={doerList}
                          normalizeDate={normalizeDate}
                          getTodayDate={getTodayDate}
                          formatDate={formatDate}
                          getStatusBadgeColor={getStatusBadgeColor}
                        />
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 px-4">
                    {searchTerm
                      ? `No tasks found matching "${searchTerm}"`
                      : dateFilter === "all"
                        ? "No pending tasks found."
                        : `No ${dateFilter} pending tasks found.`}
                  </div>
                )}
              </div>

              {/* Desktop Table View */}
             {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full border-collapse min-w-[1200px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold w-12">Select</th>
                      <th className="text-left p-3 font-semibold w-20">Task ID</th>
                      <th className="text-left p-3 font-semibold w-16">Week</th>
                      <th className="text-left p-3 font-semibold w-24">Doer</th>
                      <th className="text-left p-3 font-semibold w-48">Task</th>
                      <th className="text-left p-3 font-semibold w-24">Due Date</th>
                      <th className="text-left p-3 font-semibold w-20">Status</th>
                      <th className="text-left p-3 font-semibold w-24">Action</th>
                      <th className="text-left p-3 font-semibold w-32">Extend Date</th>
                      <th className="text-left p-3 font-semibold w-32">Remarks</th>
                      <th className="text-left p-3 font-semibold w-28">Transfer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingTasks.length > 0 ? (
                      pendingTasks.map((row) => {
                        const u = taskUpdates[row.taskId]
                        return (
                          <PendingDesktopRow
                            key={row.id}
                            row={row}
                            isSelected={u?.isSelected ?? false}
                            status={u?.status ?? ""}
                            extendDate={u?.extendDate ?? ""}
                            remarks={u?.remarks ?? ""}
                            handleCheckboxChange={handleCheckboxChange}
                            handleStatusChange={handleStatusChange}
                            handleExtendDateChange={handleExtendDateChange}
                            handleRemarksChange={handleRemarksChange}
                            handleTransferSelection={handleTransferSelection}
                            transferSelections={transferSelections}
                            doerList={doerList}
                            normalizeDate={normalizeDate}
                            getTodayDate={getTodayDate}
                            formatDate={formatDate}
                            getStatusBadgeColor={getStatusBadgeColor}
                          />
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={11} className="text-center py-8 text-gray-500">
                          {searchTerm
                            ? `No tasks found matching "${searchTerm}"`
                            : dateFilter === "all"
                              ? "No pending tasks found."
                              : `No ${dateFilter} pending tasks found.`}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>4
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">
                Completed Tasks
                {searchTerm && <span className="text-sm font-normal text-gray-600 ml-2">- Search: "{searchTerm}"</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {/* Mobile Card View */}
              <div className="block lg:hidden">
                {searchFilteredCompletedTasks.length > 0 ? (
                  <div className="space-y-4 p-4">
                    {searchFilteredCompletedTasks.map((row) => (
                      <Card key={row.id} className="border border-gray-200">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-medium text-blue-600 text-sm">{row.taskId}</div>
                              <div className="text-xs text-gray-500">{row.week}</div>
                              <div className="font-medium text-sm">{row.doerName}</div>
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-xs whitespace-nowrap ${normalizeDate(row.columnJ) < getTodayDate()
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : normalizeDate(row.columnJ) === getTodayDate()
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-gray-50 text-gray-700"
                                }`}
                            >
                              {formatDate(row.columnJ)}
                            </Badge>
                          </div>

                          <div className="text-sm text-gray-700 break-words">{row.task}</div>

                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className={`text-xs ${getStatusBadgeColor(row.columnM)}`}>
                              {row.columnM || "Completed"}
                            </Badge>
                            <Badge variant="outline" className="bg-green-50 text-green-700 text-xs whitespace-nowrap">
                              {formatDate(row.columnL)}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 px-4">
                    {searchTerm ? `No completed tasks found matching "${searchTerm}"` : "No completed tasks found."}
                  </div>
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">Task ID</th>
                      <th className="text-left p-3 font-semibold">Week</th>
                      <th className="text-left p-3 font-semibold">Doer Name</th>
                      <th className="text-left p-3 font-semibold">Task</th>
                      <th className="text-left p-3 font-semibold">Date</th>
                      <th className="text-left p-3 font-semibold">Status</th>
                      <th className="text-left p-3 font-semibold">Completion Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchFilteredCompletedTasks.length > 0 ? (
                      searchFilteredCompletedTasks.map((row) => (
                        <tr key={row.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium text-blue-600 text-sm">{row.taskId}</td>
                          <td className="p-3 text-sm">{row.week}</td>
                          <td className="p-3 font-medium text-sm">{row.doerName}</td>
                          <td className="p-3 text-sm max-w-[200px] break-words">{row.task}</td>
                          <td className="p-3">
                            <Badge
                              variant="outline"
                              className={`text-xs whitespace-nowrap ${normalizeDate(row.columnJ) < getTodayDate()
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : normalizeDate(row.columnJ) === getTodayDate()
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-gray-50 text-gray-700"
                                }`}
                            >
                              {formatDate(row.columnJ)}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant="secondary" className={`text-xs ${getStatusBadgeColor(row.columnM)}`}>
                              {row.columnM || "Completed"}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="bg-green-50 text-green-700 text-xs whitespace-nowrap">
                              {formatDate(row.columnL)}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-gray-500">
                          {searchTerm
                            ? `No completed tasks found matching "${searchTerm}"`
                            : "No completed tasks found."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
