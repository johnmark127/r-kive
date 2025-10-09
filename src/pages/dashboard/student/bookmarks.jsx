"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import ToastManager, { useToast } from "@/components/ToastManager"
import { FileText, Eye, Trash2, Search, Calendar, User, BookOpen, GitBranch } from "lucide-react"
import { useNavigate } from "react-router-dom"

const BookmarksPage = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [bookmarkedPapers, setBookmarkedPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

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

  const filteredPapers = bookmarkedPapers.filter(
    (paper) =>
      (paper.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (paper.authors || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (paper.category || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

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
      window.open(fileLink, "_blank")
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
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <ToastManager />
      {/* Welcome Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">My Bookmarked Papers</h1>
            <p className="text-gray-600">Access your saved research papers here</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by title, author, or categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Bookmarked Papers Grid - Browse Style */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-16 text-gray-600">Loading bookmarks...</div>
        ) : filteredPapers.length > 0 ? (
          filteredPapers.map((paper) => (
            <Card key={paper.bookmark_id} className="hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg leading-tight mb-2 line-clamp-2">
                      {paper.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <User className="w-4 h-4 mr-1" />
                      <span className="truncate">{paper.authors}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{paper.year_published}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="outline" className="text-xs">
                        {paper.category}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-gray-700 text-sm mb-4 line-clamp-3">{paper.abstract}</p>

                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleReadPaper(paper)} className="flex-1">
                      <FileText className="w-4 h-4 mr-1" />
                      Read Paper
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewCitationTree(paper)
                      }}
                      className="flex-1"
                    >
                      <GitBranch className="w-4 h-4 mr-1" />
                      Citation Tree
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveBookmark(paper.bookmark_id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
              <CardContent className="p-12 text-center">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookmarks found</h3>
                <p className="text-gray-600">
                  {searchTerm ? "Try adjusting your search terms" : "You haven't bookmarked any papers yet"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Paper Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedPaper && (
            <>
              {/* Debug: log selectedPaper to inspect status and file_path */}
              {console.log('DEBUG selectedPaper:', selectedPaper)}
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-gray-900 pr-8">{selectedPaper.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    <span>Authors: {selectedPaper.authors}</span>
                  </div>
                  <div className="flex items-center gap-4">
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

                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedPaper.category}</Badge>
                  {renderStatusBadge(selectedPaper)}
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Abstract</h4>
                  <p className="text-gray-700 leading-relaxed">{selectedPaper.abstract}</p>
                </div>

                <div className="flex gap-3 pt-4">
                  {renderModalActionButton(selectedPaper)}
                  <Button
                    variant="outline"
                    onClick={() => handleViewCitationTree(selectedPaper)}
                  >
                    <GitBranch className="w-4 h-4 mr-2" />
                    Citation Tree
                  </Button>
                  <Button
                    onClick={() => handleRemoveBookmark(selectedPaper.bookmark_id)}
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Bookmark
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BookmarksPage