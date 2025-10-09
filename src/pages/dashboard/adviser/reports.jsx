"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  FileText,
  Download,
  Calendar,
  Users,
  TrendingUp,
  Activity,
  Filter,
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Eye,
  ChevronDown,
} from "lucide-react"
import { supabase } from "../../../supabase/client"

const AdviserReports = () => {
  const [selectedReportType, setSelectedReportType] = useState("progress")
  const [selectedGroups, setSelectedGroups] = useState([])
  const [dateRange, setDateRange] = useState("month")
  const [assignedGroups, setAssignedGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [recentReports, setRecentReports] = useState([])
  const [generating, setGenerating] = useState(false)
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' })
  const [includeChapterDetails, setIncludeChapterDetails] = useState(true)
  const [includeFeedback, setIncludeFeedback] = useState(true)
  const [includeStatistics, setIncludeStatistics] = useState(true)
  const [reportFormat, setReportFormat] = useState("txt")
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [scheduledReport, setScheduledReport] = useState({
    enabled: false,
    frequency: 'weekly',
    email: '',
    nextRun: ''
  })

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
          return
        }
        
        if (session?.user) {
          const localUser = JSON.parse(localStorage.getItem("user") || "{}")
          if (localUser.uid) {
            setCurrentUser(localUser)
          } else {
            setCurrentUser({
              uid: session.user.id,
              email: session.user.email,
              role: 'adviser'
            })
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      }
    }

    getCurrentUser()
  }, [])

  // Fetch assigned groups data
  useEffect(() => {
    if (currentUser) {
      fetchAssignedGroups()
    }
  }, [currentUser])

  const fetchAssignedGroups = async () => {
    try {
      setLoading(true)
      
      if (!currentUser) {
        setAssignedGroups([])
        return
      }

      // Get groups assigned to this adviser
      const { data: assignedGroupsData, error: groupError } = await supabase
        .from('adviser_group_assignments')
        .select(`
          group_id,
          assigned_at,
          student_groups!inner (
            id,
            group_name,
            description,
            research_focus,
            max_members,
            is_active,
            created_at,
            updated_at,
            created_by
          )
        `)
        .eq('adviser_id', currentUser.uid)
        .eq('student_groups.is_active', true)

      if (groupError) {
        console.error('Error fetching assigned groups:', groupError)
        setAssignedGroups([])
        return
      }

      if (!assignedGroupsData || assignedGroupsData.length === 0) {
        setAssignedGroups([])
        return
      }

      // Get research projects for progress calculation
      const groupIds = assignedGroupsData.map(assignment => assignment.group_id)
      const { data: projectsData, error: projectsError } = await supabase
        .from('research_projects')
        .select('*')
        .in('group_id', groupIds)

      if (projectsError) {
        console.warn('Could not fetch research projects:', projectsError)
      }

      // Get user details for group creator only
      const allUserIds = new Set()
      assignedGroupsData.forEach(assignment => {
        if (assignment.student_groups.created_by) {
          allUserIds.add(assignment.student_groups.created_by)
        }
      })

      let usersData = []
      if (allUserIds.size > 0) {
        const { data: userData, error: usersError } = await supabase
          .from('users')
          .select('id, firstName, lastName, email')
          .in('id', Array.from(allUserIds))

        if (!usersError) {
          usersData = userData || []
        }
      }

      // Process groups with progress calculation
      const processedGroups = assignedGroupsData.map(assignment => {
        const group = assignment.student_groups
        // Get projects for this group
        const groupProjects = (projectsData || []).filter(p => p.group_id === group.id)
        // Calculate progress
        let progress = 0
        if (groupProjects.length > 0) {
          const totalProgress = groupProjects.reduce((sum, project) => {
            let projectProgress = 0
            // Calculate based on chapter completion
            if (project.chapter_1_completed) projectProgress += 20
            if (project.chapter_2_completed) projectProgress += 20
            if (project.chapter_3_completed) projectProgress += 20
            if (project.chapter_4_completed) projectProgress += 20
            if (project.chapter_5_completed) projectProgress += 20
            return sum + (project.progress || projectProgress)
          }, 0)
          progress = Math.round(totalProgress / groupProjects.length)
        }
        // Find group leader (use creator only)
        const creator = usersData.find(user => user.id === group.created_by)
        const leader = creator
        // Determine status
        let status = "On Track"
        if (progress >= 85) status = "Ahead"
        else if (progress < 60) status = "Behind"
        else if (progress < 75) status = "Slightly Behind"
        return {
          id: group.id,
          name: group.group_name || `Group ${group.id}`,
          project: group.description || group.research_focus || "Research Project",
          leader: leader ? `${leader.firstName || ''} ${leader.lastName || ''}`.trim() || leader.email : 'Not assigned',
          members: 1,
          progress: progress,
          status: status,
          lastUpdate: new Date(group.updated_at || group.created_at).toLocaleDateString(),
          groupData: group,
          projects: groupProjects
        }
      })

      setAssignedGroups(processedGroups)
    } catch (error) {
      console.error('Error in fetchAssignedGroups:', error)
      setAssignedGroups([])
    } finally {
      setLoading(false)
    }
  }

  const reportTypes = [
    {
      id: "progress",
      name: "Group Progress Summary",
      description: "Comprehensive overview of each group's project progress with chapter completion status",
      icon: BarChart3,
      color: "bg-blue-50 text-blue-600",
      features: ["Chapter progress", "Timeline tracking", "Member activity", "Status indicators"]
    },
    {
      id: "activity",
      name: "Student Leader Activity Log",
      description: "Detailed activity logs from student leaders with recent submissions and updates",
      icon: Activity,
      color: "bg-green-50 text-green-600",
      features: ["Recent submissions", "Login activity", "Project updates", "Communication logs"]
    },
    {
      id: "comparison",
      name: "Group Performance Comparison",
      description: "Comparative analysis of all assigned groups with rankings and benchmarks",
      icon: TrendingUp,
      color: "bg-purple-50 text-purple-600",
      features: ["Performance ranking", "Progress comparison", "Statistical analysis", "Benchmark data"]
    },
    {
      id: "detailed",
      name: "Comprehensive Assessment",
      description: "In-depth analysis combining all aspects with recommendations and insights",
      icon: FileText,
      color: "bg-orange-50 text-orange-600",
      features: ["Complete overview", "AI insights", "Recommendations", "Action items"]
    },
    {
      id: "custom",
      name: "Custom Report",
      description: "Build your own report with specific metrics and data points",
      icon: Filter,
      color: "bg-indigo-50 text-indigo-600",
      features: ["Custom metrics", "Flexible layout", "Data selection", "Export options"]
    }
  ]

  const handleGroupSelection = (groupId) => {
    setSelectedGroups((prev) => (prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]))
  }

  const handleSelectAll = () => {
    setSelectedGroups(selectedGroups.length === assignedGroups.length ? [] : assignedGroups.map((group) => group.id))
  }

  const generateReport = async () => {
    if (selectedGroups.length === 0) {
      alert('Please select at least one group to generate a report.')
      return
    }

    setGenerating(true)
    
    try {
      const selectedGroupData = assignedGroups.filter(group => selectedGroups.includes(group.id))
      const reportType = reportTypes.find(type => type.id === selectedReportType)
      
      let reportContent = ""
      const currentDate = new Date().toLocaleDateString()
      
      // Generate report header
      reportContent += `${reportType.name}\n`
      reportContent += `Generated by: ${currentUser.email}\n`
      reportContent += `Date: ${currentDate}\n`
      reportContent += `Date Range: ${dateRange === "all" ? "All Time" : `This ${dateRange}`}\n`
      reportContent += `Groups Included: ${selectedGroupData.length}\n`
      reportContent += "="+ "=".repeat(50) + "\n\n"

      if (selectedReportType === "progress") {
        // Progress Summary Report
        reportContent += "GROUP PROGRESS SUMMARY\n\n"
        
        selectedGroupData.forEach((group, index) => {
          reportContent += `${index + 1}. ${group.name}\n`
          reportContent += `   Project: ${group.project}\n`
          reportContent += `   Leader: ${group.leader}\n`
          reportContent += `   Members: ${group.members}\n`
          reportContent += `   Progress: ${group.progress}%\n`
          reportContent += `   Status: ${group.status}\n`
          reportContent += `   Last Update: ${group.lastUpdate}\n`
          
          if (group.projects && group.projects.length > 0) {
            reportContent += `   \n   Chapter Progress:\n`
            group.projects.forEach(project => {
              reportContent += `     - ${project.title || 'Research Project'}\n`
              reportContent += `       Chapter 1: ${project.chapter_1_completed ? '✓ Complete' : (project.chapter_1_status === 'in_progress' ? '⏳ In Progress' : '❌ Not Started')}\n`
              reportContent += `       Chapter 2: ${project.chapter_2_completed ? '✓ Complete' : (project.chapter_2_status === 'in_progress' ? '⏳ In Progress' : '❌ Not Started')}\n`
              reportContent += `       Chapter 3: ${project.chapter_3_completed ? '✓ Complete' : (project.chapter_3_status === 'in_progress' ? '⏳ In Progress' : '❌ Not Started')}\n`
              reportContent += `       Chapter 4: ${project.chapter_4_completed ? '✓ Complete' : (project.chapter_4_status === 'in_progress' ? '⏳ In Progress' : '❌ Not Started')}\n`
              reportContent += `       Chapter 5: ${project.chapter_5_completed ? '✓ Complete' : (project.chapter_5_status === 'in_progress' ? '⏳ In Progress' : '❌ Not Started')}\n`
            })
          }
          
          reportContent += "\n" + "-".repeat(40) + "\n\n"
        })
        
      } else if (selectedReportType === "activity") {
        // Activity Log Report
        reportContent += "STUDENT LEADER ACTIVITY LOG\n\n"
        
        selectedGroupData.forEach((group, index) => {
          reportContent += `${index + 1}. ${group.name}\n`
          reportContent += `   Leader: ${group.leader}\n`
          reportContent += `   Recent Activity:\n`
          reportContent += `   - Last Update: ${group.lastUpdate}\n`
          reportContent += `   - Current Status: ${group.status}\n`
          reportContent += `   - Progress: ${group.progress}%\n`
          
          if (group.projects && group.projects.length > 0) {
            reportContent += `   - Projects:\n`
            group.projects.forEach(project => {
              reportContent += `     * ${project.title || 'Untitled Project'}\n`
              reportContent += `       Created: ${new Date(project.created_at).toLocaleDateString()}\n`
              reportContent += `       Last Modified: ${new Date(project.updated_at).toLocaleDateString()}\n`
            })
          }
          
          reportContent += "\n" + "-".repeat(40) + "\n\n"
        })
        
      } else if (selectedReportType === "comparison") {
        // Comparison Report
        reportContent += "GROUP PERFORMANCE COMPARISON\n\n"
        
        // Summary statistics
        const avgProgress = Math.round(selectedGroupData.reduce((sum, group) => sum + group.progress, 0) / selectedGroupData.length)
        const onTrackCount = selectedGroupData.filter(g => g.status === "On Track" || g.status === "Ahead").length
        const behindCount = selectedGroupData.filter(g => g.status === "Behind" || g.status === "Slightly Behind").length
        
        reportContent += `Summary Statistics:\n`
        reportContent += `- Average Progress: ${avgProgress}%\n`
        reportContent += `- Groups On Track: ${onTrackCount} (${Math.round((onTrackCount / selectedGroupData.length) * 100)}%)\n`
        reportContent += `- Groups Behind: ${behindCount} (${Math.round((behindCount / selectedGroupData.length) * 100)}%)\n\n`
        
        reportContent += `Detailed Comparison:\n\n`
        
        // Sort by progress for better comparison
        const sortedGroups = [...selectedGroupData].sort((a, b) => b.progress - a.progress)
        
        sortedGroups.forEach((group, index) => {
          const rank = index + 1
          reportContent += `${rank}. ${group.name} - ${group.progress}% (${group.status})\n`
          reportContent += `   Leader: ${group.leader} | Members: ${group.members}\n`
          reportContent += `   Project: ${group.project}\n\n`
        })
      }
      
      // Add footer
      reportContent += "\n" + "=".repeat(50) + "\n"
      reportContent += `Report generated on ${currentDate} by R-kive System\n`
      reportContent += `Total groups analyzed: ${selectedGroupData.length}\n`
      
      // Create and download the file
      const blob = new Blob([reportContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      const fileName = `${reportType.name.replace(/\s+/g, '_')}_${currentDate.replace(/\//g, '-')}.txt`
      link.download = fileName
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      // Save to recent reports
      const newReport = {
        name: `${reportType.name} - ${currentDate}`,
        date: currentDate,
        type: reportType.name.split(' ')[0],
        groups: selectedGroupData.length
      }
      
      setRecentReports(prev => [newReport, ...prev.slice(0, 4)])
      
      alert(`Report "${fileName}" has been generated and downloaded successfully!`)
      
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "On Track":
        return "bg-green-100 text-green-800"
      case "Ahead":
        return "bg-blue-100 text-blue-800"
      case "Slightly Behind":
        return "bg-yellow-100 text-yellow-800"
      case "Behind":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Reports Dashboard 📊</h1>
            <p className="text-gray-600">Generate and download comprehensive reports for your assigned groups</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAssignedGroups}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading assigned groups...</span>
          </div>
        </div>
      ) : assignedGroups.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Groups Assigned</h3>
            <p className="text-gray-600">
              You haven't been assigned to supervise any student groups yet. 
              Contact the superadmin to get assigned to research groups.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Groups</p>
                    <p className="text-2xl font-bold text-gray-900">{assignedGroups.length}</p>
                    <p className="text-xs text-green-600 mt-1">All assigned</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Progress</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {assignedGroups.length > 0 ? Math.round(assignedGroups.reduce((acc, group) => acc + group.progress, 0) / assignedGroups.length) : 0}%
                    </p>
                    <p className="text-xs text-green-600 mt-1">Overall performance</p>
                  </div>
                  <div className="h-12 w-12 bg-green-50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">On Track</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {assignedGroups.filter((group) => group.status === "On Track" || group.status === "Ahead").length}
                    </p>
                    <p className="text-xs text-green-600 mt-1">Groups performing well</p>
                  </div>
                  <div className="h-12 w-12 bg-green-50 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Need Attention</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {
                        assignedGroups.filter((group) => group.status === "Behind" || group.status === "Slightly Behind")
                          .length
                      }
                    </p>
                    <p className="text-xs text-red-600 mt-1">Require follow-up</p>
                  </div>
                  <div className="h-12 w-12 bg-red-50 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Configuration */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Report Configuration
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                >
                  Advanced Options
                  <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showAdvancedOptions ? 'rotate-180' : ''}`} />
                </Button>
              </div>
              <p className="text-sm text-gray-600">Configure your report parameters and options</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Report Type Selection */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">Select Report Type</h3>
                <div className="grid grid-cols-1 gap-3">
                  {reportTypes.map((type) => {
                    const IconComponent = type.icon
                    const isSelected = selectedReportType === type.id
                    return (
                      <div
                        key={type.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 shadow-sm"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedReportType(type.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${type.color}`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900">{type.name}</h4>
                              {isSelected && (
                                <Badge className="bg-blue-100 text-blue-800">Selected</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{type.description}</p>
                            <div className="flex flex-wrap gap-2">
                              {type.features.map((feature, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Date Range Selection */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Date Range</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                  {["week", "month", "semester", "all"].map((range) => (
                    <Button
                      key={range}
                      variant={dateRange === range ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDateRange(range)}
                      className="capitalize"
                    >
                      {range === "all" ? "All Time" : `This ${range}`}
                    </Button>
                  ))}
                </div>
                
                {/* Custom Date Range */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Start Date</label>
                    <input
                      type="date"
                      value={customDateRange.start}
                      onChange={(e) => setCustomDateRange({...customDateRange, start: e.target.value})}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">End Date</label>
                    <input
                      type="date"
                      value={customDateRange.end}
                      onChange={(e) => setCustomDateRange({...customDateRange, end: e.target.value})}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Options */}
              {showAdvancedOptions && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Advanced Configuration</h3>
                  
                  {/* Report Format */}
                  <div className="mb-4">
                    <label className="text-xs text-gray-600 mb-2 block">Export Format</label>
                    <div className="flex gap-2">
                      {[
                        { value: "txt", label: "Text File (.txt)" },
                        { value: "csv", label: "CSV (.csv)" },
                        { value: "pdf", label: "PDF (.pdf)" }
                      ].map((format) => (
                        <Button
                          key={format.value}
                          variant={reportFormat === format.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setReportFormat(format.value)}
                        >
                          {format.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Content Options */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-medium text-gray-700">Include in Report:</h4>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="chapter-details"
                        checked={includeChapterDetails}
                        onChange={(e) => setIncludeChapterDetails(e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="chapter-details" className="text-sm text-gray-700">
                        Detailed chapter progress and status
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="feedback"
                        checked={includeFeedback}
                        onChange={(e) => setIncludeFeedback(e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="feedback" className="text-sm text-gray-700">
                        Adviser feedback and comments
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="statistics"
                        checked={includeStatistics}
                        onChange={(e) => setIncludeStatistics(e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="statistics" className="text-sm text-gray-700">
                        Statistical analysis and trends
                      </label>
                    </div>
                  </div>

                  {/* Email Delivery */}
                  <div className="mt-4">
                    <h4 className="text-xs font-medium text-gray-700 mb-2">Email Delivery (Optional)</h4>
                    <input
                      type="email"
                      placeholder="Enter email to receive report copy"
                      className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={scheduledReport.email}
                      onChange={(e) => setScheduledReport({...scheduledReport, email: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {/* Group Selection with Enhanced UI */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Select Groups</h3>
                    <p className="text-xs text-gray-500">Choose which groups to include in the report</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleSelectAll}>
                      {selectedGroups.length === assignedGroups.length ? "Deselect All" : "Select All"}
                    </Button>
                    <Badge variant="outline">
                      {selectedGroups.length} of {assignedGroups.length} selected
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {assignedGroups.map((group) => {
                    const isSelected = selectedGroups.includes(group.id)
                    return (
                      <div
                        key={group.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => handleGroupSelection(group.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                              isSelected 
                                ? 'bg-blue-600 border-blue-600 text-white' 
                                : 'border-gray-300'
                            }`}>
                              {isSelected && <span className="text-xs">✓</span>}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 text-sm">{group.name}</h4>
                              <p className="text-xs text-gray-600">{group.project}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={getStatusColor(group.status)} variant="outline">
                                  {group.status}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {group.members} members • {group.progress}% complete
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Progress value={group.progress} className="w-16 h-2" />
                            <span className="text-xs font-medium text-gray-600 min-w-[35px]">
                              {group.progress}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Generate Report Button */}
              <div className="pt-4 border-t">
                <Button 
                  onClick={generateReport} 
                  className="w-full" 
                  disabled={selectedGroups.length === 0 || generating}
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Generate & Download Report
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Reports & Quick Actions */}
        <div className="space-y-6">
          {/* Recent Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentReports.length > 0 ? (
                  recentReports.map((report, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{report.name}</p>
                        <p className="text-xs text-gray-600">{report.date} • {report.groups} groups</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {report.type}
                        </Badge>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No reports generated yet</p>
                    <p className="text-xs">Generate your first report above</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Report Planning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Scheduled Reports */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Automated Reports</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="auto-weekly"
                      checked={scheduledReport.enabled && scheduledReport.frequency === 'weekly'}
                      onChange={(e) => setScheduledReport({
                        ...scheduledReport, 
                        enabled: e.target.checked, 
                        frequency: 'weekly'
                      })}
                      className="rounded"
                    />
                    <label htmlFor="auto-weekly" className="text-sm text-gray-700">
                      Weekly progress reports
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="auto-monthly"
                      checked={scheduledReport.enabled && scheduledReport.frequency === 'monthly'}
                      onChange={(e) => setScheduledReport({
                        ...scheduledReport, 
                        enabled: e.target.checked, 
                        frequency: 'monthly'
                      })}
                      className="rounded"
                    />
                    <label htmlFor="auto-monthly" className="text-sm text-gray-700">
                      Monthly comprehensive reports
                    </label>
                  </div>
                </div>
              </div>

              {/* Report Templates */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Templates</h4>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start bg-transparent text-sm h-8"
                    onClick={() => {
                      setSelectedReportType("progress")
                      setSelectedGroups(assignedGroups.map(g => g.id))
                      setDateRange("week")
                    }}
                  >
                    <BarChart3 className="h-3 w-3 mr-2" />
                    Weekly Progress Summary
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start bg-transparent text-sm h-8"
                    onClick={() => {
                      setSelectedReportType("comparison")
                      setSelectedGroups(assignedGroups.map(g => g.id))
                      setDateRange("month")
                    }}
                  >
                    <TrendingUp className="h-3 w-3 mr-2" />
                    Monthly Performance Review
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start bg-transparent text-sm h-8"
                    onClick={() => {
                      setSelectedReportType("detailed")
                      setSelectedGroups(assignedGroups.filter(g => g.status === "Behind").map(g => g.id))
                      setDateRange("semester")
                    }}
                  >
                    <AlertTriangle className="h-3 w-3 mr-2" />
                    Groups Needing Attention
                  </Button>
                </div>
              </div>

              {/* Report Insights */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Insights & Recommendations</h4>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                    <div>
                      <p className="text-xs text-blue-800 font-medium">Suggested Action</p>
                      <p className="text-xs text-blue-700 mt-1">
                        {assignedGroups.filter(g => g.status === "Behind").length > 0 
                          ? `${assignedGroups.filter(g => g.status === "Behind").length} groups are behind schedule. Consider generating a detailed assessment report.`
                          : "All groups are performing well! Generate a progress summary to track continued success."
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export & Share */}
          <Card>
            <CardHeader>
              <CardTitle>Export & Share</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  Bulk Export All Data
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Reports
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Filter className="h-4 w-4 mr-2" />
                  Save Custom Filter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </>
    )}
    </div>
  )
}

export default AdviserReports
