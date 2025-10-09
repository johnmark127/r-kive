"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp, Users, FileText, Award, Eye, Activity, UserCheck, Loader2 } from "lucide-react"
import { supabase } from "@/supabase/client"

const progressData = [
  { month: "Jan", progress: 65 },
  { month: "Feb", progress: 72 },
  { month: "Mar", progress: 70 },
  { month: "Apr", progress: 78 },
  { month: "May", progress: 85 },
  { month: "Jun", progress: 88 },
]

const uploadsData = [
  { semester: "Fall 2023", uploads: 45 },
  { semester: "Spring 2024", uploads: 52 },
  { semester: "Fall 2024", uploads: 38 },
  { semester: "Spring 2025", uploads: 41 },
]

const completionData = [
  { group: "Computer Science", completion: 95, total: 45 },
  { group: "Information Technology", completion: 87, total: 32 },
  { group: "Engineering", completion: 92, total: 28 },
  { group: "Information Systems", completion: 78, total: 25 },
  { group: "Data Science", completion: 89, total: 18 },
]

const mostViewedPapers = [
  { title: "Smart Home Automation System", views: 1247, author: "John Doe", department: "Computer Science" },
  { title: "Sustainable Energy Management", views: 1089, author: "Jane Smith", department: "Engineering" },
  { title: "Mobile Health Application", views: 967, author: "Mike Johnson", department: "Information Technology" },
  { title: "E-commerce Platform Development", views: 834, author: "Sarah Wilson", department: "Computer Science" },
  { title: "Data Analytics Dashboard", views: 721, author: "David Brown", department: "Information Systems" },
]



const activityLogs = [
  { leader: "Alice Cooper", activity: "Reviewed 5 project proposals", time: "2 hours ago", status: "completed" },
  { leader: "Bob Martinez", activity: "Scheduled group meetings", time: "4 hours ago", status: "completed" },
  { leader: "Carol Davis", activity: "Updated project timeline", time: "6 hours ago", status: "in-progress" },
  { leader: "David Lee", activity: "Submitted progress report", time: "1 day ago", status: "completed" },
]

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalAdvisers: 0,
    totalGroups: 0,
    Librarians: 0
  })
  const [groupsProgress, setGroupsProgress] = useState([])
  const [researchStages, setResearchStages] = useState({
    chapter1: 0,
    chapter2: 0,
    chapter3: 0,
    preOralDefense: 0,
    finalDefense: 0,
    completed: 0
  })
  const [adviserPerformance, setAdviserPerformance] = useState([])

  useEffect(() => {
    fetchStats()
    fetchGroupsProgress()
    fetchResearchStages()
    fetchAdviserPerformance()
  }, [])

  const fetchResearchStages = async () => {
    try {
      // Fetch groups with their research progress stages
      const { data: groupsData } = await supabase
        .from('student_groups')
        .select(`
          id, group_name,
          research_projects (
            progress, status
          )
        `)
        .eq('is_active', true)

      if (groupsData) {
        const stages = {
          chapter1: 0,
          chapter2: 0,
          chapter3: 0,
          preOralDefense: 0,
          finalDefense: 0,
          completed: 0
        }

        groupsData.forEach(group => {
          const projects = group.research_projects || []
          
          if (projects.length > 0) {
            const project = projects[0] // Assuming one main project per group
            const progress = project.progress || 0
            const status = project.status || 'in_progress'

            // Categorize based on progress and status
            if (status === 'completed') {
              stages.completed++
            } else if (progress >= 90 || status === 'final_defense') {
              stages.finalDefense++
            } else if (progress >= 75 || status === 'pre_oral_defense') {
              stages.preOralDefense++
            } else if (progress >= 60) {
              stages.chapter3++
            } else if (progress >= 35) {
              stages.chapter2++
            } else {
              stages.chapter1++
            }
          } else {
            // No projects yet, assume Chapter 1
            stages.chapter1++
          }
        })

        setResearchStages(stages)
      }
    } catch (error) {
      console.error('Error fetching research stages:', error)
      // Set some sample data for demo
      setResearchStages({
        chapter1: 5,
        chapter2: 8,
        chapter3: 4,
        preOralDefense: 3,
        finalDefense: 2,
        completed: 1
      })
    }
  }

  const fetchGroupsProgress = async () => {
    try {
      // Fetch all active groups with their projects and adviser info
      const { data: groupsData } = await supabase
        .from('student_groups')
        .select(`
          id, group_name, research_focus,
          research_projects (
            progress
          )
        `)
        .eq('is_active', true)
        .limit(10)

      if (groupsData) {
        const processedGroups = groupsData.map(group => {
          const projects = group.research_projects || []
          let avgProgress = 0
          if (projects.length > 0) {
            const totalProgress = projects.reduce((sum, project) => sum + (project.progress || 0), 0)
            avgProgress = Math.round(totalProgress / projects.length)
          }
          return {
            group: group.group_name,
            completion: avgProgress,
            total: projects.length,
            focus: group.research_focus,
            adviser: 'Unassigned' // Remove users join, fallback to Unassigned
          }
        })

        setGroupsProgress(processedGroups)
      }
    } catch (error) {
      console.error('Error fetching groups progress:', error)
      // Fallback to static data
      setGroupsProgress([
        { group: "AI Research Team", completion: 85, total: 3 },
        { group: "Web Development Squad", completion: 92, total: 2 },
        { group: "Mobile App Innovators", completion: 78, total: 4 },
        { group: "Data Science Collective", completion: 95, total: 2 },
        { group: "Cybersecurity Unit", completion: 67, total: 1 }
      ])
    }
  }

  const fetchAdviserPerformance = async () => {
    try {
      // Fetch all advisers
      const { data: adviserUsers, error: advisersError } = await supabase
        .from('users')
        .select('id, firstName, lastName, email')
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
          student_groups!inner (
            id,
            group_name,
            research_focus,
            is_active
          )
        `)

      if (assignmentsError) {
        console.error('Error fetching group assignments:', assignmentsError)
      }

      // Fetch research projects with feedback
      const { data: researchProjects, error: projectsError } = await supabase
        .from('research_projects')
        .select(`
          id, 
          group_id, 
          title,
          progress,
          chapter_1_feedback,
          chapter_2_feedback,
          chapter_3_feedback,
          chapter_4_feedback,
          chapter_5_feedback,
          pre_oral_defense_feedback
        `)
        .or('chapter_1_feedback.neq.,chapter_2_feedback.neq.,chapter_3_feedback.neq.,chapter_4_feedback.neq.,chapter_5_feedback.neq.,pre_oral_defense_feedback.neq.')

      if (projectsError) {
        console.error('Error fetching research projects:', projectsError)
      }

      // Process adviser performance data
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

        // Create handledGroups array with real data
        const handledGroups = activeGroups.map(assignment => {
          const groupProjects = researchProjects?.filter(project => 
            project.group_id === assignment.group_id
          ) || []
          
          const avgProgress = groupProjects.length > 0 
            ? Math.round(groupProjects.reduce((sum, project) => sum + (project.progress || 0), 0) / groupProjects.length)
            : 0

          return {
            name: assignment.student_groups.group_name,
            topic: assignment.student_groups.research_focus || "Research Topic Not Specified",
            members: 4, // Estimated since we don't have member count
            progress: avgProgress
          }
        })

        return {
          name: `${adviser.firstName || ''} ${adviser.lastName || ''}`.trim() || adviser.email,
          groups: activeGroups.length,
          feedback: totalFeedbackCount,
          rating: 4.0 + Math.random() * 1, // Placeholder rating
          handledGroups: handledGroups
        }
      }) || []

      setAdviserPerformance(processedAdvisers)
    } catch (error) {
      console.error('Error fetching adviser performance:', error)
      // Fallback to empty array
      setAdviserPerformance([])
    }
  }

  const fetchStats = async () => {
    setLoading(true)
    try {
      // Fetch total students
      const { count: studentsCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student')

      // Fetch total advisers
      const { count: advisersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'adviser')

      // Fetch total groups
      const { count: groupsCount } = await supabase
        .from('student_groups')
        .select('*', { count: 'exact', head: true })

      // Fetch total research papers
      const { count: papersCount } = await supabase
        .from('research_papers')
        .select('*', { count: 'exact', head: true })

      // Fetch total librarians (admin role)
      const { count: librariansCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin')

      setStats({
        totalStudents: studentsCount || 0,
        totalAdvisers: advisersCount || 0,
        totalGroups: groupsCount || 0,
        totalLibrarians: librariansCount || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Super Admin Dashboard 📊</h1>
            <p className="text-gray-600">Comprehensive insights and monitoring for capstone projects</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : stats.totalStudents}
                </p>
                <p className="text-sm mt-1 text-blue-600">Registered users</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Advisers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : stats.totalAdvisers}
                </p>
                <p className="text-sm mt-1 text-green-600">Active faculty</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Groups</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : stats.totalGroups}
                </p>
                <p className="text-sm mt-1 text-purple-600">Student groups</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Librarians</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : stats.totalLibrarians}
                </p>
                <p className="text-sm mt-1 text-orange-600">Admin users</p>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Research Stages Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Research Progress by Academic Stages</CardTitle>
          <p className="text-sm text-gray-600">Track groups by their current research milestone</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-100">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : researchStages.chapter1}
              </div>
              <p className="text-xs font-medium text-red-700">Chapter 1</p>
              <p className="text-xs text-red-600">Introduction</p>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-100">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : researchStages.chapter2}
              </div>
              <p className="text-xs font-medium text-orange-700">Chapter 2</p>
              <p className="text-xs text-orange-600">Literature Review</p>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : researchStages.chapter3}
              </div>
              <p className="text-xs font-medium text-yellow-700">Chapter 3</p>
              <p className="text-xs text-yellow-600">Methodology</p>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : researchStages.preOralDefense}
              </div>
              <p className="text-xs font-medium text-blue-700">Pre-Oral</p>
              <p className="text-xs text-blue-600">Defense Ready</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : researchStages.finalDefense}
              </div>
              <p className="text-xs font-medium text-purple-700">Final Defense</p>
              <p className="text-xs text-purple-600">Ready</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : researchStages.completed}
              </div>
              <p className="text-xs font-medium text-green-700">Completed</p>
              <p className="text-xs text-green-600">Finished</p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Stage Definitions:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
              <div><strong>Chapter 1:</strong> Introduction & Problem Statement (0-35%)</div>
              <div><strong>Chapter 2:</strong> Literature Review & Related Works (35-60%)</div>
              <div><strong>Chapter 3:</strong> Research Methodology (60-75%)</div>
              <div><strong>Pre-Oral Defense:</strong> Ready for preliminary presentation (75-90%)</div>
              <div><strong>Final Defense:</strong> Ready for final presentation (90%+)</div>
              <div><strong>Completed:</strong> Successfully defended and finalized</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Progress of All Groups</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {groupsProgress.map((group, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">{group.group}</h3>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{group.completion}%</div>
                        <div className="text-xs text-gray-500">Progress</div>
                      </div>
                    </div>
                    
                    <Progress value={group.completion} className="h-3" />
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-600">Projects:</span>
                        <span className="font-medium">{group.total}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium">
                          {group.completion >= 90 ? 'Final' : 
                           group.completion >= 75 ? 'Pre-Defense' :
                           group.completion >= 60 ? 'Chapter 3' :
                           group.completion >= 35 ? 'Chapter 2' : 'Chapter 1'}
                        </span>
                      </div>
                    </div>
                    
                    {group.focus && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs font-medium text-gray-700 mb-1">Research Focus:</div>
                        <div className="text-sm text-gray-600">{group.focus}</div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <UserCheck className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-medium text-gray-700">Adviser:</span>
                      </div>
                      <span className="text-sm font-medium text-blue-700">{group.adviser}</span>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="text-xs text-gray-500">
                        Last updated: {new Date().toLocaleDateString()}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        group.completion >= 75 ? 'bg-green-100 text-green-700' :
                        group.completion >= 50 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {group.completion >= 75 ? 'On Track' :
                         group.completion >= 50 ? 'In Progress' : 'Needs Attention'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {groupsProgress.length === 0 && !loading && (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-400 mb-2">
                  <Users className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No active groups found</h3>
                <p className="text-gray-500">Groups will appear here once they are created and activated.</p>
              </div>
            )}
            
            {loading && (
              <div className="col-span-full text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Loading groups...</h3>
                <p className="text-gray-500">Please wait while we fetch the latest group data.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Adviser Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {adviserPerformance.map((adviser, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <Users className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{adviser.name}</p>
                      <p className="text-xs text-gray-600">
                        {adviser.feedback} feedback responses given
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs font-medium"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View Groups ({adviser.groups})
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-semibold">
                            Groups Handled by {adviser.name}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          {adviser.handledGroups?.map((group, groupIndex) => (
                            <div
                              key={groupIndex}
                              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                      <Users className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-gray-900">{group.name}</h4>
                                      <p className="text-sm text-gray-600">{group.topic}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between mt-3">
                                    <div className="flex items-center space-x-4">
                                      <Badge variant="outline" className="text-xs">
                                        {group.members} members
                                      </Badge>
                                      <span className="text-sm text-gray-500">
                                        Progress: {group.progress}%
                                      </span>
                                    </div>
                                    <div className="w-24">
                                      <Progress value={group.progress} className="h-2" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          {(!adviser.handledGroups || adviser.handledGroups.length === 0) && (
                            <div className="text-center py-8 text-gray-500">
                              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                              <p>No groups assigned yet</p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Student Leader Activity Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activityLogs.map((log, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <Activity className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{log.leader}</p>
                      <p className="text-xs text-gray-600">{log.activity}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-500">{log.time}</span>
                    <Badge
                      variant={log.status === "completed" ? "default" : "secondary"}
                      className={
                        log.status === "completed"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                      }
                    >
                      {log.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
