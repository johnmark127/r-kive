"use client"

import { useState, useEffect } from "react"
// ...existing code...
import ToastManager, { useToast } from "@/components/ToastManager"
import PDFViewer from "@/components/PDFViewer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, BookmarkIcon, Calendar, User, FileText, ExternalLink, Bookmark, GitBranch } from "lucide-react"
import { supabase } from "@/supabase/client"
import { useNavigate } from "react-router-dom"

const BrowseProjectsPage = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [yearFilter, setYearFilter] = useState("")
  const [sortFilter, setSortFilter] = useState("relevance")
  const [bookmarkedPapers, setBookmarkedPapers] = useState(new Set())
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showPDFViewer, setShowPDFViewer] = useState(false)
  const [pdfToView, setPdfToView] = useState(null)
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)
  const [accessRequests, setAccessRequests] = useState([])
  const [requesting, setRequesting] = useState(false)
  const [requestStatus, setRequestStatus] = useState("none") // "none", "pending", "approved", "rejected"

  const { showToast } = useToast();
  const navigate = useNavigate();

  // Fetch papers from Supabase
  useEffect(() => {
    const fetchPapers = async () => {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from("research_papers")
        .select("*")
        .order("year_published", { ascending: false })
      if (error) {
        setError(error.message)
        setPapers([])
        showToast && showToast("Failed to load papers: " + error.message, "error");
      } else {
        setPapers(data)
      }
      setLoading(false)
    }
    fetchPapers()
  }, [])

  // Get user info
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    })()
  }, [])

  // Fetch student's access requests (only if user is logged in)
  useEffect(() => {
    if (!user) {
      setAccessRequests([])
      return
    }
    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from("research_paper_access_requests")
        .select("id, paper_id, status")
        .eq("student_id", user.id)
      if (!error) setAccessRequests(data)
    }
    fetchRequests()
  }, [user])

  // Fetch bookmarks for the logged-in user and keep in sync
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("paper_id")
        .eq("user_id", user.id);
      if (!error && data) {
        setBookmarkedPapers(new Set(data.map((b) => b.paper_id)));
      }
    })();
  }, [user]);

  // When modal opens, check if the user already requested this paper
  useEffect(() => {
    if (!selectedPaper || !user) {
      setRequestStatus("none")
      return
    }
    const req = accessRequests.find(r =>
      r.paper_id === selectedPaper.id && (r.status === "pending" || r.status === "approved")
    )
    if (req) setRequestStatus(req.status)
    else setRequestStatus("none")
  }, [selectedPaper, accessRequests, user])

  // Gather unique categories and years for filters
  const categories = Array.from(new Set(papers.map((p) => p.category).filter(Boolean)))
  const years = Array.from(new Set(papers.map((p) => p.year_published).filter(Boolean))).sort((a, b) => b - a)

  // Filter papers based on search and filters
  const filteredPapers = papers.filter((paper) => {
    const matchesSearch =
      (paper.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (paper.authors || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !categoryFilter || paper.category === categoryFilter
    const matchesYear = !yearFilter || String(paper.year_published) === yearFilter
    return matchesSearch && matchesCategory && matchesYear
  })

  // Sort papers
  const sortedPapers = [...filteredPapers].sort((a, b) => {
    switch (sortFilter) {
      case "date":
        return b.year_published - a.year_published
      case "views":
        return (b.views || 0) - (a.views || 0)
      case "title":
        return (a.title || "").localeCompare(b.title || "")
      default:
        return 0
    }
  })

  // Add a bookmark
  const addBookmark = async (paperId) => {
    if (!user) {
      showToast && showToast("You must be logged in to bookmark papers.", "warning");
      return;
    }
    // Prevent duplicate bookmarks
    if (bookmarkedPapers.has(paperId)) return;

    const { error } = await supabase.from("bookmarks").insert([
      {
        user_id: user.id,
        paper_id: paperId,
      },
    ]);

    if (!error) {
      setBookmarkedPapers(new Set([...bookmarkedPapers, paperId]));
      showToast && showToast("Paper bookmarked!", "success");
    } else {
      showToast && showToast("Failed to add bookmark.", "error");
    }
  };

  // Remove a bookmark
  const removeBookmark = async (paperId) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", user.id)
      .eq("paper_id", paperId);
    if (!error) {
      const updated = new Set(bookmarkedPapers);
      updated.delete(paperId);
      setBookmarkedPapers(updated);
      showToast && showToast("Bookmark removed.", "success");
    } else {
      showToast && showToast("Failed to remove bookmark.", "error");
    }
  };

  const openPaperModal = async (paper) => {
    setSelectedPaper(paper)
    setShowModal(true)
    // Log paper view to Supabase only if not already viewed by this student
    if (user && paper && paper.id) {
      try {
        const { data: existing, error: fetchError } = await supabase
          .from("paper_views_log")
          .select("id")
          .eq("paper_id", paper.id)
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();
        if (!existing && !fetchError) {
          await supabase.from("paper_views_log").insert([
            {
              paper_id: paper.id,
              user_id: user.id,
              viewed_at: new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        // Optionally handle/log error
      }
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedPaper(null)
    setRequestStatus("none")
    setRequesting(false)
  }

  // Handle student request for paper access
  const handleRequestAccess = async () => {
    if (!user) {
      showToast && showToast("You must be logged in to request access.", "warning");
      return
    }
    setRequesting(true)
    const { error } = await supabase.from("research_paper_access_requests").insert([{
      student_id: user.id,
      student_name: user.user_metadata?.full_name || user.email,
      student_email: user.email,
      paper_id: selectedPaper.id,
      status: "pending"
    }])
    setRequesting(false)
    if (error) {
      showToast && showToast("Failed to send request: " + error.message, "error");
    } else {
      setRequestStatus("pending")
      // Optionally refresh requests:
      const { data, error: fetchErr } = await supabase
        .from("research_paper_access_requests")
        .select("id, paper_id, status")
        .eq("student_id", user.id)
      if (!fetchErr) setAccessRequests(data)
      showToast && showToast("Request sent! The admin will review your access request.", "success");
    }
  }

  // Handle navigation to citation tree with selected paper
  const handleViewCitationTree = (paper) => {
    // Navigate to citation tree page and pass the paper data via state
    navigate("/student/citations", { state: { selectedPaper: paper } })
  }

  return (
    <div className="space-y-4 sm:space-y-6 bg-gray-50 min-h-screen">
      <ToastManager />
      {/* Header */}
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Browse Research Papers</h1>
            <p className="text-sm sm:text-base text-gray-600">Discover and explore academic research from our collection</p>
          </div>
          {/* Search Bar */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by title, author, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Compact Filters */}
      <div className="bg-white rounded-lg border shadow-sm p-3 sm:p-4 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <span className="text-sm font-medium text-gray-600 hidden sm:block flex-shrink-0">Filters:</span>
            
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
            
            <div className="relative min-w-0 flex-shrink-0">
              <select
                value={sortFilter}
                onChange={(e) => setSortFilter(e.target.value)}
                className="w-full min-w-[100px] max-w-[130px] sm:min-w-0 sm:max-w-none px-3 py-1.5 text-xs sm:text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors"
              >
                <option value="relevance">Relevance</option>
                <option value="date">Date</option>
                <option value="views">Views</option>
                <option value="title">Title</option>
              </select>
            </div>
            
            {(categoryFilter || yearFilter || sortFilter !== "relevance") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setCategoryFilter("")
                  setYearFilter("")
                  setSortFilter("relevance")
                }}
                className="flex-shrink-0 px-2 py-1 h-auto text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </Button>
            )}
          </div>
          
          <div className="text-xs text-gray-500 flex-shrink-0">
            {sortedPapers.length} papers
          </div>
        </div>
      </div>

      {/* Results */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">
            {loading
              ? "Loading..."
              : error
              ? "Error loading papers"
              : `Search Results (${sortedPapers.length} papers found)`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="text-center py-8 sm:py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading papers...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 sm:py-12 text-red-500">{error}</div>
          ) : sortedPapers.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <FileText className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No papers found</h3>
              <p className="text-sm sm:text-base text-gray-600 px-4">Try adjusting your search criteria or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {sortedPapers.map((paper) => (
                <Card key={paper.id} className="hover:shadow-md transition-all duration-200 hover:scale-[1.01] sm:hover:scale-[1.02]">
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
                      </div>

                      <p className="text-gray-700 text-sm mb-3 sm:mb-4 line-clamp-3">{paper.abstract}</p>

                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => openPaperModal(paper)} 
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
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (bookmarkedPapers.has(paper.id)) {
                              removeBookmark(paper.id)
                            } else {
                              addBookmark(paper.id)
                            }
                          }}
                          className="w-9 h-9 p-0 rounded-full hover:bg-gray-100"
                          title={bookmarkedPapers.has(paper.id) ? "Remove bookmark" : "Add bookmark"}
                        >
                          {bookmarkedPapers.has(paper.id) ? (
                            <Bookmark className="w-4 h-4 text-blue-600 fill-current" />
                          ) : (
                            <BookmarkIcon className="w-4 h-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal for paper details and access request */}
      {showModal && selectedPaper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 pr-4 leading-tight">{selectedPaper.title}</h2>
                <button 
                  onClick={closeModal} 
                  className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl font-bold flex-shrink-0 p-1"
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>
              <div className="mb-4 text-gray-600 space-y-2">
                <div className="flex items-start sm:items-center">
                  <User className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <span className="text-sm sm:text-base">
                    <strong>Authors:</strong> <span className="break-words">{selectedPaper.authors}</span>
                  </span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="text-sm sm:text-base">
                    <strong>Year:</strong> {selectedPaper.year_published}
                  </span>
                </div>
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  <span className="text-sm sm:text-base">
                    <strong>Category:</strong> {selectedPaper.category}
                  </span>
                </div>
              </div>
              <div className="mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Abstract</h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{selectedPaper.abstract}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                {user ? (
                  requestStatus === "pending" ? (
                    <Button className="bg-yellow-200 text-yellow-800 cursor-not-allowed text-sm sm:text-base" disabled>
                      Request Pending
                    </Button>
                  ) : requestStatus === "approved" ? (
                    <Button 
                      onClick={() => {
                        setPdfToView({ url: selectedPaper.file_url, title: selectedPaper.title })
                        setShowPDFViewer(true)
                        setShowModal(false)
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Access Granted - View Paper
                    </Button>
                  ) : (
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base"
                      disabled={requesting}
                      onClick={handleRequestAccess}
                    >
                      {requesting && (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      )}
                      <FileText className="w-4 h-4 mr-2" />
                      <span className="hidden xs:inline">Request Access to Full Paper</span>
                      <span className="xs:hidden">Request Access</span>
                    </Button>
                  )
                ) : (
                  <Button className="bg-gray-300 text-gray-600 cursor-not-allowed text-sm sm:text-base" disabled>
                    Login to Request Access
                  </Button>
                )}
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
                  variant="outline" 
                  onClick={() => {
                    if (bookmarkedPapers.has(selectedPaper.id)) {
                      removeBookmark(selectedPaper.id)
                    } else {
                      addBookmark(selectedPaper.id)
                    }
                  }}
                  className="text-sm sm:text-base"
                  title={bookmarkedPapers.has(selectedPaper.id) ? "Remove bookmark" : "Add bookmark"}
                >
                  {bookmarkedPapers.has(selectedPaper.id) ? (
                    <Bookmark className="w-4 h-4 mr-2 text-blue-600 fill-current" />
                  ) : (
                    <BookmarkIcon className="w-4 h-4 mr-2" />
                  )}
                  <span className="hidden xs:inline">
                    {bookmarkedPapers.has(selectedPaper.id) ? "Bookmarked" : "Bookmark"}
                  </span>
                  <span className="xs:hidden">
                    {bookmarkedPapers.has(selectedPaper.id) ? "Saved" : "Save"}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default BrowseProjectsPage