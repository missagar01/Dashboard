"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { ArrowUpDown, Filter, RefreshCw, ChevronDown, Calendar, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DataRow {
  id: number
  "Task ID": string
  "Name": string
  "Task": string
  "Latest Revision": string
  "Total Revisions": number
  "Status": string
  "Week": string
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

interface FilterOption {
  value: string
  label: string
  count: number
  checked: boolean
}

const chartConfig = {
  pending: {
    label: "Pending",
    color: "#ef4444",
  },
  completed: {
    label: "Completed",
    color: "#22c55e",
  },
  inProgress: {
    label: "In Progress",
    color: "#eab308",
  },
  cancelled: {
    label: "Cancelled",
    color: "#3b82f6",
  },
}

// Date Picker Component
const DateRangePicker = ({ 
  startDate, 
  endDate, 
  onDateChange, 
  isOpen, 
  onToggle 
}: {
  startDate: Date | null
  endDate: Date | null
  onDateChange: (start: Date | null, end: Date | null) => void
  isOpen: boolean
  onToggle: () => void
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [selectingStart, setSelectingStart] = useState(true)
  const [tempStart, setTempStart] = useState<Date | null>(startDate)
  const [tempEnd, setTempEnd] = useState<Date | null>(endDate)

  const months = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
  ]

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay()
  }

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(currentYear, currentMonth, day)
    
    if (selectingStart) {
      setTempStart(selectedDate)
      setTempEnd(null)
      setSelectingStart(false)
    } else {
      if (tempStart && selectedDate < tempStart) {
        setTempStart(selectedDate)
        setTempEnd(tempStart)
      } else {
        setTempEnd(selectedDate)
      }
    }
  }

  const handleApply = () => {
    onDateChange(tempStart, tempEnd)
    onToggle()
  }

  const handleCancel = () => {
    setTempStart(startDate)
    setTempEnd(endDate)
    onToggle()
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear)
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
    const days = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day)
      const isSelected = (tempStart && date.toDateString() === tempStart.toDateString()) ||
                        (tempEnd && date.toDateString() === tempEnd.toDateString())
      const isInRange = tempStart && tempEnd && date >= tempStart && date <= tempEnd
      const isToday = date.toDateString() === new Date().toDateString()

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className={`p-2 text-sm rounded-full hover:bg-blue-100 ${
            isSelected ? 'bg-blue-500 text-white' : 
            isInRange ? 'bg-blue-100 text-blue-700' :
            isToday ? 'bg-gray-200' : ''
          }`}
        >
          {day}
        </button>
      )
    }

    return days
  }

  if (!isOpen) return null

  return (
    <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 min-w-[600px]">
      <div className="flex justify-between items-center mb-4">
        <select
          value="Auto date range"
          className="px-3 py-2 border border-gray-300 rounded bg-gray-100"
        >
          <option>Auto date range</option>
        </select>
        <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="text-center mb-4">
            <h3 className="font-semibold">Start Date</h3>
            <div className="flex items-center justify-between mt-2">
              <button
                onClick={() => {
                  if (currentMonth === 0) {
                    setCurrentMonth(11)
                    setCurrentYear(currentYear - 1)
                  } else {
                    setCurrentMonth(currentMonth - 1)
                  }
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                &#8249;
              </button>
              <span className="font-medium">{months[currentMonth]} {currentYear}</span>
              <button
                onClick={() => {
                  if (currentMonth === 11) {
                    setCurrentMonth(0)
                    setCurrentYear(currentYear + 1)
                  } else {
                    setCurrentMonth(currentMonth + 1)
                  }
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                &#8250;
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
              <div key={day} className="p-2 text-sm font-medium text-gray-500">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {renderCalendar()}
          </div>
        </div>

        <div>
          <div className="text-center mb-4">
            <h3 className="font-semibold">End Date</h3>
            <div className="flex items-center justify-between mt-2">
              <button
                onClick={() => {
                  if (currentMonth === 0) {
                    setCurrentMonth(11)
                    setCurrentYear(currentYear - 1)
                  } else {
                    setCurrentMonth(currentMonth - 1)
                  }
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                &#8249;
              </button>
              <span className="font-medium">{months[currentMonth]} {currentYear}</span>
              <button
                onClick={() => {
                  if (currentMonth === 11) {
                    setCurrentMonth(0)
                    setCurrentYear(currentYear + 1)
                  } else {
                    setCurrentMonth(currentMonth + 1)
                  }
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                &#8250;
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
              <div key={day} className="p-2 text-sm font-medium text-gray-500">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {renderCalendar()}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
        <Button onClick={handleCancel} variant="outline">Cancel</Button>
        <Button onClick={handleApply}>Apply</Button>
      </div>
    </div>
  )
}

// Searchable Checkbox Filter Component
const SearchableCheckboxFilter = ({ 
  options, 
  selectedValues, 
  onSelectionChange, 
  placeholder, 
  isOpen, 
  onToggle 
}: {
  options: FilterOption[]
  selectedValues: string[]
  onSelectionChange: (values: string[]) => void
  placeholder: string
  isOpen: boolean
  onToggle: () => void
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredOptions, setFilteredOptions] = useState(options)

  useEffect(() => {
    const filtered = options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredOptions(filtered)
  }, [searchTerm, options])

  const handleCheckboxChange = (value: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedValues, value])
    } else {
      onSelectionChange(selectedValues.filter(v => v !== value))
    }
  }

  const handleSelectAll = () => {
    if (selectedValues.length === filteredOptions.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(filteredOptions.map(option => option.value))
    }
  }

  if (!isOpen) return null

  return (
    <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 min-w-[300px] max-h-[400px] overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Type to search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 p-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center justify-between mb-3 pb-2 border-b">
        <label className="flex items-center gap-2 font-medium">
          <input
            type="checkbox"
            checked={selectedValues.length === filteredOptions.length && filteredOptions.length > 0}
            onChange={handleSelectAll}
            className="rounded"
          />
          All
        </label>
        <span className="text-sm text-gray-500">All</span>
      </div>

      <div className="max-h-[250px] overflow-y-auto">
        {filteredOptions.map((option) => (
          <label key={option.value} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedValues.includes(option.value)}
                onChange={(e) => handleCheckboxChange(option.value, e.target.checked)}
                className="rounded text-blue-600"
              />
              <span className="text-sm">{option.label}</span>
            </div>
            <span className="text-sm text-gray-500">{option.count}</span>
          </label>
        ))}
      </div>

      {selectedValues.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <div className="text-xs text-gray-500 mb-2">Selected: {selectedValues.length}</div>
          <div className="flex flex-wrap gap-1">
            {selectedValues.slice(0, 3).map(value => (
              <Badge key={value} variant="secondary" className="text-xs">
                {options.find(o => o.value === value)?.label || value}
              </Badge>
            ))}
            {selectedValues.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{selectedValues.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  // State for filters
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [selectedNames, setSelectedNames] = useState<string[]>([])
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>([])
  
  // State for dropdown visibility
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showNameFilter, setShowNameFilter] = useState(false)
  const [showTaskFilter, setShowTaskFilter] = useState(false)
  const [showStatusFilter, setShowStatusFilter] = useState(false)
  const [showWeekFilter, setShowWeekFilter] = useState(false)
  
  // State for data
  const [data, setData] = useState<DataRow[]>([])
  const [filteredData, setFilteredData] = useState<DataRow[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    completed: 0,
    pending: 0,
    inProgress: 0,
    cancelled: 0
  })
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState<boolean>(false)

  // Google Apps Script URL - UPDATE THIS WITH YOUR ACTUAL URL
  const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxzDRBmKcppuKrJ-kxC9VBPU0bwcNwe9kZOPUsPkwQ5i-wx5AfCJiH3hCKzZU65dV7LxQ/exec?file=code1'
  
  // Helper function to format date
  const formatDateToDisplay = (dateString: string): string => {
    if (!dateString) return ""
    
    try {
      if (dateString.includes('/') && dateString.split('/').length === 3) {
        return dateString
      }
      
      if (dateString.includes('T') || dateString.includes('-')) {
        const date = new Date(dateString)
        if (!isNaN(date.getTime())) {
          const day = date.getDate().toString().padStart(2, '0')
          const month = (date.getMonth() + 1).toString().padStart(2, '0')
          const year = date.getFullYear()
          return `${day}/${month}/${year}`
        }
      }
      
      return dateString
    } catch (error) {
      console.error('Error formatting date:', error)
      return dateString
    }
  }

  // Helper function to parse date
  const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null
    
    try {
      if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/')
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      }
      
      if (dateString.includes('T') || dateString.includes('-')) {
        return new Date(dateString)
      }
      
      return null
    } catch (error) {
      console.error('Error parsing date:', error)
      return null
    }
  }

  // Calculate stats from data
  const calculateStatsFromData = (dataArray: DataRow[]): void => {
    const total = dataArray.length
    const completed = dataArray.filter(row => 
      row.Status && row.Status.toLowerCase().includes('completed')
    ).length
    const pending = dataArray.filter(row => 
      !row.Status || row.Status === '' || row.Status.toLowerCase().includes('pending')
    ).length
    const inProgress = dataArray.filter(row => 
      row.Status && (row.Status.toLowerCase().includes('progress') || row.Status.toLowerCase().includes('ongoing'))
    ).length
    const cancelled = dataArray.filter(row => 
      row.Status && row.Status.toLowerCase().includes('cancelled')
    ).length

    setStats({
      total,
      completed,
      pending,
      inProgress,
      cancelled
    })
  }

  // Fetch data function
  const fetchData = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('Fetching data from Google Sheets...')
      
      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('API Response:', result)
      
      if (result.success && result.data) {
        const formattedData = result.data.map((row: any, index: number) => ({
          id: row.id || index + 1,
          "Task ID": row["Task ID"] || '',
          "Name": row["Name"] || '',
          "Task": row["Task"] || '',
          "Latest Revision": row["Latest Revision"] || '',
          "Total Revisions": parseInt(row["Total Revisions"]) || 0,
          "Status": row["Status"] || 'Pending',
          "Week": row["Week"] || ''
        }))
        
        console.log('✅ Data loaded successfully:', formattedData.length, 'records')
        setData(formattedData)
        setFilteredData(formattedData)
        
        // Use stats from API if available, otherwise calculate
        if (result.stats) {
          setStats(result.stats)
        } else {
          calculateStatsFromData(formattedData)
        }
        
        setError(null)
        setShowSuccess(true)
      } else {
        throw new Error(result.error || result.message || 'Failed to fetch data from Google Sheets')
      }
    } catch (err) {
      console.error('❌ Fetch failed:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(`Failed to load data from Google Sheets: ${errorMessage}`)
      setData([])
      setFilteredData([])
      setStats({
        total: 0,
        completed: 0,
        pending: 0,
        inProgress: 0,
        cancelled: 0
      })
    } finally {
      setLoading(false)
    }
  }

  // Auto-hide success message
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showSuccess])

  // Initialize data
  useEffect(() => {
    fetchData()
  }, [])

  // Filter data when filters change
  useEffect(() => {
    if (!data || data.length === 0) {
      setFilteredData([])
      return
    }

    let filtered = [...data]

    // Apply date range filter (using Latest Revision date)
    if (startDate || endDate) {
      filtered = filtered.filter(item => {
        const itemDate = parseDate(item["Latest Revision"])
        if (!itemDate) return false
        
        if (startDate && itemDate < startDate) return false
        if (endDate && itemDate > endDate) return false
        
        return true
      })
    }

    // Apply name filter
    if (selectedNames.length > 0) {
      filtered = filtered.filter(item => 
        selectedNames.some(name => 
          item.Name && item.Name.toLowerCase().includes(name.toLowerCase())
        )
      )
    }

    // Apply task filter
    if (selectedTasks.length > 0) {
      filtered = filtered.filter(item => 
        selectedTasks.some(task => 
          item.Task && item.Task.toLowerCase().includes(task.toLowerCase())
        )
      )
    }

    // Apply status filter
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(item => {
        return selectedStatuses.some(status => {
          if (status.toLowerCase() === 'pending') {
            return !item.Status || item.Status === '' || item.Status.toLowerCase().includes('pending')
          }
          return item.Status && item.Status.toLowerCase().includes(status.toLowerCase())
        })
      })
    }

    // Apply week filter
    if (selectedWeeks.length > 0) {
      filtered = filtered.filter(item => 
        selectedWeeks.some(week => 
          item.Week && item.Week.toLowerCase().includes(week.toLowerCase())
        )
      )
    }

    setFilteredData(filtered)
    calculateStatsFromData(filtered)
  }, [data, startDate, endDate, selectedNames, selectedTasks, selectedStatuses, selectedWeeks])

  // Get filter options with counts
  const getFilterOptions = (field: keyof DataRow): FilterOption[] => {
    const uniqueValues = [...new Set(data.map(item => item[field]).filter(Boolean))] as string[]
    return uniqueValues.map(value => ({
      value,
      label: value,
      count: data.filter(item => item[field] === value).length,
      checked: false
    }))
  }

  // Get status options
  const getStatusOptions = (): FilterOption[] => {
    const statusCounts = {
      'Pending': data.filter(item => !item.Status || item.Status === '' || item.Status.toLowerCase().includes('pending')).length,
      'Completed': data.filter(item => item.Status && item.Status.toLowerCase().includes('completed')).length,
      'In Progress': data.filter(item => item.Status && (item.Status.toLowerCase().includes('progress') || item.Status.toLowerCase().includes('ongoing'))).length,
      'Cancelled': data.filter(item => item.Status && item.Status.toLowerCase().includes('cancelled')).length,
    }

    return Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        value: status,
        label: status,
        count,
        checked: false
      }))
  }

  // Clear all filters
  const clearFilters = (): void => {
    setStartDate(null)
    setEndDate(null)
    setSelectedNames([])
    setSelectedTasks([])
    setSelectedStatuses([])
    setSelectedWeeks([])
  }

  // Get display text for filters
  const getDateRangeText = () => {
    if (!startDate && !endDate) return "Select date range"
    if (startDate && endDate) {
      return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
    }
    if (startDate) return `From ${startDate.toLocaleDateString()}`
    if (endDate) return `Until ${endDate.toLocaleDateString()}`
    return "Select date range"
  }

  const getFilterText = (selectedItems: string[], allItems: FilterOption[], defaultText: string) => {
    if (selectedItems.length === 0) return defaultText
    if (selectedItems.length === 1) return selectedItems[0]
    return `${selectedItems.length} selected`
  }

  // Chart data
  const pieChartData: ChartData[] = [
    { name: "Pending", value: stats.pending, color: "#ef4444" },
    { name: "Completed", value: stats.completed, color: "#22c55e" },
    { name: "In Progress", value: stats.inProgress, color: "#eab308" },
    { name: "Cancelled", value: stats.cancelled, color: "#3b82f6" },
  ].filter(item => item.value > 0)

  const barChartData: ChartData[] = [
    { name: "Pending", value: stats.pending },
    { name: "Completed", value: stats.completed },
    { name: "In Progress", value: stats.inProgress },
    { name: "Cancelled", value: stats.cancelled },
  ].filter(item => item.value > 0)

  const statsData: StatsData[] = [
    { title: "Total Tasks", value: stats.total, color: "bg-cyan-400" },
    { title: "Completed", value: stats.completed, color: "bg-green-400" },
    { title: "Pending", value: stats.pending, color: "bg-red-400" },
    { title: "In Progress", value: stats.inProgress, color: "bg-yellow-400" },
    { title: "Cancelled", value: stats.cancelled, color: "bg-blue-400" },
  ]

  const getStatusBadgeColor = (status: string): string => {
    if (!status || status === '') return "bg-orange-100 text-orange-800"
    const statusLower = status.toLowerCase()
    if (statusLower.includes('completed')) return "bg-green-100 text-green-800"
    if (statusLower.includes('pending')) return "bg-orange-100 text-orange-800"
    if (statusLower.includes('progress') || statusLower.includes('ongoing')) return "bg-yellow-100 text-yellow-800"
    if (statusLower.includes('cancelled')) return "bg-red-100 text-red-800"
    return "bg-gray-100 text-gray-800"
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Fixed Header */}
      <header className="bg-white shadow-sm border-b px-6 py-4 flex-shrink-0 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Task Management Dashboard</h1>
          <Button onClick={fetchData} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-auto pb-20">
        <div className="p-6 space-y-6">
          {/* Success message */}
          {showSuccess && !error && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 transition-opacity duration-500">
              <p><strong>Success:</strong> Successfully loaded {data.length} records from Google Sheets</p>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <p><strong>Error:</strong> {error}</p>
                  <p className="text-sm mt-1">Please check your Google Apps Script deployment and try again.</p>
                </div>
                <Button onClick={fetchData} variant="outline" size="sm">
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && data.length === 0 && (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-gray-600">Loading data from Google Sheets...</p>
            </div>
          )}

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

          {/* Enhanced Filter Section */}
          {data.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filters
                  </CardTitle>
                  <Button onClick={clearFilters} variant="outline" size="sm">
                    Clear All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Date Range Picker */}
                  <div className="space-y-2 relative">
                    <label className="text-sm font-medium">Select Date Range</label>
                    <button
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {getDateRangeText()}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <DateRangePicker
                      startDate={startDate}
                      endDate={endDate}
                      onDateChange={(start, end) => {
                        setStartDate(start)
                        setEndDate(end)
                      }}
                      isOpen={showDatePicker}
                      onToggle={() => setShowDatePicker(!showDatePicker)}
                    />
                  </div>

                  {/* Name Filter */}
                  <div className="space-y-2 relative">
                    <label className="text-sm font-medium">Name</label>
                    <button
                      onClick={() => setShowNameFilter(!showNameFilter)}
                      className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
                    >
                      <span>{getFilterText(selectedNames, getFilterOptions('Name'), "All Names")}</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <SearchableCheckboxFilter
                      options={getFilterOptions('Name')}
                      selectedValues={selectedNames}
                      onSelectionChange={setSelectedNames}
                      placeholder="Search names..."
                      isOpen={showNameFilter}
                      onToggle={() => setShowNameFilter(!showNameFilter)}
                    />
                  </div>

                  {/* Task Filter */}
                  <div className="space-y-2 relative">
                    <label className="text-sm font-medium">Task</label>
                    <button
                      onClick={() => setShowTaskFilter(!showTaskFilter)}
                      className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
                    >
                      <span>{getFilterText(selectedTasks, getFilterOptions('Task'), "All Tasks")}</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <SearchableCheckboxFilter
                      options={getFilterOptions('Task')}
                      selectedValues={selectedTasks}
                      onSelectionChange={setSelectedTasks}
                      placeholder="Search tasks..."
                      isOpen={showTaskFilter}
                      onToggle={() => setShowTaskFilter(!showTaskFilter)}
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-2 relative">
                    <label className="text-sm font-medium">Status</label>
                    <button
                      onClick={() => setShowStatusFilter(!showStatusFilter)}
                      className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
                    >
                      <span>{getFilterText(selectedStatuses, getStatusOptions(), "All Status")}</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <SearchableCheckboxFilter
                      options={getStatusOptions()}
                      selectedValues={selectedStatuses}
                      onSelectionChange={setSelectedStatuses}
                      placeholder="Search status..."
                      isOpen={showStatusFilter}
                      onToggle={() => setShowStatusFilter(!showStatusFilter)}
                    />
                  </div>

                  {/* Week Filter */}
                  <div className="space-y-2 relative">
                    <label className="text-sm font-medium">Week</label>
                    <button
                      onClick={() => setShowWeekFilter(!showWeekFilter)}
                      className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
                    >
                      <span>{getFilterText(selectedWeeks, getFilterOptions('Week'), "All Weeks")}</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <SearchableCheckboxFilter
                      options={getFilterOptions('Week')}
                      selectedValues={selectedWeeks}
                      onSelectionChange={setSelectedWeeks}
                      placeholder="Search weeks..."
                      isOpen={showWeekFilter}
                      onToggle={() => setShowWeekFilter(!showWeekFilter)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Charts Section */}
          {data.length > 0 && (
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
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: entry.color }}
                        ></div>
                        <span className="text-sm">{entry.name} ({entry.value})</span>
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
          )}

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Task Management Table 
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({filteredData.length} of {data.length} records)
                  {loading && <RefreshCw className="inline h-4 w-4 ml-2 animate-spin" />}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">Task ID</th>
                      <th className="text-left p-3 font-semibold">
                        <button className="flex items-center gap-2 hover:text-blue-600">
                          Name
                          <ArrowUpDown className="h-4 w-4" />
                        </button>
                      </th>
                      <th className="text-left p-3 font-semibold">
                        <button className="flex items-center gap-2 hover:text-blue-600">
                          Task
                          <ArrowUpDown className="h-4 w-4" />
                        </button>
                      </th>
                      <th className="text-left p-3 font-semibold">Latest Revision</th>
                      <th className="text-left p-3 font-semibold">
                        <button className="flex items-center gap-2 hover:text-blue-600">
                          Total Revisions
                          <ArrowUpDown className="h-4 w-4" />
                        </button>
                      </th>
                      <th className="text-left p-3 font-semibold">Status</th>
                      <th className="text-left p-3 font-semibold">Week</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.length > 0 ? (
                      filteredData.map((row) => (
                        <tr key={row.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium text-blue-600">{row["Task ID"]}</td>
                          <td className="p-3 font-medium">{row.Name}</td>
                          <td className="p-3 max-w-md">
                            <div className="flex items-center gap-2">
                              {row.Task}
                            </div>
                          </td>
                          <td className="p-3 text-sm font-medium">{row["Latest Revision"]}</td>
                          <td className="p-3 text-center">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {row["Total Revisions"]}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge 
                              variant="secondary" 
                              className={getStatusBadgeColor(row.Status)}
                            >
                              {row.Status || 'Pending'}
                            </Badge>
                          </td>
                          <td className="p-3">
         <Badge variant="outline" className="text-black"> {row.Week}</Badge>                         
                  </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-gray-500">
                          {loading 
                            ? "Loading data..." 
                            : data.length === 0 
                              ? "No data available. Please check your Google Sheets connection." 
                              : "No data found matching the current filters."
                          }
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Fixed Footer */}
      <footer className="bg-white border-t px-6 py-4 flex-shrink-0 sticky bottom-0 z-10">
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
      </footer>

      {/* Click outside handler for dropdowns */}
      {(showDatePicker || showNameFilter || showTaskFilter || showStatusFilter || showWeekFilter) && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => {
            setShowDatePicker(false)
            setShowNameFilter(false)
            setShowTaskFilter(false)
            setShowStatusFilter(false)
            setShowWeekFilter(false)
          }}
        />
      )}
    </div>
  )
}