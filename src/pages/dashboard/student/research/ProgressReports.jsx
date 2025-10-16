"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Presentation, 
  FileText, 
  Calendar, 
  TrendingUp, 
  BarChart3, 
  Plus, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  BookOpen
} from "lucide-react"
import { supabase } from "../../../../supabase/client"

const ProgressReports = () => {
  const [currentUser, setCurrentUser] = useState(null)
  const [myProjects, setMyProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  // ...existing code...

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
              role: 'student'
            })
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        setError("Failed to load user information")
      }
    }

    getCurrentUser()
  }, [])

  // Fetch user's research projects and progress
  useEffect(() => {
    if (currentUser) {
      fetchMyProjects()
    }
  }, [currentUser])

  const fetchMyProjects = async () => {
    try {
      setLoading(true)
      
      if (!currentUser) {
        setMyProjects([])
        return
      }

      // Get research proposals submitted by the user (individual projects)
      const { data: individualProposals, error: proposalsError } = await supabase
        .from('research_proposals')
        .select('*')
        .eq('student_id', currentUser.uid)

      if (proposalsError) {
        console.error('Error fetching individual proposals:', proposalsError)
      }

      // Only handle individual projects
      const allProjects = []
      if (individualProposals) {
        individualProposals.forEach(proposal => {
          allProjects.push({
            id: proposal.id,
            title: proposal.title,
            type: 'individual',
            status: proposal.status,
            progress: calculateProgress(proposal.status),
            submittedAt: proposal.submitted_at,
            lastUpdate: proposal.updated_at || proposal.submitted_at,
            description: proposal.description,
            category: proposal.category,
            proposal: proposal
          })
        })
      }
      allProjects.sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate))
      setMyProjects(allProjects)
    } catch (error) {
      console.error('Error in fetchMyProjects:', error)
      setError("Failed to load your projects")
    } finally {
      setLoading(false)
    }
  }

  const calculateProgress = (status) => {
    switch (status) {
      case 'pending': return 25
      case 'under_review': return 50
      case 'approved': return 100
      case 'rejected': return 10
      default: return 0
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "Pending Review" },
      under_review: { color: "bg-blue-100 text-blue-800", icon: BookOpen, label: "Under Review" },
      approved: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Approved" },
      rejected: { color: "bg-red-100 text-red-800", icon: AlertTriangle, label: "Needs Revision" }
    }
    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Calculate summary statistics
  const totalProjects = myProjects.length
  const approvedProjects = myProjects.filter(p => p.status === 'approved').length
  const pendingProjects = myProjects.filter(p => p.status === 'pending' || p.status === 'under_review').length
  const avgProgress = totalProjects > 0 ? Math.round(myProjects.reduce((sum, p) => sum + p.progress, 0) / totalProjects) : 0

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg">
          Please log in to view your progress reports.
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border mb-4 sm:mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Presentation className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
              <span className="line-clamp-1">My Progress Reports 📊</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-600">Track your research project progress and milestones</p>
          </div>
          <Button 
            onClick={() => window.location.href = '#/dashboard/student/research/submit'}
            className="w-full sm:w-auto"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="sm:inline">Submit New Research</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-3 sm:px-4 py-3 rounded-lg mb-4 sm:mb-6">
          <AlertTriangle className="w-4 h-4 inline mr-2 flex-shrink-0" />
          <span className="text-sm sm:text-base">{error}</span>
        </div>
      )}

      {/* Progress Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <Card className="bg-white border shadow-sm">
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">{totalProjects}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-blue-100 text-blue-600 self-end sm:self-auto">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm">
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Approved</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">{approvedProjects}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-green-100 text-green-600 self-end sm:self-auto">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm">
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">{pendingProjects}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-yellow-100 text-yellow-600 self-end sm:self-auto">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm">
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Avg Progress</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">{avgProgress}%</p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-purple-100 text-purple-600 self-end sm:self-auto">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <div className="space-y-4 sm:space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin mr-2" />
            <span className="text-sm sm:text-base text-gray-600">Loading your projects...</span>
          </div>
        ) : myProjects.length === 0 ? (
          <Card className="text-center py-8 sm:py-12">
            <CardContent className="p-4 sm:p-6">
              <BarChart3 className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                No Projects Yet
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto">
                You haven't submitted any research projects yet. Start by submitting your first research proposal.
              </p>
              <Button 
                onClick={() => window.location.href = '#/dashboard/student/research/submit'}
                size="sm"
                className="w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span>Submit Your First Research</span>
              </Button>
            </CardContent>
          </Card>
        ) : (
          myProjects.map((project) => (
            <Card key={project.id} className="bg-white border shadow-sm">
              <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 mb-2 flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="line-clamp-2 sm:line-clamp-1">{project.title}</span>
                      <Badge className="bg-gray-100 text-gray-800 self-start sm:self-auto text-xs">Individual</Badge>
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                        <span>Submitted {formatDate(project.submittedAt)}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                        <span>Updated {formatDate(project.lastUpdate)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 sm:flex-shrink-0">
                    {getStatusBadge(project.status)}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 px-4 sm:px-6 pb-4 sm:pb-6">
                {/* Progress Bar */}
                <div className="mb-4 sm:mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-1.5 sm:h-2" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                    <span>Submitted</span>
                    <span className="hidden sm:inline">Under Review</span>
                    <span className="sm:hidden">Review</span>
                    <span>Approved</span>
                  </div>
                </div>

                {/* Project Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-1 sm:mb-2">Category</h4>
                    <p className="text-xs sm:text-sm text-gray-600">{project.category || 'Not specified'}</p>
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-1 sm:mb-2">Status Details</h4>
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 sm:line-clamp-none">
                      {project.status === 'approved' ? 'Your research has been approved and is now available in the repository.' :
                       project.status === 'under_review' ? 'Your research is currently being reviewed by advisers.' :
                       project.status === 'rejected' ? 'Please revise your research based on feedback and resubmit.' :
                       'Your research is pending initial review.'}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button size="sm" variant="outline" className="w-full sm:w-auto">
                    <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    <span className="text-xs sm:text-sm">View Details</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default ProgressReports
