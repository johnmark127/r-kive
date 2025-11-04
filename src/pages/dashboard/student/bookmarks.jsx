"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import ToastManager, { useToast } from "@/components/ToastManager"
import PDFViewer from "@/components/PDFViewer"
import { FileText, Eye, Trash2, Search, Calendar, User, BookOpen, GitBranch } from "lucide-react"
import { useNavigate } from "react-router-dom"

const BookmarksPage = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [yearFilter, setYearFilter] = useState("")
  const [accessFilter, setAccessFilter] = useState("all") // "all", "approved", "pending"
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [bookmarkedPapers, setBookmarkedPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [showPDFViewer, setShowPDFViewer] = useState(false)
  const [pdfToView, setPdfToView] = useState(null)

  // Get logged-in user
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    })()
  }, [])

  // Fetch bookmarks from Supabase
  useEffect(() => {
    if (!user) {
      setBookmarkedPapers([])
      setLoading(false)
      return
    }
    const fetchBookmarks = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from("bookmarks")
        .select("id, paper_id, status, access_request_status, is_accessible, created_at, research_papers(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      if (error) {
        setBookmarkedPapers([])
      } else {
        setBookmarkedPapers(
          data
            .filter(b => b.research_papers)
            .map(b => ({
              ...b.research_papers,
              bookmark_id: b.id,
              bookmarked_date: b.created_at,
              // Always include these fields, fallback to null if missing
              status: b.status ?? b.research_papers.status ?? "bookmarked",
              access_request_status: b.access_request_status ?? b.research_papers.access_request_status ?? null,
              is_accessible: b.is_accessible ?? b.research_papers.is_accessible ?? false,
              file_path: b.research_papers.file_path ?? null
            }))
        )
      }
      setLoading(false)
    }
    fetchBookmarks()
  }, [user])

  const filteredPapers = bookmarkedPapers.filter((paper) => {
    const matchesSearch =
      (paper.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (paper.authors || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (paper.category || "").toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = !categoryFilter || paper.category === categoryFilter
    const matchesYear = !yearFilter || String(paper.year_published) === yearFilter
    
    // Access filter logic
    let matchesAccess = true
    if (accessFilter === "approved") {
      matchesAccess = paper.access_request_status === "approved" || paper.status === "accepted" || paper.is_accessible
    } else if (accessFilter === "pending") {
      matchesAccess = paper.access_request_status === "pending"
    }
    
    return matchesSearch && matchesCategory && matchesYear && matchesAccess
  })

  // Gather unique categories and years for filters
  const categories = Array.from(new Set(bookmarkedPapers.map((p) => p.category).filter(Boolean)))
  const years = Array.from(new Set(bookmarkedPapers.map((p) => p.year_published).filter(Boolean))).sort((a, b) => b - a)

  // Calculate counts for access filters
  const accessCounts = {
    approved: bookmarkedPapers.filter(p => p.access_request_status === "approved" || p.status === "accepted" || p.is_accessible).length,
    pending: bookmarkedPapers.filter(p => p.access_request_status === "pending").length
  }

  // Badge rendering logic
  const renderStatusBadge = (paper) => {
    if (!paper.access_request_status) return null // hide if just bookmarked
    let colorClass = ""
    let text = ""
    switch (paper.access_request_status) {
      case "pending":
        colorClass = "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
        text = "pending"
        break
      case "approved":
        colorClass = "bg-green-100 text-green-800 hover:bg-green-100"
        text = "accepted"
        break
      case "rejected":
        colorClass = "bg-red-100 text-red-800 hover:bg-red-100"
        text = "rejected"
        break
      case "revoked":
        colorClass = "bg-gray-300 text-gray-800"
        text = "revoked"
        break
      default:
        return null
    }
    return (
      <Badge variant="outline" className={"text-xs " + colorClass}>
        {text}
      </Badge>
    )
  }

  const handleReadPaper = (paper) => {
    setSelectedPaper(paper)
    setIsModalOpen(true)
  }

  const handleRemoveBookmark = async (bookmarkId) => {
    if (confirm("Are you sure you want to remove this bookmark?")) {
      const { error } = await supabase.from("bookmarks").delete().eq("id", bookmarkId)
      if (!error) {
        setBookmarkedPapers(bookmarkedPapers.filter(p => p.bookmark_id !== bookmarkId))
        showToast && showToast("Bookmark removed successfully!", "success");
      } else {
        showToast && showToast("Failed to remove bookmark.", "error");
      }
    }
  }

  const handleRequestAccess = async (paper) => {
    if (!user) {
      showToast && showToast("You must be logged in to request access.", "warning");
      return;
    }
    try {
      const { error: insertError } = await supabase.from("research_paper_access_requests").insert([
        {
          student_id: user.id,
          student_name: user.user_metadata?.full_name || user.email,
          student_email: user.email,
          paper_id: paper.id || paper.paper_id,
          status: "pending"
        }
      ]);
      if (insertError) {
        showToast && showToast("Failed to request access.", "error");
        setIsModalOpen(false);
        return;
      }
      const { error: updateError } = await supabase
        .from("bookmarks")
        .update({ status: "pending", access_request_status: "pending" })
        .eq("id", paper.bookmark_id);
      if (updateError) {
        showToast && showToast("Requested, but failed to update bookmark status.", "warning");
      } else {
        setBookmarkedPapers(bookmarkedPapers.map(p =>
          p.bookmark_id === paper.bookmark_id
            ? { ...p, status: "pending", access_request_status: "pending" }
            : p
        ));
        showToast && showToast("Access request sent! The admin will review your access request.", "success");
      }
    } catch (e) {
      showToast && showToast("Failed to request access.", "error");
    }
    setIsModalOpen(false);
  }

  const handleReadFullPaper = (paper) => {
    // Accept both approved/accepted/is_accessible for access granted
    const fileLink = paper.file_path || paper.file_url;
    if (
      (paper.access_request_status === "approved" ||
        paper.status === "accepted" ||
        paper.is_accessible) &&
      fileLink
    ) {
      setPdfToView({ url: fileLink, title: paper.title })
      setShowPDFViewer(true)
      setIsModalOpen(false)
    }
  }

  // Handle navigation to citation tree with selected paper
  const handleViewCitationTree = (paper) => {
    // Navigate to citation tree page and pass the paper data via state
    navigate("/student/citations", { state: { selectedPaper: paper } })
  }

  // --------- MODAL BUTTON LOGIC FIXED BELOW ---------
  const renderModalActionButton = (paper) => {
    // Show green "Access Granted - View Paper" button if ANY of these are true
    const fileLink = paper.file_path || paper.file_url;
    if (
      (paper.access_request_status === "approved" ||
        paper.status === "accepted" ||
        paper.is_accessible) &&
      fileLink
    ) {
      return (
        <Button
          onClick={() => handleReadFullPaper(paper)}
          className="flex items-center bg-green-600 hover:bg-green-700 text-white shadow-md"
          style={{ minWidth: 260, fontWeight: 600, fontSize: 16 }}
        >
          <FileText className="w-5 h-5 mr-2" />
          Access Granted - View Paper
        </Button>
      )
    } else if (paper.access_request_status === "pending") {
      return (
        <Button disabled className="flex items-center">
          <Eye className="w-4 h-4 mr-2" />
          Request Pending
        </Button>
      )
    } else if (paper.access_request_status === "rejected") {
      return (
        <Button disabled className="flex items-center">
          <Eye className="w-4 h-4 mr-2" />
          Request Rejected
        </Button>
      )
    } else {
      return (
        <Button onClick={() => handleRequestAccess(paper)} className="flex items-center">
          <Eye className="w-4 h-4 mr-2" />
          Request Access to Full Paper
        </Button>
      )
    }
  }
  // --------- END MODAL BUTTON LOGIC FIXED ---------

  return (
    <div className="space-y-4 sm:space-y-6 bg-gray-50 min-h-screen">
      <ToastManager />
      {/* Welcome Header */}
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">My Bookmarked Papers</h1>
            <p className="text-sm sm:text-base text-gray-600">Access your saved research papers here</p>
          </div>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search bookmarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border shadow-sm p-3 sm:p-4 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <span className="text-sm font-medium text-gray-600 hidden sm:block flex-shrink-0">Filters:</span>
            
            {/* Access Filter Dropdown */}
            <div className="relative min-w-0 flex-shrink-0">
              <select
                value={accessFilter}
                onChange={(e) => setAccessFilter(e.target.value)}
                className={`w-full min-w-[140px] max-w-[180px] sm:min-w-0 sm:max-w-none px-3 py-1.5 text-xs sm:text-sm border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  accessFilter === "approved" ? "bg-green-50 border-green-300 text-green-800 font-medium" :
                  accessFilter === "pending" ? "bg-yellow-50 border-yellow-300 text-yellow-800 font-medium" :
                  "bg-gray-50 border-gray-200 hover:bg-white"
                }`}
              >
                <option value="all">📚 All Bookmarks ({bookmarkedPapers.length})</option>
                <option value="approved">✅ Approved Access ({accessCounts.approved})</option>
                <option value="pending">⏳ Pending ({accessCounts.pending})</option>
              </select>
            </div>
            
            {/* Category Filter */}
            {categories.length > 0 && (
              <div className="relative min-w-0 flex-shrink-0">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full min-w-[120px] max-w-[150px] sm:min-w-0 sm:max-w-none px-3 py-1.5 text-xs sm:text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Year Filter */}
            {years.length > 0 && (
              <div className="relative min-w-0 flex-shrink-0">
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="w-full min-w-[90px] max-w-[120px] sm:min-w-0 sm:max-w-none px-3 py-1.5 text-xs sm:text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors"
                >
                  <option value="">All Years</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Clear Button */}
            {(categoryFilter || yearFilter || accessFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("")
                  setCategoryFilter("")
                  setYearFilter("")
                  setAccessFilter("all")
                }}
                className="flex-shrink-0 px-2 py-1 h-auto text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </Button>
            )}
          </div>
          
          <div className="text-xs text-gray-500 flex-shrink-0">
            {filteredPapers.length} bookmarks
          </div>
        </div>
      </div>

      {/* Bookmarked Papers Grid - Browse Style */}
      <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {loading ? (
          <div className="col-span-full text-center py-8 sm:py-16 text-gray-600">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>Loading bookmarks...</p>
          </div>
        ) : filteredPapers.length > 0 ? (
          filteredPapers.map((paper) => (
            <Card key={paper.bookmark_id} className="hover:shadow-md transition-all duration-200 hover:scale-[1.01] sm:hover:scale-[1.02]">
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base sm:text-lg leading-tight mb-2 line-clamp-2">
                      {paper.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                      <span className="truncate">{paper.authors}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        <span>{paper.year_published}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        <span className="sm:hidden truncate block max-w-[80px]">
                          {paper.category}
                        </span>
                        <span className="hidden sm:block">
                          {paper.category}
                        </span>
                      </Badge>
                    </div>
                    
                    {/* Status Badge */}
                    {renderStatusBadge(paper) && (
                      <div className="mb-3">
                        {renderStatusBadge(paper)}
                      </div>
                    )}
                  </div>

                  <p className="text-gray-700 text-sm mb-3 sm:mb-4 line-clamp-3">{paper.abstract}</p>

                  <div className="flex items-center justify-end gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleReadPaper(paper)} 
                      className="w-9 h-9 p-0 rounded-full"
                      title="Read paper"
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewCitationTree(paper)
                      }}
                      className="w-9 h-9 p-0 rounded-full"
                      title="View citation tree"
                    >
                      <GitBranch className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveBookmark(paper.bookmark_id)}
                      className="w-9 h-9 p-0 rounded-full text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Remove bookmark"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-8 sm:p-12 text-center">
                <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No bookmarks found</h3>
                <p className="text-sm sm:text-base text-gray-600 px-2">
                  {searchTerm ? "Try adjusting your search terms" : "You haven't bookmarked any papers yet"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Paper Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] sm:max-h-[80vh] overflow-y-auto mx-3 sm:mx-auto">
          {selectedPaper && (
            <>
              {/* Debug: log selectedPaper to inspect status and file_path */}
              {console.log('DEBUG selectedPaper:', selectedPaper)}
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 pr-8 leading-tight">{selectedPaper.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 text-sm text-gray-600">
                  <div className="flex items-start sm:items-center">
                    <User className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <span className="break-words">Authors: {selectedPaper.authors}</span>
                  </div>
                  <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>Year: {selectedPaper.year_published}</span>
                    </div>
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      <span>{selectedPaper.views} views</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{selectedPaper.category}</Badge>
                  {renderStatusBadge(selectedPaper)}
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Abstract</h4>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{selectedPaper.abstract}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  {renderModalActionButton(selectedPaper)}
                  <Button
                    variant="outline"
                    onClick={() => handleViewCitationTree(selectedPaper)}
                    className="text-sm sm:text-base"
                  >
                    <GitBranch className="w-4 h-4 mr-2" />
                    <span className="hidden xs:inline">Citation Tree</span>
                    <span className="xs:hidden">Citations</span>
                  </Button>
                  <Button
                    onClick={() => handleRemoveBookmark(selectedPaper.bookmark_id)}
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 text-sm sm:text-base"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    <span className="hidden xs:inline">Remove Bookmark</span>
                    <span className="xs:hidden">Remove</span>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* PDF Viewer Modal */}
      {showPDFViewer && pdfToView && (
        <PDFViewer
          fileUrl={pdfToView.url}
          fileName={pdfToView.title}
          onClose={() => {
            setShowPDFViewer(false)
            setPdfToView(null)
          }}
        />
      )}
    </div>
  )
}

export default BookmarksPage