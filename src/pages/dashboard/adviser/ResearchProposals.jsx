"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  FileText, 
  Search, 
  Calendar, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock,
  Download,
  MessageSquare,
  User,
  Users,
  Lightbulb,
  Filter,
  RefreshCw,
  ArrowLeft,
  Loader2,
  BarChart3
} from "lucide-react"
import { supabase } from "../../../supabase/client"
import StudentPDFViewer from "../../../components/StudentPDFViewer"

const ReviewSubmissions = () => {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reviewComment, setReviewComment] = useState("")
  const [reviewStatus, setReviewStatus] = useState("")
  const [submittingReview, setSubmittingReview] = useState(false)
  
  // PDF Viewer states
  const [showPDFViewer, setShowPDFViewer] = useState(false)
  const [pdfFileUrl, setPdfFileUrl] = useState(null)
  const [pdfFileName, setPdfFileName] = useState(null)

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

  // Fetch submissions for review
  useEffect(() => {
    if (currentUser) {
      fetchSubmissions()
    }
  }, [currentUser])

  // ...existing code...

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      
      if (!currentUser) return

      // First, get the groups assigned to this adviser
      const { data: assignedGroupsData, error: groupError } = await supabase
        .from('adviser_group_assignments')
        .select(`
          group_id,
          student_groups!inner (
            id,
            group_name,
            created_by
          )
        `)
        .eq('adviser_id', currentUser.uid)
        .eq('student_groups.is_active', true)

      if (groupError) {
        console.error('Error fetching assigned groups:', groupError)
        setSubmissions([])
        return
      }

      // If no groups are assigned to this adviser, show empty list
      if (!assignedGroupsData || assignedGroupsData.length === 0) {
        setSubmissions([])
        return
      }

      // Get the group IDs and student leader IDs
      const groupIds = assignedGroupsData.map(assignment => assignment.group_id)
      const leaderIds = assignedGroupsData.map(assignment => assignment.student_groups.created_by).filter(Boolean)

      // Fetch research proposals from assigned groups and their leaders
      const { data, error } = await supabase
        .from('research_proposals')
        .select('*')
        .or(`group_id.in.(${groupIds.join(',')}),student_id.in.(${leaderIds.join(',')})`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching proposals:', error)
        setSubmissions([])
      } else {
        // Get user details for better display
        const allStudentIds = [...new Set([...leaderIds, ...(data || []).map(p => p.student_id).filter(Boolean)])]
        
        let usersData = []
        if (allStudentIds.length > 0) {
          const { data: userData, error: usersError } = await supabase
            .from('users')
            .select('id, firstName, lastName, email')
            .in('id', allStudentIds)

          if (!usersError) {
            usersData = userData || []
          }
        }

        // Add type and submission_date for compatibility with UI
        // Also include student name and group info
        const proposals = (data || []).map(p => {
          const student = usersData.find(s => s.id === p.student_id)
          const studentName = student 
            ? `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.email
            : p.student_name || p.student_email

          // Find the group this proposal belongs to
          const group = assignedGroupsData.find(ag => ag.group_id === p.group_id)
          const groupName = group ? group.student_groups.group_name : 'Individual Project'
          
          return {
            ...p,
            type: 'proposal',
            submission_date: p.created_at,
            student_name: studentName,
            group_name: groupName,
          }
        })
        setSubmissions(proposals)
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = (status) => {
    switch (status) {
      case "approved":
        return {
          color: "bg-green-100 text-green-800",
          icon: CheckCircle,
          text: "Approved"
        }
      case "pending":
        return {
          color: "bg-yellow-100 text-yellow-800",
          icon: Clock,
          text: "Pending Review"
        }
      case "revision_required":
        return {
          color: "bg-orange-100 text-orange-800",
          icon: AlertCircle,
          text: "Revision Required"
        }
      case "rejected":
        return {
          color: "bg-red-100 text-red-800",
          icon: XCircle,
          text: "Rejected"
        }
      default:
        return {
          color: "bg-gray-100 text-gray-800",
          icon: Clock,
          text: "Under Review"
        }
    }
  }

  const getTypeConfig = (type) => {
    switch (type) {
      case "proposal":
        return {
          color: "bg-blue-100 text-blue-800",
          icon: Lightbulb,
          text: "Research Proposal"
        }
      case "progress_report":
        return {
          color: "bg-purple-100 text-purple-800",
          icon: BarChart3,
          text: "Progress Report"
        }
      default:
        return {
          color: "bg-gray-100 text-gray-800",
          icon: FileText,
          text: "Submission"
        }
    }
  }

  const handleReview = (submission) => {
  setSelectedSubmission(submission)
  setReviewComment(submission.reviewer_comments || "")
  setReviewStatus(submission.status || "pending")
  setReviewModalOpen(true)
  }

  const submitReview = async () => {
    if (!selectedSubmission || !reviewComment.trim()) return

    setSubmittingReview(true)
    try {
      const table = selectedSubmission.type === 'proposal' ? 'research_proposals' : 'research_projects'
      
      const { error } = await supabase
        .from(table)
        .update({
          status: reviewStatus,
          reviewer_comments: reviewComment.trim(),
          reviewed_at: new Date().toISOString(),
          reviewer_id: currentUser.uid
        })
        .eq('id', selectedSubmission.id)

      if (error) {
        throw error
      }

      // If accepted, create a project
      if (reviewStatus === "approved" && selectedSubmission.type === "proposal") {
        // Create project with required and default fields
        const now = new Date().toISOString();
        const projectData = {
          title: selectedSubmission.title,
          description: selectedSubmission.description,
          category: selectedSubmission.category,
          research_topic: selectedSubmission.research_topic,
          student_id: selectedSubmission.student_id,
          student_email: selectedSubmission.student_email,
          proposal_id: selectedSubmission.id,
          status: "planning",
          progress: 0,
          start_date: now,
          created_at: now,
          updated_at: now,
          group_id: selectedSubmission.group_id,
          image_url: null,
          chapter_1_content: null,
          chapter_1_completed: false,
          chapter_2_content: null,
          chapter_2_completed: false,
          chapter_3_content: null,
          chapter_3_completed: false,
          chapter_4_content: '',
          chapter_4_completed: false,
          chapter_5_content: '',
          chapter_5_completed: false,
          chapter_1_file_name: '',
          chapter_1_status: 'Not started',
          chapter_1_feedback: '',
          chapter_2_file_name: '',
          chapter_2_status: 'Not started',
          chapter_2_feedback: '',
          chapter_3_file_name: '',
          chapter_3_status: 'Not started',
          chapter_3_feedback: '',
          chapter_4_file_name: '',
          chapter_4_status: 'Not started',
          chapter_4_feedback: '',
          chapter_5_file_name: '',
          chapter_5_status: 'Not started',
          chapter_5_feedback: '',
          target_completion: null
        };
        const { error: projectError } = await supabase
          .from('research_projects')
          .insert([projectData]);
        if (projectError) {
          console.error('Error creating project:', projectError);
        }
      }
      // Refresh submissions
      await fetchSubmissions()
      setReviewModalOpen(false)
      setSelectedSubmission(null)
      setReviewComment("")
    } catch (error) {
      console.error('Error submitting review:', error)
    } finally {
      setSubmittingReview(false)
    }
  }

  const downloadFile = async (filePath, fileName) => {
    try {
      const { data, error } = await supabase.storage
        .from('research-files')
        .download(filePath)

      if (error) {
        throw error
      }

      const url = window.URL.createObjectURL(data)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = fileName || 'research-file'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading file:', error)
    }
  }

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = 
      submission.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || submission.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const stats = [
    {
      title: "Total Submissions",
      value: submissions.length,
      icon: FileText,
      color: "bg-blue-50 text-blue-600"
    },
    {
      title: "Pending Review",
      value: submissions.filter(s => s.status === "pending").length,
      icon: Clock,
      color: "bg-yellow-50 text-yellow-600"
    },
    {
      title: "Approved",
      value: submissions.filter(s => s.status === "approved").length,
      icon: CheckCircle,
      color: "bg-green-50 text-green-600"
    },
    {
      title: "Need Revision",
      value: submissions.filter(s => s.status === "revision_required").length,
      icon: AlertCircle,
      color: "bg-orange-50 text-orange-600"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              Research Proposals �
            </h1>
            <p className="text-gray-600">Review and provide feedback on student research proposals</p>
          </div>
          <Button
            onClick={fetchSubmissions}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by title, student name, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="revision_required">Revision Required</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredSubmissions.length > 0 ? (
          filteredSubmissions.map((submission) => {
            const statusConfig = getStatusConfig(submission.status)
            const typeConfig = getTypeConfig(submission.type)
            const StatusIcon = statusConfig.icon
            const TypeIcon = typeConfig.icon
            
            return (
              <Card key={`${submission.type}-${submission.id}`} className="hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={typeConfig.color}>
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {typeConfig.text}
                        </Badge>
                        <Badge className={statusConfig.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.text}
                        </Badge>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {submission.title}
                      </h3>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{submission.student_name}</span>
                        </div>
                        {submission.group_name && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{submission.group_name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Submitted: {new Date(submission.submission_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {submission.description || submission.abstract || 'No description provided'}
                      </p>
                      
                      {submission.category && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded mr-2">
                          {submission.category}
                        </span>
                      )}
                      
                      {submission.research_topic && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                          {submission.research_topic}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reviewer Comments */}
                  {submission.reviewer_comments && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                      <p className="text-sm font-medium text-gray-900 mb-1">Your Comments:</p>
                      <p className="text-sm text-gray-700">{submission.reviewer_comments}</p>
                    </div>
                  )}

                  {/* Attached Files */}
                  {submission.file_path && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Attached Files:
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 flex-1">{submission.file_name || 'Research Document'}</span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReview(submission)}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {submission.adviser_comments ? 'Update Review' : 'Add Review'}
                    </Button>
                    {/* View PDF button if file is attached and is a PDF */}
                    {submission.file_path && (submission.file_type === 'application/pdf' || submission.file_name?.toLowerCase().endsWith('.pdf')) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const { data } = supabase.storage
                            .from('research-files')
                            .getPublicUrl(submission.file_path);
                          if (data?.publicUrl) {
                            setPdfFileUrl(data.publicUrl);
                            setPdfFileName(submission.file_name || submission.title);
                            setShowPDFViewer(true);
                          }
                        }}
                        className="text-purple-600 border-purple-200 hover:bg-purple-50"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View PDF
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || statusFilter !== "all" ? "No submissions found" : "No submissions to review"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || statusFilter !== "all" 
                ? "Try adjusting your search or filter criteria" 
                : "Students from your assigned groups haven't submitted any research proposals or progress reports yet"}
            </p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModalOpen && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Review Submission</h2>
              <p className="text-sm text-gray-600">{selectedSubmission.title}</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Status
                  </label>
                  <select
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Pending Review</option>
                    <option value="approved">Approved</option>
                    <option value="revision_required">Revision Required</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comments & Feedback
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Provide detailed feedback for the student..."
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setReviewModalOpen(false)
                  setSelectedSubmission(null)
                  setReviewComment("")
                }}
                disabled={submittingReview}
              >
                Cancel
              </Button>
              <Button
                onClick={submitReview}
                disabled={submittingReview || !reviewComment.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submittingReview ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </div>
                ) : (
                  'Submit Review'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {showPDFViewer && pdfFileUrl && (
        <StudentPDFViewer
          fileUrl={pdfFileUrl}
          fileName={pdfFileName}
          projectId={null}
          chapterNumber={0}
          onClose={() => {
            setShowPDFViewer(false)
            setPdfFileUrl(null)
            setPdfFileName(null)
          }}
        />
      )}
    </div>
  )
}

export default ReviewSubmissions
