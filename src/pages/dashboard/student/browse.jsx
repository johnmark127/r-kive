"use client"

import { useState, useEffect } from "react"
// ...existing code...
import ToastManager, { useToast } from "@/components/ToastManager"
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
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <ToastManager />
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Browse Research Papers</h1>
            <p className="text-gray-600">Discover and explore academic research from our collection</p>
          </div>
          {/* Search Bar */}
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by title, author, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-6"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-6"
              >
                <option value="">All Years</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={sortFilter}
                onChange={(e) => setSortFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-6"
              >
                <option value="relevance">Relevance</option>
                <option value="date">Date</option>
                <option value="views">Views</option>
                <option value="title">Title</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("")
                  setCategoryFilter("")
                  setYearFilter("")
                  setSortFilter("relevance")
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            {loading
              ? "Loading..."
              : error
              ? "Error loading papers"
              : `Search Results (${sortedPapers.length} papers found)`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">Loading papers...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : sortedPapers.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No papers found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedPapers.map((paper) => (
                <Card key={paper.id} className="hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
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
                        <Button size="sm" onClick={() => openPaperModal(paper)} className="flex-1">
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
                          className="p-1 h-auto"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900 pr-4">{selectedPaper.title}</h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">
                  ×
                </button>
              </div>
              <div className="mb-4 text-gray-600 space-y-1">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  <span>
                    <strong>Authors:</strong> {selectedPaper.authors}
                  </span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>
                    <strong>Year:</strong> {selectedPaper.year_published}
                  </span>
                </div>
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  <span>
                    <strong>Category:</strong> {selectedPaper.category}
                  </span>
                </div>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Abstract</h3>
                <p className="text-gray-700 leading-relaxed">{selectedPaper.abstract}</p>
              </div>
              <div className="flex gap-3 justify-end">
                {user ? (
                  requestStatus === "pending" ? (
                    <Button className="bg-yellow-200 text-yellow-800 cursor-not-allowed" disabled>
                      Request Pending
                    </Button>
                  ) : requestStatus === "approved" ? (
                    <Button asChild className="bg-green-600 hover:bg-green-700 text-white" >
                      <a href={selectedPaper.file_url} target="_blank" rel="noopener noreferrer">
                        <FileText className="w-4 h-4 mr-2" />
                        Access Granted - View Paper
                      </a>
                    </Button>
                  ) : (
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={requesting}
                      onClick={handleRequestAccess}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Request Access to Full Paper
                    </Button>
                  )
                ) : (
                  <Button className="bg-gray-300 text-gray-600 cursor-not-allowed" disabled>
                    Login to Request Access
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => handleViewCitationTree(selectedPaper)}
                >
                  <GitBranch className="w-4 h-4 mr-2" />
                  Citation Tree
                </Button>
                <Button variant="outline" onClick={() => {
                  if (bookmarkedPapers.has(selectedPaper.id)) {
                    removeBookmark(selectedPaper.id)
                  } else {
                    addBookmark(selectedPaper.id)
                  }
                }}>
                  {bookmarkedPapers.has(selectedPaper.id) ? (
                    <Bookmark className="w-4 h-4 text-blue-600 fill-current" />
                  ) : (
                    <BookmarkIcon className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BrowseProjectsPage