"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, User, Phone, Mail, Calendar, FileText, Trash2 } from "lucide-react"

interface TaskForm {
  doerName: string
  number: string
  email: string
  plannedDate: string
  description: string
}

export default function AddTask() {
  const [tasks, setTasks] = useState<TaskForm[]>([{
    doerName: "",
    number: "",
    email: "",
    plannedDate: "",
    description: "",
  }])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const generateTaskIds = async (count: number) => {
    try {
      // Fetch current data to determine next task ID
      const response = await fetch("https://script.google.com/macros/s/AKfycbw7DWi7erjdmCnV2BQNCf-XG4W4k8XTUgx8QnVZukiGOU6CEeegkqrLb95m91BL2Nvh/exec?sheet=Master&action=fetch")
      const result = await response.json()
      
      let maxId = 0
      if (result.success && result.data && result.data.length > 0) {
        // Find the highest task ID number by checking all rows
        result.data.forEach((row) => {
          // Check if row exists and has data in column A (index 0)
          if (row && row.length > 0 && row[0]) {
            const taskId = row[0].toString().trim()
            // Check if it matches TN-XXX format
            if (taskId.startsWith('TN-')) {
              const idNumber = parseInt(taskId.replace('TN-', ''))
              if (!isNaN(idNumber) && idNumber > maxId) {
                maxId = idNumber
              }
            }
          }
        })
      }
      
      // Generate sequential task IDs
      const taskIds = []
      for (let i = 0; i < count; i++) {
        const nextId = maxId + 1 + i
        taskIds.push(`TN-${nextId.toString().padStart(3, '0')}`)
      }
      
      return taskIds
    } catch (error) {
      console.error("Error generating task IDs:", error)
      // Fallback IDs
      return Array.from({ length: count }, (_, i) => `TN-${(i + 1).toString().padStart(3, '0')}`)
    }
  }

  // Function to convert date from YYYY-MM-DD to DD/MM/YYYY
  const formatDateForSubmission = (dateString: string) => {
    if (!dateString) return ""
    const [year, month, day] = dateString.split('-')
    return `${day}/${month}/${year}`
  }

  const addNewTask = () => {
    setTasks([...tasks, {
      doerName: "",
      number: "",
      email: "",
      plannedDate: "",
      description: "",
    }])
  }

  const removeTask = (index: number) => {
    if (tasks.length > 1) {
      const newTasks = tasks.filter((_, i) => i !== index)
      setTasks(newTasks)
    }
  }

  const updateTask = (index: number, field: keyof TaskForm, value: string) => {
    const newTasks = [...tasks]
    newTasks[index][field] = value
    setTasks(newTasks)
  }

  const handleTasksSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all tasks
    const validTasks = tasks.filter(task => 
      task.doerName.trim() && task.description.trim() && task.plannedDate.trim()
    )
    
    if (validTasks.length === 0) {
      alert("Please fill in all required fields for at least one task")
      return
    }

    if (validTasks.length !== tasks.length) {
      const proceed = confirm(`${tasks.length - validTasks.length} task(s) have missing required fields and will be skipped. Continue with ${validTasks.length} valid task(s)?`)
      if (!proceed) return
    }
    
    setIsSubmitting(true)
    
    try {
      // Generate task IDs for all valid tasks
      const taskIds = await generateTaskIds(validTasks.length)
      
      // Prepare all tasks for submission
      const allRowsData = validTasks.map((task, index) => {
        const formattedDate = formatDateForSubmission(task.plannedDate)
        
        // Column A: Task ID, Column B: Doer Name, Column C: Task Description, Column D: Date, Column M: Status
        const rowData = new Array(13).fill('') // Create array with 13 elements (A to M)
        rowData[0] = taskIds[index] // Column A
        rowData[1] = task.doerName // Column B
        rowData[2] = task.description // Column C
        rowData[3] = formattedDate // Column D - now in DD/MM/YYYY format
        rowData[12] = "Pending" // Column M
        
        return rowData
      })
      
      // Submit all tasks at once
      const formData = new FormData()
      formData.append('sheetName', 'Master')
      formData.append('action', 'insertMultiple')
      formData.append('rowsData', JSON.stringify(allRowsData))
      
      const response = await fetch("https://script.google.com/macros/s/AKfycbw7DWi7erjdmCnV2BQNCf-XG4W4k8XTUgx8QnVZukiGOU6CEeegkqrLb95m91BL2Nvh/exec", {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Reset form after successful submission
        setTasks([{
          doerName: "",
          number: "",
          email: "",
          plannedDate: "",
          description: "",
        }])
        alert(`${validTasks.length} task(s) added successfully with IDs: ${taskIds.join(', ')}`)
      } else {
        throw new Error(result.error || 'Failed to submit tasks')
      }
    } catch (error) {
      console.error("Error submitting tasks:", error)
      alert("Error submitting tasks. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add New Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTasksSubmit} className="space-y-6">
            {tasks.map((task, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4 relative">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Task {index + 1}</h3>
                  {tasks.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeTask(index)}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`doerName-${index}`}>Doer Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id={`doerName-${index}`}
                        type="text"
                        placeholder="Enter doer name"
                        className="pl-10"
                        value={task.doerName}
                        onChange={(e) => updateTask(index, 'doerName', e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor={`number-${index}`}>Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id={`number-${index}`}
                        type="tel"
                        placeholder="Enter phone number"
                        className="pl-10"
                        value={task.number}
                        onChange={(e) => updateTask(index, 'number', e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`email-${index}`}>Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id={`email-${index}`}
                        type="email"
                        placeholder="Enter email address"
                        className="pl-10"
                        value={task.email}
                        onChange={(e) => updateTask(index, 'email', e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor={`plannedDate-${index}`}>Planned Date *</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id={`plannedDate-${index}`}
                        type="date"
                        className="pl-10"
                        value={task.plannedDate}
                        onChange={(e) => updateTask(index, 'plannedDate', e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor={`description-${index}`}>Description *</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Textarea
                      id={`description-${index}`}
                      placeholder="Enter task description"
                      className="pl-10 min-h-[120px]"
                      value={task.description}
                      onChange={(e) => updateTask(index, 'description', e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={addNewTask}
                disabled={isSubmitting}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Task
              </Button>
              
              <Button 
                type="submit"
                className="flex-1" 
                disabled={isSubmitting}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isSubmitting ? `Submitting ${tasks.length} Task(s)...` : `Submit All Tasks (${tasks.length})`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}