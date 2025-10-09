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
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Presentation className="h-6 w-6 text-blue-600" />
              My Progress Reports 📊
            </h1>
            <p className="text-gray-600">Track your research project progress and milestones</p>
          </div>
          <Button onClick={() => window.location.href = '#/dashboard/student/research/submit'}>
            <Plus className="w-4 h-4 mr-2" />
            Submit New Research
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          {error}
        </div>
      )}

      {/* Progress Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalProjects}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <FileText className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{approvedProjects}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{pendingProjects}</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Progress</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{avgProgress}%</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-gray-600">Loading your projects...</span>
          </div>
        ) : myProjects.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Projects Yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                You haven't submitted any research projects yet. Start by submitting your first research proposal.
              </p>
              <Button onClick={() => window.location.href = '#/dashboard/student/research/submit'}>
                <Plus className="w-4 h-4 mr-2" />
                Submit Your First Research
              </Button>
            </CardContent>
          </Card>
        ) : (
          myProjects.map((project) => (
            <Card key={project.id} className="bg-white border shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                      {project.title}
                      <Badge className="bg-gray-100 text-gray-800">Individual</Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>Submitted {formatDate(project.submittedAt)}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>Updated {formatDate(project.lastUpdate)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(project.status)}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm font-semibold text-gray-900">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Submitted</span>
                    <span>Under Review</span>
                    <span>Approved</span>
                  </div>
                </div>

                {/* Project Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Category</h4>
                    <p className="text-sm text-gray-600">{project.category || 'Not specified'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Status Details</h4>
                    <p className="text-sm text-gray-600">
                      {project.status === 'approved' ? 'Your research has been approved and is now available in the repository.' :
                       project.status === 'under_review' ? 'Your research is currently being reviewed by advisers.' :
                       project.status === 'rejected' ? 'Please revise your research based on feedback and resubmit.' :
                       'Your research is pending initial review.'}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline">
                    <BookOpen className="w-4 h-4 mr-2" />
                    View Details
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
