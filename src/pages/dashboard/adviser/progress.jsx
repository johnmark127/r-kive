"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Users,
  TrendingUp,
  FileText,
  Eye,
  MessageSquare,
  Filter,
  Loader2,
  RefreshCw,
  Download,
  BookOpen,
  Edit,
  ChevronRight,
  Activity,
  Send
} from "lucide-react"
import { supabase } from "../../../supabase/client"

const ProgressMonitoring = () => {
  // Adviser workflow modal states (for defense status)
  const [showDefenseModal, setShowDefenseModal] = useState(false);
  const [defenseStatus, setDefenseStatus] = useState('Not Started');
  const [defenseFeedback, setDefenseFeedback] = useState('');
  const [defenseProjectId, setDefenseProjectId] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackText, setFeedbackText] = useState("")
  const [groupDetails, setGroupDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [showChapterModal, setShowChapterModal] = useState(false)
  const [selectedChapter, setSelectedChapter] = useState(null)
  const [showChapterFeedbackModal, setShowChapterFeedbackModal] = useState(false)
  const [chapterFeedbackText, setChapterFeedbackText] = useState("")
  const [selectedProject, setSelectedProject] = useState(null)

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

  // Fetch assigned groups and their progress
  useEffect(() => {
    if (currentUser) {
      fetchGroupProgress()
    }
  }, [currentUser])

  const fetchGroupProgress = async () => {
    try {
      setLoading(true)
      
      if (!currentUser) {
        setGroups([])
        return
      }

      // Get groups assigned to this adviser
        const { data: assignedGroups, error: groupError } = await supabase
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
      // Filter for active groups in JS
      const filteredGroups = (assignedGroups || []).filter(assignment => assignment.student_groups?.is_active)

      if (groupError) {
        console.error('Error fetching assigned groups:', groupError)
        setGroups([])
        return
      }

      if (!assignedGroups || assignedGroups.length === 0) {
        console.log('No assigned groups found for this adviser')
        setGroups([])
        return
      }

      // Get research proposals for progress calculation
      const groupIds = assignedGroups.map(assignment => assignment.group_id)
      const { data: proposalsData, error: proposalsError } = await supabase
        .from('research_proposals')
        .select('group_id, status, submitted_at, title, description, category, updated_at')
        .in('group_id', groupIds)

      if (proposalsError) {
        console.warn('Could not fetch research proposals:', proposalsError)
      }

      // No student_group_members table, so skip fetching member proposals
      // Removed allStudentIds and studentProposals logic

      // Get chapters/research projects data
      let projectsData = []
      let projectsError = null
      if (groupIds.length > 0) {
          const { data, error } = await supabase
            .from('research_projects')
            .select(`*, pre_oral_defense_status`)
            .in('group_id', groupIds)
          projectsData = data || []
          projectsError = error
          if (projectsError) {
            console.warn('Could not fetch research projects:', projectsError)
          }
      }

      // Get user details for group members
      const allUserIds = new Set()
      assignedGroups.forEach(assignment => {
        if (assignment.student_groups.created_by) {
          allUserIds.add(assignment.student_groups.created_by)
        }
        assignment.student_groups.student_group_members?.forEach(member => {
          if (member.student_id) allUserIds.add(member.student_id)
        })
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

      // Process groups with enhanced progress calculation
      const processedGroups = assignedGroups.map(assignment => {
        const group = assignment.student_groups
        const groupProposals = (proposalsData || []).filter(p => p.group_id === group.id)
        // Get chapters for this group
        const groupProjects = (projectsData || []).filter(p => p.group_id === group.id)
        // Calculate comprehensive progress
        let progress = calculateDetailedProgress(groupProposals, [], groupProjects)
        // Find group leader (use creator only)
        const creator = usersData.find(user => user.id === group.created_by)
        const leader = creator
        // Determine status based on multiple factors
        let status = determineGroupStatus(progress, groupProposals, [], groupProjects)

        return {
          id: group.id,
          name: group.group_name,
          description: group.description,
          members: [leader ? {
            id: leader.id,
            name: `${leader.firstName || ''} ${leader.lastName || ''}`.trim() || leader.email,
            isLeader: true,
            email: leader.email
          } : { name: 'Not assigned', isLeader: true }],
          leader: leader ? `${leader.firstName || ''} ${leader.lastName || ''}`.trim() || leader.email : 'Not assigned',
          completion: progress,
          status: status,
          lastUpdate: formatLastUpdate(group.updated_at || group.created_at),
          researchFocus: group.research_focus,
          memberCount: 1,
          proposals: groupProposals,
          memberProposals: [],
          projects: groupProjects,
          assignedAt: assignment.assigned_at,
          hasRecentActivity: checkRecentActivity(group.updated_at, groupProposals, [], groupProjects)
        }
      })

      setGroups(processedGroups)
    } catch (error) {
      console.error('Error in fetchGroupProgress:', error)
      setGroups([])
    } finally {
      setLoading(false)
    }
  }

  const formatLastUpdate = (dateString) => {
    if (!dateString) return 'Never'
    
    const now = new Date()
    const updated = new Date(dateString)
    const diffInHours = Math.floor((now - updated) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return '1 day ago'
    if (diffInDays < 7) return `${diffInDays} days ago`
    
    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks === 1) return '1 week ago'
    return `${diffInWeeks} weeks ago`
  }

  // Calculate detailed progress based only on chapters (not proposals)
  const calculateDetailedProgress = (groupProposals, memberProposals, projects) => {
    // Only use research projects/chapters for progress calculation
    if (projects.length === 0) return 0

    let totalProjectProgress = 0
    projects.forEach(project => {
      // Calculate chapter completion
      let chapterProgress = 0
      
      // Each chapter is worth 20% (5 chapters = 100%)
      if (project.chapter_1_completed) chapterProgress += 20
      if (project.chapter_2_completed) chapterProgress += 20
      if (project.chapter_3_completed) chapterProgress += 20
      if (project.chapter_4_completed) chapterProgress += 20
      if (project.chapter_5_completed) chapterProgress += 20
      
      // Add partial credit for in-progress chapters (10% each)
      if (!project.chapter_1_completed && project.chapter_1_status === 'in_progress') chapterProgress += 10
      if (!project.chapter_2_completed && project.chapter_2_status === 'in_progress') chapterProgress += 10
      if (!project.chapter_3_completed && project.chapter_3_status === 'in_progress') chapterProgress += 10
      if (!project.chapter_4_completed && project.chapter_4_status === 'in_progress') chapterProgress += 10
      if (!project.chapter_5_completed && project.chapter_5_status === 'in_progress') chapterProgress += 10
      
      // Use project progress if available, otherwise use chapter calculation
      totalProjectProgress += project.progress || chapterProgress
    })
    
    return Math.round(totalProjectProgress / projects.length)
  }

  // Determine group status based only on chapter progress
  const determineGroupStatus = (progress, groupProposals, memberProposals, projects) => {
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))

    // Check for recent activity only in projects/chapters
    const hasRecentActivity = projects.some(p => 
      new Date(p.updated_at || p.created_at) > oneWeekAgo
    )

    if (progress >= 80) return 'ahead'
    if (progress >= 50 && hasRecentActivity) return 'on-track'
    if (progress < 25 || !hasRecentActivity) return 'behind'
    return 'on-track'
  }

  // Check for recent activity - only chapters/projects matter now
  const checkRecentActivity = (groupUpdated, groupProposals, memberProposals, projects) => {
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))

    const groupActivity = groupUpdated && new Date(groupUpdated) > oneWeekAgo
    const projectActivity = projects.some(p => 
      new Date(p.updated_at || p.created_at) > oneWeekAgo
    )

    return groupActivity || projectActivity
  }

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchGroupProgress()
    } finally {
      setRefreshing(false)
    }
  }

  // Calculate statistics
  const totalGroups = groups.length
  const onTrackGroups = groups.filter(g => g.status === "on-track" || g.status === "ahead").length
  const behindGroups = groups.filter(g => g.status === "behind").length
  const avgCompletion = totalGroups > 0 ? Math.round(groups.reduce((sum, g) => sum + g.completion, 0) / totalGroups) : 0

  const progressStats = [
    {
      title: "Total Groups",
      value: totalGroups.toString(),
      change: "Assigned to you",
      icon: Users,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "On Track",
      value: onTrackGroups.toString(),
      change: totalGroups > 0 ? `${Math.round((onTrackGroups / totalGroups) * 100)}% of groups` : "0%",
      icon: CheckCircle,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Behind Schedule",
      value: behindGroups.toString(),
      change: "Need attention",
      icon: AlertTriangle,
      color: "bg-red-100 text-red-600",
    },
    {
      title: "Avg Completion",
      value: `${avgCompletion}%`,
      change: "Overall progress",
      icon: TrendingUp,
      color: "bg-purple-100 text-purple-600",
    },
  ]

  // Filter groups based on selected filter
  const filteredGroups = groups.filter((group) => {
    if (selectedFilter === "all") return true
    if (selectedFilter === "on-track") return group.status === "on-track" || group.status === "ahead"
    if (selectedFilter === "behind") return group.status === "behind"
    if (selectedFilter === "ahead") return group.status === "ahead"
    return true
  })

  const getStatusColor = (status) => {
    switch (status) {
      case "on-track":
        return "bg-green-100 text-green-800"
      case "behind":
        return "bg-red-100 text-red-800"
      case "ahead":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "on-track":
        return CheckCircle
      case "behind":
        return AlertTriangle
      case "ahead":
        return TrendingUp
      default:
        return Clock
    }
  }

  // Handle viewing group details
  const handleViewDetails = async (group) => {
    setSelectedGroup(group)
    setLoadingDetails(true)
    setShowDetailsModal(true)
    
    try {
      // Debug: log group ID
      console.log('handleViewDetails: group.id =', group.id)

      // Only fetch proposals and projects by group_id
      const { data: detailedProposals } = await supabase
        .from('research_proposals')
        .select('*')
        .eq('group_id', group.id)
      console.log('Fetched proposals:', detailedProposals)

      const { data: detailedProjects } = await supabase
        .from('research_projects')
        .select('*')
        .eq('group_id', group.id)
      console.log('Fetched projects:', detailedProjects)

      setGroupDetails({
        ...group,
        detailedProposals: detailedProposals || [],
        detailedProjects: detailedProjects || [],
        feedback: []
      })
    } catch (error) {
      console.error('Error fetching group details:', error)
    } finally {
      setLoadingDetails(false)
    }
  }

  // Handle sending feedback
  const handleSendFeedback = (group) => {
    setSelectedGroup(group)
    setShowFeedbackModal(true)
    setFeedbackText("")
  }

  const handleSubmitFeedback = async () => {
    if (!selectedGroup || !feedbackText.trim()) return

    try {
      // Remove adviser_feedback table insert
      alert('Feedback sent successfully! (No database table to save feedback)')
      setShowFeedbackModal(false)
      setFeedbackText("")
      setSelectedGroup(null)
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to send feedback. Please try again.')
    }
  }

  // Handle viewing chapter content
  const handleViewChapter = (chapter, project) => {
    setSelectedChapter(chapter)
    setSelectedProject(project)
    setShowChapterModal(true)
  }

  // Handle downloading chapter file
  const handleDownloadChapter = async (chapter, project) => {
    try {
      if (chapter.filename) {
        // Create a download link for the file
        const element = document.createElement('a')
        element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(chapter.content || '')}`)
        element.setAttribute('download', chapter.filename)
        element.style.display = 'none'
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
      } else if (chapter.content) {
        // Download content as text file
        const element = document.createElement('a')
        element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(chapter.content)}`)
        element.setAttribute('download', `Chapter_${chapter.num}_${project.title || 'Research'}.txt`)
        element.style.display = 'none'
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
      }
    } catch (error) {
      console.error('Error downloading chapter:', error)
      alert('Failed to download chapter. Please try again.')
    }
  }

  // Handle giving feedback to chapter
  const handleGiveChapterFeedback = (chapter, project) => {
    setSelectedChapter(chapter)
    setSelectedProject(project)
    setChapterFeedbackText(chapter.feedback || "")
    setShowChapterFeedbackModal(true)
  }

  // Handle submitting chapter feedback
  const [chapterStatus, setChapterStatus] = useState("");
  const handleSubmitChapterFeedback = async () => {
    if (!selectedChapter || !selectedProject || !chapterFeedbackText.trim() || !chapterStatus) return;
    try {
      const feedbackField = `chapter_${selectedChapter.num}_feedback`;
      const statusField = `chapter_${selectedChapter.num}_status`;
      const { error } = await supabase
        .from('research_projects')
        .update({
          [feedbackField]: chapterFeedbackText,
          [statusField]: chapterStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedProject.id);
      if (error) {
        console.error('Error submitting chapter feedback:', error);
        alert('Failed to submit feedback. Please try again.');
        return;
      }
      alert('Feedback submitted successfully!');
      setShowChapterFeedbackModal(false);
      setChapterFeedbackText("");
      setChapterStatus("");
      setSelectedChapter(null);
      setSelectedProject(null);
      await handleViewDetails(selectedGroup);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to submit feedback. Please try again.');
    }
  };

  if (!currentUser) {
    return (
      <div className="space-y-6">
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg">
          Please log in to view your assigned groups.
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Progress Monitoring</h1>
            <p className="text-gray-600">Track and monitor your assigned groups' project progress and research chapters</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              View Calendar
            </Button>
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {progressStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="bg-white border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filter Controls */}
      <div className="bg-white rounded-lg p-4 shadow-sm border mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <Filter className="w-4 h-4 mr-2 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by status:</span>
          </div>
          <div className="flex gap-2">
            {[
              { key: "all", label: "All Groups" },
              { key: "on-track", label: "On Track" },
              { key: "behind", label: "Behind" },
              { key: "ahead", label: "Ahead" },
            ].map((filter) => (
              <Button
                key={filter.key}
                variant={selectedFilter === filter.key ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter(filter.key)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Groups List */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-gray-600">Loading groups...</span>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {selectedFilter === "all" ? "No groups assigned" : `No ${selectedFilter} groups`}
            </h3>
            <p className="text-gray-600">
              {selectedFilter === "all" 
                ? "You haven't been assigned to any research groups yet."
                : `There are currently no groups with ${selectedFilter} status.`}
            </p>
          </div>
        ) : (
          filteredGroups.map((group) => {
            const StatusIcon = getStatusIcon(group.status)
            // Find current chapter for the first project (if any)
            let currentChapterBadge = null
            if (group.projects && group.projects.length > 0) {
              const project = group.projects[0]
              const chapterTitles = [
                'Introduction and Background',
                'Literature Review',
                'Research Methodology',
                'Results and Discussion',
                'Conclusion and Recommendation'
              ]
              const chapters = [
                { num: 1, completed: project.chapter_1_completed, status: project.chapter_1_status },
                { num: 2, completed: project.chapter_2_completed, status: project.chapter_2_status },
                { num: 3, completed: project.chapter_3_completed, status: project.chapter_3_status },
                { num: 4, completed: project.chapter_4_completed, status: project.chapter_4_status },
                { num: 5, completed: project.chapter_5_completed, status: project.chapter_5_status }
              ]
              const currentChapter = chapters.find(ch => !ch.completed && (ch.status === 'in_progress')) || chapters.find(ch => !ch.completed) || null
              if (currentChapter) {
                currentChapterBadge = (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 ml-2">
                    Currently on Chapter {currentChapter.num}
                  </Badge>
                )
              }
            }
            return (
              <Card key={group.id} className="bg-white border shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 mb-1 flex items-center">
                        {group.name}
                        {currentChapterBadge}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mb-2">{group.description || group.researchFocus}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          <span>{group.memberCount} members</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>Updated {group.lastUpdate}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(group.status)}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {group.status === "on-track" ? "On Track" : group.status === "behind" ? "Behind" : "Ahead"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                      <span className="text-sm font-semibold text-gray-900">{group.completion}%</span>
                    </div>
                    <Progress value={group.completion} className="h-2" />
                  </div>

                  {/* Research Focus Only */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Research Focus</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {group.researchFocus || "No research focus specified"}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleViewDetails(group)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleSendFeedback(group)}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Feedback
                    </Button>
                    {group.status === "behind" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                        onClick={() => handleSendFeedback(group)}
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Follow Up
                      </Button>
                    )}
                    {group.hasRecentActivity && (
                      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                        <Activity className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Group Details Modal - Shows Progress Reports and Chapters */}
      {showDetailsModal && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedGroup.name}</h2>
                  <p className="text-gray-600">Detailed Progress Report & Chapter Status</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetailsModal(false)}
                >
                  ×
                </Button>
              </div>
            </div>
            
            <div className="p-6 space-y-8">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span className="text-gray-600">Loading detailed progress...</span>
                </div>
              ) : groupDetails ? (
                <>
                  {/* Progress Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Overall Progress</p>
                            <p className="text-2xl font-bold">{groupDetails.completion}%</p>
                          </div>
                          <div className={`p-3 rounded-full ${getStatusColor(groupDetails.status)}`}>
                            <TrendingUp className="w-5 h-5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Research Proposals</p>
                            <p className="text-2xl font-bold">{groupDetails.detailedProposals?.length || 0}</p>
                          </div>
                          <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                            <FileText className="w-5 h-5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Research Projects</p>
                            <p className="text-2xl font-bold">{groupDetails.detailedProjects?.length || 0}</p>
                          </div>
                          <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                            <BookOpen className="w-5 h-5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Team Members</p>
                            <p className="text-2xl font-bold">{groupDetails.memberCount}</p>
                          </div>
                          <div className="p-3 rounded-full bg-green-100 text-green-600">
                            <Users className="w-5 h-5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Research Proposals Section */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Research Proposals
                    </h3>
                    {groupDetails.detailedProposals?.length > 0 ? (
                      <div className="space-y-4">
                        {groupDetails.detailedProposals.map((proposal, idx) => (
                          <Card key={idx} className="border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900">{proposal.title}</h4>
                                  <p className="text-sm text-gray-600 mt-1">{proposal.description}</p>
                                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                    <span>Category: {proposal.category || 'Not specified'}</span>
                                    <span>Submitted: {new Date(proposal.submitted_at).toLocaleDateString()}</span>
                                  </div>
                                </div>
                                <Badge className={getStatusColor(proposal.status)}>
                                  {proposal.status}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">No research proposals submitted yet.</p>
                    )}
                  </div>

                  {/* Chapters Section */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <BookOpen className="w-5 h-5 mr-2" />
                      Chapter Progress
                    </h3>
                    {groupDetails.detailedProjects?.length > 0 ? (
                      <div className="space-y-6">
                        {groupDetails.detailedProjects.map((project, idx) => {
                          // ...existing code...
                          // Handler to open modal for this project
                          const handleOpenDefenseModal = () => {
                            setDefenseStatus(project.pre_oral_defense_status || "Not Started");
                            setDefenseFeedback(project.pre_oral_defense_feedback || "");
                            setDefenseProjectId(project.id);
                            setShowDefenseModal(true);
                          };
                          // Handler to submit status
                          const handleSubmitDefenseStatus = async () => {
                            try {
                              const { error } = await supabase
                                .from('research_projects')
                                .update({
                                  pre_oral_defense_status: defenseStatus,
                                  pre_oral_defense_feedback: defenseFeedback,
                                  updated_at: new Date().toISOString()
                                })
                                .eq('id', defenseProjectId);
                              if (error) {
                                alert('Failed to update status.');
                                return;
                              }
                              alert('Pre-Oral Defense status updated!');
                              setShowDefenseModal(false);
                              setDefenseProjectId(null);
                              // Optionally refresh details
                              await handleViewDetails(selectedGroup);
                            } catch (err) {
                              alert('Error updating status.');
                            }
                          };
                          const chapterTitles = [
                            'Introduction and Background',
                            'Literature Review', 
                            'Research Methodology',
                            'Results and Discussion',
                            'Conclusion and Recommendation'
                          ]
                          const chapters = [
                            { num: 1, title: chapterTitles[0], completed: project.chapter_1_completed, status: project.chapter_1_status, filename: project.chapter_1_file_name, feedback: project.chapter_1_feedback, content: project.chapter_1_content, submitted_at: project.chapter_1_submitted_at, hasSubmission: !!(project.chapter_1_file_name || project.chapter_1_content) },
                            { num: 2, title: chapterTitles[1], completed: project.chapter_2_completed, status: project.chapter_2_status, filename: project.chapter_2_file_name, feedback: project.chapter_2_feedback, content: project.chapter_2_content, submitted_at: project.chapter_2_submitted_at, hasSubmission: !!(project.chapter_2_file_name || project.chapter_2_content) },
                            { num: 3, title: chapterTitles[2], completed: project.chapter_3_completed, status: project.chapter_3_status, filename: project.chapter_3_file_name, feedback: project.chapter_3_feedback, content: project.chapter_3_content, submitted_at: project.chapter_3_submitted_at, hasSubmission: !!(project.chapter_3_file_name || project.chapter_3_content) },
                            { num: 4, title: chapterTitles[3], completed: project.chapter_4_completed, status: project.chapter_4_status, filename: project.chapter_4_file_name, feedback: project.chapter_4_feedback, content: project.chapter_4_content, submitted_at: project.chapter_4_submitted_at, hasSubmission: !!(project.chapter_4_file_name || project.chapter_4_content) },
                            { num: 5, title: chapterTitles[4], completed: project.chapter_5_completed, status: project.chapter_5_status, filename: project.chapter_5_file_name, feedback: project.chapter_5_feedback, content: project.chapter_5_content, submitted_at: project.chapter_5_submitted_at, hasSubmission: !!(project.chapter_5_file_name || project.chapter_5_content) }
                          ]

                          // ...existing code...
                          const currentChapter = chapters.find(ch => !ch.completed && (ch.status === 'in_progress' || ch.hasSubmission)) || chapters.find(ch => !ch.completed) || null;

                          // Restriction logic for chapters 4 and 5
                          const canEditChapters4And5 = project.pre_oral_defense_status === 'Passed';

                          return (
                            <div key={idx} className="bg-white border rounded-lg p-6">
                              {/* Adviser workflow: Defense Status UI */}
                              <div className="mb-4 flex items-center gap-3">
                                <Badge className={
                                  project.pre_oral_defense_status === 'Passed' ? 'bg-green-100 text-green-800' :
                                  project.pre_oral_defense_status === 'Failed' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }>
                                  Pre-Oral Defense: {project.pre_oral_defense_status || 'Not Started'}
                                </Badge>
                                <Button size="sm" variant="outline" onClick={handleOpenDefenseModal}>
                                  Update Status
                                </Button>
                              </div>
                              {/* Show feedback if available */}
                              {project.pre_oral_defense_feedback && (
                                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                                  <div className="flex items-start gap-2">
                                    <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                                    <div>
                                      <p className="text-sm font-medium text-blue-800 mb-1">Pre-Oral Defense Feedback:</p>
                                      <p className="text-sm text-blue-700">{project.pre_oral_defense_feedback}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {/* Modal for updating defense status (only one at a time) */}
                              {showDefenseModal && defenseProjectId === project.id && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                                  <div className="bg-white rounded-lg max-w-md w-full p-6">
                                    <h3 className="text-lg font-bold mb-4">Update Pre-Oral Defense Status</h3>
                                    <div className="mb-3">
                                      <label className="block text-sm font-medium mb-1">Status</label>
                                      <select
                                        value={defenseStatus}
                                        onChange={e => setDefenseStatus(e.target.value)}
                                        className="w-full p-2 border rounded"
                                      >
                                        <option value="Not Started">Not Started</option>
                                        <option value="Passed">Passed</option>
                                        <option value="Failed">Failed</option>
                                      </select>
                                    </div>
                                    <div className="mb-3">
                                      <label className="block text-sm font-medium mb-1">Feedback (optional)</label>
                                      <textarea
                                        value={defenseFeedback}
                                        onChange={e => setDefenseFeedback(e.target.value)}
                                        className="w-full p-2 border rounded"
                                        placeholder="Provide feedback for the group..."
                                      />
                                    </div>
                                    <div className="flex justify-end gap-2 mt-4">
                                      <Button variant="outline" onClick={() => { setShowDefenseModal(false); setDefenseProjectId(null); }}>Cancel</Button>
                                      <Button onClick={handleSubmitDefenseStatus} className="bg-blue-600 hover:bg-blue-700 text-white">Update</Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="mb-6">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{project.title}</h4>
                                    <p className="text-sm text-gray-600">{project.description}</p>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                      <span>Category: {project.category}</span>
                                      <span>Overall Progress: {project.progress}%</span>
                                    </div>
                                  </div>
                                  {currentChapter && (
                                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                      Currently on Chapter {currentChapter.num}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Chapter List - Similar to Student View */}
                              <div className="space-y-3">
                                {chapters.map((chapter) => {
                                  // Restrict chapter 4-5 editing/uploading unless defense status is Passed
                                  const isRestricted = (chapter.num === 4 || chapter.num === 5) && !canEditChapters4And5;
                                  return (
                                    <div key={chapter.num} className="border border-gray-200 rounded-lg p-4">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                            chapter.action === 'Completed' ? 'bg-green-500 text-white' :
                                            chapter.action === 'Revise' ? 'bg-yellow-500 text-white' :
                                            chapter.action === 'Needs Work' ? 'bg-red-500 text-white' :
                                            chapter.completed && chapter.status !== 'pending_review' ? 'bg-green-500 text-white' : 
                                            chapter.status === 'pending_review' ? 'bg-yellow-500 text-white' :
                                            chapter.status === 'in_progress' ? 'bg-blue-500 text-white' :
                                            'bg-gray-300 text-gray-600'
                                          }`}>
                                            {chapter.action === 'Completed' ? '✓' :
                                             chapter.action === 'Revise' ? '!' :
                                             chapter.action === 'Needs Work' ? '!' :
                                             chapter.completed && chapter.status !== 'pending_review' ? '✓' : 
                                             chapter.status === 'pending_review' ? '⏳' :
                                             chapter.num}
                                          </div>
                                          <div className="flex-1">
                                            <h5 className="font-medium text-gray-900">
                                              Chapter {chapter.num}: {chapter.title}
                                            </h5>
                                            {chapter.filename && (
                                              <p className="text-sm text-blue-600 mt-1">
                                                📄 File: {chapter.filename}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                          {/* Removed chapter status/action badge as requested */}
                                          {chapter.hasSubmission && !isRestricted && (
                                            <>
                                              <Badge className={
                                                (chapter.status === 'Completed') ? 'bg-green-100 text-green-800' :
                                                (chapter.status === 'To Revise') ? 'bg-yellow-100 text-yellow-800' :
                                                (chapter.status === 'Needs Work') ? 'bg-red-100 text-red-800' :
                                                (!chapter.status || chapter.status === 'Pending') ? 'bg-gray-100 text-gray-800' :
                                                (chapter.status === 'In Progress') ? 'bg-blue-100 text-blue-800' :
                                                (chapter.status === 'Pending Review') ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                              }>
                                                {chapter.status ? chapter.status : 'Pending'}
                                              </Badge>
                                              <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => handleViewChapter(chapter, project)}
                                              >
                                                <Eye className="w-3 h-3 mr-1" />
                                                View
                                              </Button>
                                            </>
                                          )}
                                          {chapter.hasSubmission && !isRestricted && (
                                            <Button 
                                              size="sm" 
                                              variant="outline"
                                              onClick={() => handleDownloadChapter(chapter, project)}
                                            >
                                              <Download className="w-3 h-3 mr-1" />
                                              Download
                                            </Button>
                                          )}
                                          {chapter.hasSubmission && !isRestricted && (
                                            <Button 
                                              size="sm" 
                                              className="bg-blue-600 hover:bg-blue-700 text-white"
                                              onClick={() => handleGiveChapterFeedback(chapter, project)}
                                            >
                                              <MessageSquare className="w-3 h-3 mr-1" />
                                              Give Feedback
                                            </Button>
                                          )}
                                          {/* If restricted, show info badge */}
                                          {isRestricted && (
                                            <Badge className="bg-gray-100 text-gray-600 border-gray-200">
                                              Pre-Oral Defense Required
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      {/* ...existing code... */}
                                      <div className="mt-3 ml-12">
                                        <div className="bg-blue-50 border border-blue-200 rounded p-3">
                                          <div className="flex items-start justify-between">
                                            <div className="flex items-start space-x-2 flex-1">
                                              <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5" />
                                              <div className="flex-1">
                                                <p className="text-sm font-medium text-blue-800">Your Feedback:</p>
                                                <p className="text-sm text-blue-700 mt-1">
                                                  {chapter.feedback || 'No feedback provided yet'}
                                                </p>
                                                {chapter.feedback && (
                                                  <p className="text-xs text-blue-600 mt-2">
                                                    Last updated: {new Date().toLocaleDateString()}
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                            {chapter.feedback && !isRestricted && (
                                              <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className="text-blue-600 hover:bg-blue-100"
                                                onClick={() => handleGiveChapterFeedback(chapter, project)}
                                              >
                                                <Edit className="w-3 h-3 mr-1" />
                                                Edit
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="mt-3 ml-12 text-xs text-gray-500">
                                        <span>Status: {(chapter.status && chapter.status !== "") ? chapter.status : "Pending Review"}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">No research projects created yet.</p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-600 py-8">No detailed information available.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Send Feedback</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFeedbackModal(false)}
                >
                  ×
                </Button>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Send feedback to <strong>{selectedGroup.name}</strong>
              </p>
              
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Enter your feedback here..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <div className="flex justify-end space-x-3 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowFeedbackModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitFeedback}
                  disabled={!feedbackText.trim()}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Feedback
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chapter Content View Modal */}
      {showChapterModal && selectedChapter && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Chapter {selectedChapter.num}: {selectedChapter.title}
                  </h2>
                  <p className="text-gray-600">{selectedProject.title}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChapterModal(false)}
                >
                  ×
                </Button>
              </div>
            </div>
            
            <div className="p-6">
              {selectedChapter.filename && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    📄 File: {selectedChapter.filename}
                  </p>
                </div>
              )}
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Chapter Content</h3>
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                    {selectedChapter.content || 'No content available'}
                  </pre>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadChapter(selectedChapter, selectedProject)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  onClick={() => {
                    setShowChapterModal(false)
                    handleGiveChapterFeedback(selectedChapter, selectedProject)
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Give Feedback
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chapter Feedback Modal */}
      {showChapterFeedbackModal && selectedChapter && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Chapter Feedback</h2>
                  <p className="text-gray-600">
                    Chapter {selectedChapter.num}: {selectedChapter.title}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChapterFeedbackModal(false)}
                >
                  ×
                </Button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Feedback
                </label>
                <textarea
                  value={chapterFeedbackText}
                  onChange={(e) => setChapterFeedbackText(e.target.value)}
                  placeholder="Provide detailed feedback on this chapter..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none h-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={chapterStatus}
                  onChange={e => setChapterStatus(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select status</option>
                  <option value="Completed">Completed</option>
                  <option value="To Revise">To Revise</option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Not Started">Not Started</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowChapterFeedbackModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitChapterFeedback}
                  disabled={!chapterFeedbackText.trim() || !chapterStatus}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Submit Feedback
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProgressMonitoring
