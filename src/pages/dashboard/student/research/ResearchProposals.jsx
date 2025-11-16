"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Lightbulb, Search, Calendar, Eye, Edit3, Clock, CheckCircle, XCircle, AlertCircle, Download, FileText } from "lucide-react"
import { supabase } from "@/supabase/client"
import StudentPDFViewer from "@/components/StudentPDFViewer"

const ResearchProposals = () => {
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  
  // PDF Viewer states
  const [showPDFViewer, setShowPDFViewer] = useState(false)
  const [pdfFileUrl, setPdfFileUrl] = useState(null)
  const [pdfFileName, setPdfFileName] = useState(null)

  useEffect(() => {
    fetchProposals()
  }, [])

  const showToast = (message, type = 'success') => {
    // Using existing toast system from the app
    console.log(`${type.toUpperCase()}: ${message}`)
    // You can integrate with your existing toast system here
  }

  const fetchProposals = async () => {
    try {
      setLoading(true)
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        throw userError
      }

      if (!user) {
        showToast("Please log in to view your proposals", "error")
        return
      }

      // Fetch proposals for the current user
      const { data: proposalsData, error } = await supabase
        .from('research_proposals')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setProposals(proposalsData || [])
    } catch (error) {
      console.error('Error fetching proposals:', error)
      showToast("Failed to fetch research proposals", "error")
    } finally {
      setLoading(false)
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

      // Create blob and download
      const url = window.URL.createObjectURL(data)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      showToast("File downloaded successfully", "success")
    } catch (error) {
      console.error('Error downloading file:', error)
      showToast("Failed to download file", "error")
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
          text: "Under Review"
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
          text: "Unknown"
        }
    }
  }

  const filteredProposals = proposals.filter(proposal =>
    proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    proposal.research_field?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    proposal.keywords?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = [
    {
      title: "Total Proposals",
      value: proposals.length,
      icon: Lightbulb,
      color: "bg-blue-50 text-blue-600"
    },
    {
      title: "Approved",
      value: proposals.filter(p => p.status === "approved").length,
      icon: CheckCircle,
      color: "bg-green-50 text-green-600"
    },
    {
      title: "Pending Review",
      value: proposals.filter(p => p.status === "pending").length,
      icon: Clock,
      color: "bg-yellow-50 text-yellow-600"
    },
    {
      title: "Need Revision",
      value: proposals.filter(p => p.status === "revision_required").length,
      icon: AlertCircle,
      color: "bg-orange-50 text-orange-600"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border mb-4 sm:mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
          <div className="flex-1">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
              <span>Research Proposals 💡</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-600">Track the status of your submitted research proposals</p>
          </div>
          <Link to="/student/research/submit" className="w-full sm:w-auto">
            <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto text-sm">
              <span className="sm:hidden">New Proposal</span>
              <span className="hidden sm:inline">Submit New Proposal</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mb-2 sm:mb-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 line-clamp-2">{stat.title}</p>
                  <p className="text-xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-2 sm:p-3 rounded-lg ${stat.color} self-end sm:self-auto`}>
                  <stat.icon className="h-4 w-4 sm:h-6 sm:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4 sm:mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
          <Input
            placeholder="Search proposals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 sm:pl-10 text-sm sm:text-base h-10 sm:h-auto"
          />
        </div>
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        {loading ? (
          // Loading skeleton
          [1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 sm:mb-4">
                  <div className="flex-1 mb-3 sm:mb-0">
                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-2 sm:h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-2 sm:h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                  <div className="h-5 sm:h-6 bg-gray-200 rounded w-16 sm:w-20 self-start"></div>
                </div>
                <div className="flex gap-2">
                  <div className="h-6 sm:h-8 bg-gray-200 rounded w-12 sm:w-16 flex-1 sm:flex-none"></div>
                  <div className="h-6 sm:h-8 bg-gray-200 rounded w-12 sm:w-16 flex-1 sm:flex-none"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredProposals.length > 0 ? (
          filteredProposals.map((proposal) => {
            const statusConfig = getStatusConfig(proposal.status)
            const StatusIcon = statusConfig.icon
            
            return (
              <Card key={proposal.id} className="hover:shadow-md transition-all duration-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 sm:mb-4">
                    <div className="flex-1 mb-3 sm:mb-0 sm:pr-4">
                      {/* Title and Status Badge */}
                      <div className="flex items-start justify-between mb-2 sm:block">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-0 sm:mb-2 pr-2 flex-1 line-clamp-2">
                          {proposal.title}
                        </h3>
                        <div className="sm:hidden flex-shrink-0">
                          <Badge className={`${statusConfig.color} flex items-center gap-1 text-xs`}>
                            <StatusIcon className="h-2 w-2" />
                            <span className="truncate max-w-[60px]">{statusConfig.text}</span>
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Description */}
                      <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2">
                        {proposal.abstract || proposal.description}
                      </p>
                      
                      {/* Dates and Research Field - Mobile Stacked */}
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 text-xs text-gray-500 mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">Submitted: {new Date(proposal.created_at).toLocaleDateString()}</span>
                        </div>
                        {proposal.reviewed_at && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">Reviewed: {new Date(proposal.reviewed_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Research Field and Keywords */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {proposal.research_field && (
                          <span className="bg-gray-100 px-2 py-1 rounded text-xs truncate max-w-[120px] sm:max-w-none">
                            {proposal.research_field}
                          </span>
                        )}
                        {proposal.keywords && proposal.keywords.split(',').slice(0, 2).map((keyword, index) => (
                          <span key={index} className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded truncate max-w-[80px] sm:max-w-none">
                            {keyword.trim()}
                          </span>
                        ))}
                        {proposal.keywords && proposal.keywords.split(',').length > 2 && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            +{proposal.keywords.split(',').length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Desktop Status Badge */}
                    <div className="hidden sm:flex flex-col items-end gap-2">
                      <Badge className={`${statusConfig.color} flex items-center gap-1`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.text}
                      </Badge>
                    </div>
                  </div>

                  {/* Reviewer Comments */}
                  {proposal.reviewer_comments && (
                    <div className="mb-3 sm:mb-4 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 mb-1">Adviser Comments:</p>
                      <p className="text-xs sm:text-sm text-gray-700 line-clamp-3 sm:line-clamp-none">{proposal.reviewer_comments}</p>
                    </div>
                  )}

                  {/* Attached Files */}
                  {proposal.file_path && (
                    <div className="mb-3 sm:mb-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                        Attached Files:
                      </p>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                        <span className="text-xs sm:text-sm text-gray-600 flex-1 truncate">
                          {proposal.file_name || 'Research Proposal Document'}
                        </span>
                        <div className="flex gap-2">
                          {/* View PDF button if it's a PDF file */}
                          {(proposal.file_type === 'application/pdf' || proposal.file_name?.toLowerCase().endsWith('.pdf')) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const { data } = supabase.storage
                                  .from('research-files')
                                  .getPublicUrl(proposal.file_path);
                                if (data?.publicUrl) {
                                  setPdfFileUrl(data.publicUrl);
                                  setPdfFileName(proposal.file_name || proposal.title);
                                  setShowPDFViewer(true);
                                }
                              }}
                              className="text-xs w-full sm:w-auto text-purple-600 border-purple-200 hover:bg-purple-50"
                            >
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              View PDF
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadFile(proposal.file_path, proposal.file_name)}
                            className="text-xs w-full sm:w-auto"
                          >
                            <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none text-xs">
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="sm:hidden">Details</span>
                      <span className="hidden sm:inline">View Details</span>
                    </Button>
                    {(proposal.status === "revision_required" || proposal.status === "rejected") && (
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none text-xs">
                        <Edit3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="sm:hidden">Revise</span>
                        <span className="hidden sm:inline">Revise & Resubmit</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="text-center py-8 sm:py-12">
            <Lightbulb className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? "No proposals found" : "No research proposals yet"}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-4">
              {searchQuery 
                ? "Try adjusting your search criteria" 
                : "Submit your first research proposal to get started"}
            </p>
            {!searchQuery && (
              <Button className="bg-blue-600 hover:bg-blue-700 text-sm w-full sm:w-auto max-w-xs">
                Submit Your First Proposal
              </Button>
            )}
          </div>
        )}
      </div>

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

export default ResearchProposals
