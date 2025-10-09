"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Users, Settings, UserCheck, TrendingUp, Loader2 } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { supabase } from "../../../supabase/client"

const AdviserDashboard = () => {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(null)
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [assignedGroups, setAssignedGroups] = useState([])
  const [recentActivities, setRecentActivities] = useState([])
  const [analyticsData, setAnalyticsData] = useState([])
  const [groupProjects, setGroupProjects] = useState([])
  
  // Analytics data states
  const [viewRange, setViewRange] = useState(7)
  const [analytics7, setAnalytics7] = useState([])
  const [analytics30, setAnalytics30] = useState([])
  const [analytics180, setAnalytics180] = useState([])

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

  // Fetch dashboard data
  useEffect(() => {
    if (currentUser) {
      fetchDashboardData()
    }
  }, [currentUser])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      if (!currentUser) return

      // Get assigned groups with leader info only
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
      } else {
        setAssignedGroups(assignedGroupsData || [])
      }

      // Get research proposals and projects for comprehensive data
      const groupIds = (assignedGroupsData || []).map(assignment => assignment.group_id)
      let pendingReviews = 0
      let avgProgress = 0
      let groupProjectsData = []
      let recentActivitiesData = []
      // If you need leader info, fetch user by created_by
      const leaderIds = (assignedGroupsData || []).map(assignment => assignment.student_groups.created_by).filter(Boolean)
      if (groupIds.length > 0) {

        // Get research proposals
        const { data: proposalsData, error: proposalsError } = await supabase
          .from('research_proposals')
          .select('*')
          .or(`group_id.in.(${groupIds.join(',')}),student_id.in.(${leaderIds.join(',')})`)
          .order('submitted_at', { ascending: false })

        // Get research projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('research_projects')
          .select('*')
          .or(`group_id.in.(${groupIds.join(',')}),student_id.in.(${leaderIds.join(',')})`)
          .order('updated_at', { ascending: false })

        // Get user details for better display
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, firstName, lastName, email')
          .in('id', leaderIds)

        if (!proposalsError && proposalsData) {
          pendingReviews = proposalsData.filter(p => p.status === 'pending' || p.status === 'under_review').length
          
          // Prepare recent activities from proposals
          proposalsData.slice(0, 5).forEach(proposal => {
            const user = usersData?.find(u => u.id === proposal.student_id)
            const group = assignedGroupsData.find(ag => ag.group_id === proposal.group_id)
            
            recentActivitiesData.push({
              title: `Research Proposal: ${proposal.title}`,
              student: user ? `${user.firstName} ${user.lastName}` : 'Unknown Student',
              group: group ? group.student_groups.group_name : 'Individual Project',
              date: proposal.submitted_at,
              status: proposal.status,
              type: 'proposal'
            })
          })
        }

        if (!projectsError && projectsData) {
          // Calculate group projects with real progress
          assignedGroupsData.forEach(assignment => {
            const group = assignment.student_groups
            const groupProjects = projectsData.filter(p => 
              p.group_id === group.id || 
              group.student_group_members?.some(m => m.student_id === p.student_id)
            )
            
            let totalProgress = 0
            let projectCount = groupProjects.length
            
            if (projectCount > 0) {
              groupProjects.forEach(project => {
                totalProgress += project.progress || 0
              })
              totalProgress = Math.round(totalProgress / projectCount)
            }

            // Find group leader
            const leaderMember = group.student_group_members?.find(m => m.is_leader)
            const leaderUser = usersData?.find(u => u.id === leaderMember?.student_id)

            groupProjectsData.push({
              id: group.id,
              title: group.group_name,
              progress: totalProgress,
              student: leaderUser ? `${leaderUser.firstName} ${leaderUser.lastName}` : 'No Leader',
              memberCount: group.student_group_members?.length || 0,
              status: totalProgress >= 80 ? 'on_track' : totalProgress >= 50 ? 'needs_attention' : 'behind',
              researchFocus: group.research_focus,
              projects: groupProjects
            })
          })

          // Add project activities to recent activities
          projectsData.slice(0, 3).forEach(project => {
            const user = usersData?.find(u => u.id === project.student_id)
            const group = assignedGroupsData.find(ag => ag.group_id === project.group_id)
            
            recentActivitiesData.push({
              title: `Project Update: ${project.title}`,
              student: user ? `${user.firstName} ${user.lastName}` : 'Unknown Student',
              group: group ? group.student_groups.group_name : 'Individual Project',
              date: project.updated_at,
              status: project.status,
              type: 'project'
            })
          })

          // Calculate overall average progress
          if (projectsData.length > 0) {
            avgProgress = Math.round(projectsData.reduce((sum, p) => sum + (p.progress || 0), 0) / projectsData.length)
          }
        }

        // Sort recent activities by date
        recentActivitiesData.sort((a, b) => new Date(b.date) - new Date(a.date))
      }

      // Set analytics data for all ranges
  await fetchAnalyticsData(groupIds, leaderIds)

      // Set all the state data
      setGroupProjects(groupProjectsData)
      setRecentActivities(recentActivitiesData.slice(0, 8))

      // Set stats with real data
      const calculatedStats = [
        {
          title: "Assigned Groups",
          value: assignedGroupsData?.length?.toString() || "0",
          icon: Users,
          change: "Active groups",
          changeType: "neutral",
        },
        {
          title: "Pending Reviews",
          value: pendingReviews.toString(),
          icon: FileText,
          change: "Awaiting review",
          changeType: pendingReviews > 0 ? "positive" : "neutral",
        },
        {
          title: "Average Progress",
          value: `${avgProgress}%`,
          icon: TrendingUp,
          change: avgProgress > 70 ? "Good progress" : "Needs attention",
          changeType: avgProgress > 70 ? "positive" : avgProgress > 40 ? "neutral" : "negative",
        },
        {
          title: "Total Students",
          value: (assignedGroupsData || []).reduce((total, assignment) => 
            total + (assignment.student_groups.student_group_members?.length || 0), 0).toString(),
          icon: UserCheck,
          change: "Under supervision",
          changeType: "neutral",
        },
      ]

      setStats(calculatedStats)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch analytics for different time ranges
  const fetchAnalyticsData = async (groupIds, leaderIds) => {
    if (!groupIds || !groupIds.length || !leaderIds || leaderIds.length === 0) {
      // Set default empty data for all ranges
      setAnalytics7([])
      setAnalytics30([])
      setAnalytics180([])
      return
    }
    
    const fetchAnalytics = async (range, setter) => {
      try {
        const { data: projectsData, error } = await supabase
          .from('research_projects')
          .select('progress, updated_at, created_at')
          .or(`group_id.in.(${groupIds.join(',')}),student_id.in.(${leaderIds.join(',')})`)
          
        if (!error && projectsData) {
          if (range === 30) {
            // Group by week (4 weeks for 1 month)
            const today = new Date()
            const weekRanges = []
            for (let i = 0; i < 4; i++) {
              const start = new Date(today)
              start.setDate(today.getDate() - (29 - i * 7))
              const end = new Date(today)
              end.setDate(today.getDate() - (29 - (i + 1) * 7) + 6)
              if (end > today) end.setTime(today.getTime())
              weekRanges.push({
                label: `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
                start,
                end,
                totalProgress: 0,
                projectCount: 0
              })
            }
            
            projectsData.forEach(project => {
              const updated = new Date(project.updated_at)
              for (let i = 0; i < weekRanges.length; i++) {
                if (updated >= weekRanges[i].start && updated <= weekRanges[i].end) {
                  weekRanges[i].totalProgress += project.progress || 0
                  weekRanges[i].projectCount++
                  break
                }
              }
            })
            
            setter(weekRanges.map(w => ({ 
              week: w.label, 
              progress: w.projectCount > 0 ? Math.round(w.totalProgress / w.projectCount) : 0 
            })))
          } else if (range === 180) {
            // Group by month (6 months)
            const months = []
            const today = new Date()
            for (let i = 5; i >= 0; i--) {
              const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
              months.push({
                month: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                year: d.getFullYear(),
                monthNum: d.getMonth(),
                totalProgress: 0,
                projectCount: 0
              })
            }
            
            projectsData.forEach(project => {
              const updated = new Date(project.updated_at)
              const idx = months.findIndex(m => updated.getFullYear() === m.year && updated.getMonth() === m.monthNum)
              if (idx !== -1) {
                months[idx].totalProgress += project.progress || 0
                months[idx].projectCount++
              }
            })
            
            setter(months.map(m => ({
              month: m.month,
              progress: m.projectCount > 0 ? Math.round(m.totalProgress / m.projectCount) : 0
            })))
          } else {
            // Group by day (7 days)
            const days = []
            for (let i = 0; i < range; i++) {
              const d = new Date()
              d.setDate(d.getDate() - (range - 1 - i))
              days.push({
                day: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                date: d.toISOString().slice(0, 10),
                totalProgress: 0,
                projectCount: 0
              })
            }
            
            projectsData.forEach(project => {
              const dateStr = project.updated_at.slice(0, 10)
              const idx = days.findIndex(d => d.date === dateStr)
              if (idx !== -1) {
                days[idx].totalProgress += project.progress || 0
                days[idx].projectCount++
              }
            })
            
            setter(days.map(d => ({
              day: d.day,
              progress: d.projectCount > 0 ? Math.round(d.totalProgress / d.projectCount) : 0
            })))
          }
        }
      } catch (error) {
        console.error(`Error fetching ${range}-day analytics:`, error)
        setter([])
      }
    }
    
    await Promise.all([
      fetchAnalytics(7, setAnalytics7),
      fetchAnalytics(30, setAnalytics30),
      fetchAnalytics(180, setAnalytics180)
    ])
  }

  // Update current analytics data when range changes
  useEffect(() => {
    if (viewRange === 7) setAnalyticsData(analytics7)
    else if (viewRange === 30) setAnalyticsData(analytics30)
    else if (viewRange === 180) setAnalyticsData(analytics180)
  }, [viewRange, analytics7, analytics30, analytics180])

  if (!currentUser) {
    return (
      <div className="space-y-6">
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg">
          Please log in to view your dashboard.
        </div>
      </div>
    )
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { variant: "default", className: "bg-green-100 text-green-800 hover:bg-green-100" },
      pending: { variant: "secondary", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
      under_review: { variant: "outline", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
      on_track: { variant: "default", className: "bg-green-100 text-green-800 hover:bg-green-100" },
      needs_attention: { variant: "secondary", className: "bg-orange-100 text-orange-800 hover:bg-orange-100" },
    }

    return statusConfig[status] || statusConfig.pending
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back, Adviser 👨‍🏫</h1>
            <p className="text-gray-600">Monitor your assigned groups and provide guidance</p>
          </div>
          <Button
            className="ml-4 px-5 py-2 rounded-lg border border-blue-600 text-blue-600 bg-transparent shadow-sm hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            onClick={() => alert("Progress report generated!")}
          >
            Generate Progress Report
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p
                      className={`text-sm mt-1 ${
                        stat.changeType === "positive"
                          ? "text-green-600"
                          : stat.changeType === "negative"
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {stat.change} from last month
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Progress Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groupProjects.map((group, index) => (
          <Card key={group.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{group.title}</h3>
                  <p className="text-sm text-gray-500 truncate">{group.student}</p>
                </div>
                <div className="flex-shrink-0">
                  <div className="relative w-16 h-16">
                    <svg className="transform -rotate-90 w-16 h-16">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="#e5e7eb"
                        strokeWidth="4"
                        fill="none"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke={group.progress >= 80 ? "#10b981" : group.progress >= 50 ? "#3b82f6" : "#ef4444"}
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${group.progress * 1.76} 176`}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-semibold text-gray-900">
                        {group.progress}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Status:</span>
                  <Badge
                    variant={group.progress >= 80 ? "default" : group.progress >= 50 ? "secondary" : "destructive"}
                    className={
                      group.progress >= 80 
                        ? "bg-green-100 text-green-800" 
                        : group.progress >= 50 
                          ? "bg-blue-100 text-blue-800"
                          : "bg-red-100 text-red-800"
                    }
                  >
                    {group.progress >= 80 ? "On Track" : group.progress >= 50 ? "In Progress" : "Needs Attention"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Members:</span>
                  <span className="font-medium">{group.memberCount}</span>
                </div>
                {group.researchFocus && (
                  <div className="text-xs text-gray-500 mt-2 truncate">
                    <span className="font-medium">Focus:</span> {group.researchFocus}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              className="h-12 justify-start bg-transparent" 
              variant="outline"
              onClick={() => navigate('/adviser/proposals')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Review Proposals
            </Button>
            <Button className="h-12 justify-start bg-transparent" variant="outline">
              <Users className="w-4 h-4 mr-2" />
              View Groups
            </Button>
            <Button className="h-12 justify-start bg-transparent" variant="outline">
              <UserCheck className="w-4 h-4 mr-2" />
              Provide Feedback
            </Button>
            <Button className="h-12 justify-start bg-transparent" variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Groups Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Assigned Groups</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Group Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Progress</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Team Leader</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Members</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-4 px-4">
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        <span className="text-gray-600">Loading groups...</span>
                      </div>
                    </td>
                  </tr>
                ) : groupProjects.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-4 px-4 text-center text-gray-500">
                      No groups assigned yet
                    </td>
                  </tr>
                ) : (
                  groupProjects.map((group, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900 max-w-xs truncate">{group.title}</div>
                      <div className="text-sm text-gray-500 truncate">{group.researchFocus || 'No focus specified'}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className={`h-2 rounded-full ${
                              group.progress >= 80 ? 'bg-green-600' : 
                              group.progress >= 50 ? 'bg-blue-600' : 'bg-red-600'
                            }`}
                            style={{ width: `${group.progress}%` }}
                          ></div>
                        </div>
                        <span className="font-medium text-gray-900">{group.progress}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{group.student}</td>
                    <td className="py-4 px-4 text-gray-600">{group.memberCount} members</td>
                    <td className="py-4 px-4">
                      <Badge
                        variant={getStatusBadge(group.status).variant}
                        className={getStatusBadge(group.status).className}
                      >
                        {group.status.replace("_", " ")}
                      </Badge>
                    </td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Group Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Activity</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Group</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.map((activity, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900 max-w-xs truncate">{activity.title}</div>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{activity.student}</td>
                    <td className="py-4 px-4 text-gray-600">
                      {new Date(activity.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-4 px-4">
                      <Badge
                        variant={getStatusBadge(activity.status).variant}
                        className={getStatusBadge(activity.status).className}
                      >
                        {activity.status.replace("_", " ")}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdviserDashboard
