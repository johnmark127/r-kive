"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Loader2, Clock, Calendar, MessageSquare, AlertTriangle, CheckCircle, XCircle, Target, TrendingDown, Star, Mail, Phone, BookOpen, GraduationCap, FileText, Users, Eye } from "lucide-react"
import { supabase } from "@/supabase/client"

const AdviserMonitoring = () => {
  const [loading, setLoading] = useState(true)
  const [advisers, setAdvisers] = useState([])
  const [selectedAdviser, setSelectedAdviser] = useState(null)
  const [timeFilter, setTimeFilter] = useState('month') // week, month, semester
  
  // Performance metrics state
  const [performanceMetrics, setPerformanceMetrics] = useState({
    totalAdvisers: 0,
    averageResponseTime: 0,
    groupsAssigned: 0,
    feedbackGiven: 0
  })

  useEffect(() => {
    fetchAdviserData()
  }, [timeFilter])

  const fetchAdviserData = async () => {
    setLoading(true)
    try {
      // Fetch all advisers from the users table
      const { data: adviserUsers, error: advisersError } = await supabase
        .from('users')
        .select('id, firstName, lastName, email, created_at')
        .eq('role', 'adviser')
        .order('firstName', { ascending: true })

      if (advisersError) {
        console.error('Error fetching advisers:', advisersError)
        return
      }

      // Fetch group assignments for each adviser
      const { data: groupAssignments, error: assignmentsError } = await supabase
        .from('adviser_group_assignments')
        .select(`
          adviser_id,
          group_id,
          assigned_at,
          student_groups!inner (
            id,
            group_name,
            is_active,
            created_at
          )
        `)

      if (assignmentsError) {
        console.error('Error fetching group assignments:', assignmentsError)
      }

      // Since we don't have student_group_members table, we'll work with what we have

      // Fetch research projects with any chapter feedback (we'll match them to advisers through group assignments)
      const { data: researchProjects, error: projectsError } = await supabase
        .from('research_projects')
        .select(`
          id, 
          group_id, 
          created_at, 
          updated_at,
          status, 
          title,
          chapter_1_feedback,
          chapter_2_feedback,
          chapter_3_feedback,
          chapter_4_feedback,
          chapter_5_feedback,
          pre_oral_defense_feedback
        `)
        .or('chapter_1_feedback.neq.,chapter_2_feedback.neq.,chapter_3_feedback.neq.,chapter_4_feedback.neq.,chapter_5_feedback.neq.,pre_oral_defense_feedback.neq.')

      if (projectsError) {
        console.error('Error fetching research project feedback:', projectsError)
      }

      // Process the data to create adviser performance objects
      const processedAdvisers = adviserUsers?.map(adviser => {
        // Get assignments for this adviser
        const adviserAssignments = groupAssignments?.filter(assignment => 
          assignment.adviser_id === adviser.id
        ) || []

        const activeGroups = adviserAssignments.filter(assignment => 
          assignment.student_groups.is_active
        )

        // Get feedback count for this adviser by matching through group assignments
        const adviserGroupIds = adviserAssignments.map(assignment => assignment.group_id)
        const adviserFeedback = researchProjects?.filter(project => 
          adviserGroupIds.includes(project.group_id)
        ) || []

        // Since we don't have student_group_members table, we'll estimate based on groups
        // Each group typically has 3-5 students, so we'll use groups * 4 as an estimate
        const studentsSupervised = activeGroups.length * 4

        // Calculate time since account creation (since we don't have last_sign_in_at)
        const accountCreated = new Date(adviser.created_at)
        const now = new Date()
        const timeDiff = now - accountCreated
        const daysAgo = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
        
        let lastActiveText = "Unknown"
        if (daysAgo === 0) {
          lastActiveText = "Today"
        } else if (daysAgo === 1) {
          lastActiveText = "Yesterday"
        } else if (daysAgo < 7) {
          lastActiveText = `${daysAgo} days ago`
        } else if (daysAgo < 30) {
          const weeksAgo = Math.floor(daysAgo / 7)
          lastActiveText = `${weeksAgo} week${weeksAgo > 1 ? 's' : ''} ago`
        } else {
          const monthsAgo = Math.floor(daysAgo / 30)
          lastActiveText = `${monthsAgo} month${monthsAgo > 1 ? 's' : ''} ago`
        }

        // Determine status based on recent feedback activity instead of sign-in time
        let status = "inactive"
        
        // Count total feedback instances across all chapters
        const totalFeedbackCount = adviserFeedback.reduce((count, project) => {
          let projectFeedbackCount = 0
          if (project.chapter_1_feedback && project.chapter_1_feedback.trim() !== '') projectFeedbackCount++
          if (project.chapter_2_feedback && project.chapter_2_feedback.trim() !== '') projectFeedbackCount++
          if (project.chapter_3_feedback && project.chapter_3_feedback.trim() !== '') projectFeedbackCount++
          if (project.chapter_4_feedback && project.chapter_4_feedback.trim() !== '') projectFeedbackCount++
          if (project.chapter_5_feedback && project.chapter_5_feedback.trim() !== '') projectFeedbackCount++
          if (project.pre_oral_defense_feedback && project.pre_oral_defense_feedback.trim() !== '') projectFeedbackCount++
          return count + projectFeedbackCount
        }, 0)
        
        // Check for recent activity based on updated_at
        const recentFeedback = adviserFeedback.filter(project => {
          const updateDate = new Date(project.updated_at || project.created_at)
          const feedbackDaysAgo = Math.floor((now - updateDate) / (1000 * 60 * 60 * 24))
          return feedbackDaysAgo <= 7 // Updated within last week
        })
        
        if (recentFeedback.length > 0 || totalFeedbackCount > 0) {
          status = "active"
        } else if (adviserFeedback.length > 0) {
          const lastUpdateDate = new Date(Math.max(...adviserFeedback.map(f => new Date(f.updated_at || f.created_at))))
          const daysSinceLastUpdate = Math.floor((now - lastUpdateDate) / (1000 * 60 * 60 * 24))
          if (daysSinceLastUpdate <= 30) {
            status = "warning"
          }
        }

        // Create recent activities from feedback data
        const recentActivities = []
        
        // Process each project's feedback to create individual activity entries
        adviserFeedback.forEach(project => {
          const feedbackEntries = [
            { type: 'Chapter 1', feedback: project.chapter_1_feedback },
            { type: 'Chapter 2', feedback: project.chapter_2_feedback },
            { type: 'Chapter 3', feedback: project.chapter_3_feedback },
            { type: 'Chapter 4', feedback: project.chapter_4_feedback },
            { type: 'Chapter 5', feedback: project.chapter_5_feedback },
            { type: 'Pre-Oral Defense', feedback: project.pre_oral_defense_feedback }
          ]
          
          feedbackEntries.forEach(entry => {
            if (entry.feedback && entry.feedback.trim() !== '') {
              // Use updated_at for more accurate feedback timing
              const feedbackDate = new Date(project.updated_at || project.created_at)
              const timeDiff = now - feedbackDate
              const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60))
              const daysAgo = Math.floor(hoursAgo / 24)
              
              let timeText = ""
              if (hoursAgo < 1) {
                timeText = "Just now"
              } else if (hoursAgo < 24) {
                timeText = `${hoursAgo} hours ago`
              } else {
                timeText = `${daysAgo} days ago`
              }

              recentActivities.push({
                type: "feedback",
                description: `Provided feedback on ${entry.type}: ${entry.feedback.substring(0, 50)}...`,
                time: timeText,
                group: project.title?.substring(0, 30) + "..." || "Research Project",
                timestamp: feedbackDate // For sorting
              })
            }
          })
        })
        
        // Sort by most recent and take top 3
        recentActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        const topRecentActivities = recentActivities.slice(0, 3)

        // If no feedback activities, add some default activities
        if (topRecentActivities.length === 0) {
          topRecentActivities.push({
            type: "notification",
            description: "No recent activity recorded",
            time: lastActiveText,
            group: "N/A"
          })
        }

        return {
          id: adviser.id,
          name: `${adviser.firstName || ''} ${adviser.lastName || ''}`.trim() || adviser.email,
          email: adviser.email,
          avatar: `${adviser.firstName?.[0] || ''}${adviser.lastName?.[0] || ''}` || adviser.email.substring(0, 2).toUpperCase(),
          department: "Research Faculty", // Default department since column doesn't exist
          assignedGroups: activeGroups.length,
          activeProjects: activeGroups.length, // Using active groups as proxy for active projects
          completedProjects: adviserAssignments.length - activeGroups.length, // Completed = total - active
          averageResponseTime: Math.random() * 5 + 1, // Placeholder - you'd calculate this from actual response times
          lastActive: lastActiveText,
          status: status,
          rating: 4.0 + Math.random() * 1, // Placeholder - you'd get this from ratings table
          feedbackCount: totalFeedbackCount,
          meetingsScheduled: Math.floor(Math.random() * 30) + 10, // Placeholder
          missedMeetings: Math.floor(Math.random() * 5), // Placeholder  
          progressReviewsCompleted: Math.floor(Math.random() * 20) + 80, // Placeholder percentage
          studentsSupervised: studentsSupervised,
          researchAreasExpertise: ["Research Area 1", "Research Area 2"], // Placeholder
          weeklyActivityScore: Math.floor(Math.random() * 40) + 60, // Placeholder
          monthlyActivityScore: Math.floor(Math.random() * 40) + 60, // Placeholder
          recentActivities: topRecentActivities
        }
      }) || []

      setAdvisers(processedAdvisers)
      
      // Calculate performance metrics
      const totalGroups = processedAdvisers.reduce((sum, a) => sum + a.assignedGroups, 0)
      const totalFeedback = processedAdvisers.reduce((sum, a) => sum + a.feedbackCount, 0)
      const avgResponseTime = processedAdvisers.length > 0 
        ? (processedAdvisers.reduce((sum, a) => sum + a.averageResponseTime, 0) / processedAdvisers.length).toFixed(1)
        : 0

      const metrics = {
        totalAdvisers: processedAdvisers.length,
        averageResponseTime: avgResponseTime,
        groupsAssigned: totalGroups,
        feedbackGiven: totalFeedback
      }
      setPerformanceMetrics(metrics)
      
    } catch (error) {
      console.error('Error fetching adviser data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50'
      case 'inactive': return 'text-red-600 bg-red-50'
      case 'warning': return 'text-yellow-600 bg-yellow-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getActivityScoreColor = (score) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-blue-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'feedback': return <MessageSquare className="w-4 h-4 text-blue-600" />
      case 'meeting': return <Calendar className="w-4 h-4 text-green-600" />
      case 'review': return <FileText className="w-4 h-4 text-purple-600" />
      case 'notification': return <AlertTriangle className="w-4 h-4 text-orange-600" />
      default: return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading adviser data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Adviser Monitoring Dashboard</h1>
            <p className="text-gray-600">Real-time overview of adviser performance and activity</p>
          </div>
          <Button 
            onClick={fetchAdviserData}
            variant="outline"
            size="sm"
          >
            <Clock className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="flex flex-row gap-6 mb-8">
        <div className="flex-1 bg-white rounded-lg shadow-sm p-4 text-center">
          <div className="text-xs text-gray-500 mb-1">Total Advisers</div>
          <div className="text-2xl font-bold text-gray-900">{performanceMetrics.totalAdvisers}</div>
        </div>
        <div className="flex-1 bg-white rounded-lg shadow-sm p-4 text-center">
          <div className="text-xs text-gray-500 mb-1">Groups Assigned</div>
          <div className="text-2xl font-bold text-gray-900">{performanceMetrics.groupsAssigned}</div>
        </div>
        <div className="flex-1 bg-white rounded-lg shadow-sm p-4 text-center">
          <div className="text-xs text-gray-500 mb-1">Feedback Given</div>
          <div className="text-2xl font-bold text-gray-900">{performanceMetrics.feedbackGiven}</div>
        </div>
        <div className="flex-1 bg-white rounded-lg shadow-sm p-4 text-center">
          <div className="text-xs text-gray-500 mb-1">Avg Response Time</div>
          <div className="text-2xl font-bold text-gray-900">{performanceMetrics.averageResponseTime}h</div>
        </div>
      </div>

      {/* Adviser Cards */}
      <div className="space-y-4">
        {advisers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Advisers Found</h3>
            <p className="text-gray-600">There are currently no advisers in the system.</p>
          </div>
        ) : (
          advisers.map((adviser, idx) => {
            const hasPendingReview = adviser.recentActivities.some(activity => 
              activity.type === "review" && activity.description.toLowerCase().includes("pending")
            );
            const mostRecent = adviser.recentActivities[0];
            
            // Determine status color
            let statusClass = "bg-gray-100 text-gray-700";
            if (adviser.status === "active") {
              statusClass = "bg-green-100 text-green-700";
            } else if (adviser.status === "warning") {
              statusClass = "bg-yellow-100 text-yellow-700";
            } else if (adviser.status === "inactive") {
              statusClass = "bg-red-100 text-red-700";
            }

            return (
              <div key={adviser.id} className="bg-white rounded-lg shadow-sm border p-6 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar/Initials */}
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-xl">
                      {adviser.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-lg text-gray-900">{adviser.name}</div>
                      <div className="text-sm text-gray-500">{adviser.email}</div>
                      <div className="text-xs text-gray-400 mt-1">{adviser.department}</div>
                      <div className="flex gap-4 mt-1">
                        <span className="text-xs text-gray-600">Groups: <span className="font-bold">{adviser.assignedGroups}</span></span>
                        <span className="text-xs text-gray-600">Feedback: <span className="font-bold">{adviser.feedbackCount}</span></span>
                        <span className="text-xs text-gray-600">Students: <span className="font-bold">{adviser.studentsSupervised}</span></span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {/* Status with color */}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
                      {adviser.status.charAt(0).toUpperCase() + adviser.status.slice(1)}
                    </span>
                    <span className="text-xs text-gray-500">Last active: {adviser.lastActive}</span>
                    {/* Pending Review Badge */}
                    {hasPendingReview && (
                      <Badge variant="destructive">Pending Review</Badge>
                    )}
                  </div>
                </div>
                {/* Currently On section */}
                {mostRecent && mostRecent.type !== "notification" && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border text-sm">
                    <span className="font-semibold text-gray-700">Most Recent Activity:</span> 
                    <span className="text-gray-800 ml-2">{mostRecent.description}</span>
                    <div className="text-xs text-gray-500 mt-1">{mostRecent.group} • {mostRecent.time}</div>
                  </div>
                )}
                <button
                  className="text-xs text-blue-600 hover:text-blue-800 underline self-start mt-2 transition-colors"
                  onClick={() => setSelectedAdviser(selectedAdviser === adviser.id ? null : adviser.id)}
                >
                  {selectedAdviser === adviser.id ? "Hide Activities" : "Show Recent Activities"}
                </button>
                {selectedAdviser === adviser.id && (
                  <div className="mt-2 border-t pt-3 space-y-2">
                    {adviser.recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3 text-sm">
                        {getActivityIcon(activity.type)}
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 leading-tight">{activity.description}</div>
                          <div className="text-xs text-gray-500 font-normal mt-1">{activity.group} • {activity.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  )
}

export default AdviserMonitoring
