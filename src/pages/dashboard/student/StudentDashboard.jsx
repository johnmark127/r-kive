"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { FileText, Bookmark, Eye, Search, Bell, User, Calendar, BookOpen, Clock, CheckCircle, FlaskConical, Upload, Lightbulb } from "lucide-react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/supabase/client"

const StudentDashboard = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [isResearchProponent, setIsResearchProponent] = useState(false)
  const [bookmarkCount, setBookmarkCount] = useState(0)
  const [accessRequestsCount, setAccessRequestsCount] = useState(0)
  const [approvedCount, setApprovedCount] = useState(0)
  const [recentBookmarkedPapers, setRecentBookmarkedPapers] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate();

  // Get logged-in user and profile
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Fetch user profile to check if they're a research proponent
        const { data: profile, error } = await supabase
          .from('users')
          .select('is_research_proponent, firstName, lastName')
          .eq('id', user.id)
          .single()
        
        if (!error && profile) {
          setUserProfile(profile)
          setIsResearchProponent(profile.is_research_proponent || false)
        }
      }
    })()
  }, [])

  // Fetch real data from Supabase
  useEffect(() => {
    if (!user) {
      setBookmarkCount(0)
      setAccessRequestsCount(0)
      setApprovedCount(0)
      setRecentBookmarkedPapers([])
      setLoading(false)
      return
    }

    const fetchDashboardData = async () => {
      setLoading(true)
      
      try {
        // Fetch bookmarks count and data
        const { data: bookmarksData, error: bookmarksError } = await supabase
          .from("bookmarks")
          .select("id, paper_id, status, access_request_status, is_accessible, created_at, research_papers(*)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (!bookmarksError && bookmarksData) {
          const validBookmarks = bookmarksData.filter(b => b.research_papers)
          setBookmarkCount(validBookmarks.length)
          
          // Get recent 3 bookmarked papers for the Recent Papers section
          setRecentBookmarkedPapers(
            validBookmarks.slice(0, 3).map(b => ({
              ...b.research_papers,
              bookmark_id: b.id,
              bookmarked_date: b.created_at,
              status: b.status ?? b.research_papers.status ?? "bookmarked",
              access_request_status: b.access_request_status ?? b.research_papers.access_request_status ?? null,
              is_accessible: b.is_accessible ?? b.research_papers.is_accessible ?? false,
              isBookmarked: true
            }))
          )

          // Count access requests by status
          const pendingRequests = validBookmarks.filter(b => b.access_request_status === "pending").length
          const approvedRequests = validBookmarks.filter(b => 
            b.access_request_status === "approved" || b.status === "accepted" || b.is_accessible
          ).length
          
          setAccessRequestsCount(pendingRequests)
          setApprovedCount(approvedRequests)
        }

        // Fetch active announcements for students
        const { data: announcementsData, error: announcementsError } = await supabase
          .from("announcements")
          .select("*")
          .eq("status", "active")
          .or("expiration_date.is.null,expiration_date.gte." + new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(5)

        if (!announcementsError && announcementsData) {
          setAnnouncements(announcementsData)
        }

        // Fetch access requests data directly from research_paper_access_requests table
        const { data: accessRequestsData, error: accessRequestsError } = await supabase
          .from("research_paper_access_requests")
          .select("id, status, request_date")
          .eq("student_id", user.id)
          .order("request_date", { ascending: false })

        if (!accessRequestsError && accessRequestsData) {
          const pendingRequests = accessRequestsData.filter(req => req.status === "pending").length
          const approvedRequests = accessRequestsData.filter(req => req.status === "approved").length
          
          // Update the counts with more accurate data from access requests table
          setAccessRequestsCount(pendingRequests)
          setApprovedCount(approvedRequests)
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      }
      
      setLoading(false)
    }

    fetchDashboardData()
  }, [user])

  // Dynamic student stats based on real data
  const studentStats = [
    {
      title: "My Bookmarks",
      value: loading ? "..." : bookmarkCount.toString(),
      icon: Bookmark,
      change: loading ? "Loading..." : `${bookmarkCount} total`,
      changeType: "positive",
    },
    {
      title: "Papers with Access",
      value: loading ? "..." : approvedCount.toString(),
      icon: BookOpen,
      change: loading ? "Loading..." : "Full access granted",
      changeType: "positive",
    },
    {
      title: "Access Granted",
      value: loading ? "..." : approvedCount.toString(),
      icon: CheckCircle,
      change: loading ? "Loading..." : "Approved requests",
      changeType: "positive",
    },
    {
      title: "Pending Requests",
      value: loading ? "..." : accessRequestsCount.toString(),
      icon: Clock,
      change: loading ? "Loading..." : accessRequestsCount > 0 ? `${accessRequestsCount} awaiting review` : "No pending requests",
      changeType: accessRequestsCount > 0 ? "neutral" : "positive",
    },
  ]

  // Use real recent bookmarked papers or fallback to empty array
  const displayPapers = recentBookmarkedPapers.length > 0 ? recentBookmarkedPapers : []

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handlePaperClick = (paper) => {
    setSelectedPaper(paper)
    setShowModal(true)
  }

  const toggleBookmark = async (paperId) => {
    if (!user) return
    
    try {
      // Check if paper is already bookmarked
      const { data: existingBookmark } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("user_id", user.id)
        .eq("paper_id", paperId)
        .single()

      if (existingBookmark) {
        // Remove bookmark
        await supabase
          .from("bookmarks")
          .delete()
          .eq("id", existingBookmark.id)
        
        // Update local state
        setRecentBookmarkedPapers(prev => prev.filter(p => p.id !== paperId))
        setBookmarkCount(prev => prev - 1)
      } else {
        // Add bookmark
        await supabase
          .from("bookmarks")
          .insert([{
            user_id: user.id,
            paper_id: paperId,
            status: "bookmarked"
          }])
        
        // Update counts
        setBookmarkCount(prev => prev + 1)
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error)
    }
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Welcome back, {userProfile?.firstName || user?.user_metadata?.full_name || user?.email || "Student"} 👋
              {isResearchProponent && <span className="ml-2 text-lg">🔬</span>}
            </h1>
            <p className="text-gray-600">
              {isResearchProponent 
                ? "Discover research papers and manage your research projects" 
                : "Discover and explore research papers"}
            </p>
          </div>
        </div>
      </div>

      {/* Student Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {studentStats.map((stat, index) => {
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
                      {stat.change}
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

      {/* Recent Papers Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              {recentBookmarkedPapers.length > 0 ? "Recently Bookmarked Papers" : "Recent Papers"}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate("/student/browse")}>
              <FileText className="w-4 h-4 mr-2" />
              Browse All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-600">Loading recent papers...</div>
          ) : displayPapers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayPapers.map((paper) => (
                <div
                  key={paper.id || paper.bookmark_id}
                  className="bg-white border rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => handlePaperClick(paper)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{paper.title}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleBookmark(paper.id)
                      }}
                    >
                      <Bookmark
                        className={`w-4 h-4 ${paper.isBookmarked ? "fill-blue-600 text-blue-600" : "text-gray-400"}`}
                      />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">By {paper.authors}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {paper.category} • {paper.year_published || paper.year}
                    </span>
                    <div className="flex items-center">
                      <Eye className="w-3 h-3 mr-1" />
                      {paper.views || 0}
                    </div>
                  </div>
                  {/* Show access status for bookmarked papers */}
                  {paper.access_request_status && (
                    <div className="mt-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          paper.access_request_status === "approved" 
                            ? "bg-green-100 text-green-800" 
                            : paper.access_request_status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {paper.access_request_status === "approved" ? "Access Granted" : 
                         paper.access_request_status === "pending" ? "Access Pending" : 
                         "Access Denied"}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookmarked papers yet</h3>
              <p className="text-gray-600 mb-4">Start exploring and bookmark papers you're interested in</p>
              <Button onClick={() => navigate("/student/browse")}>
                <Search className="w-4 h-4 mr-2" />
                Browse Research Papers
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button className="h-12 justify-start bg-transparent" variant="outline" onClick={() => navigate("/student/bookmarks") }>
              <Bookmark className="w-4 h-4 mr-2" />
              My Bookmarks
            </Button>
            <Button className="h-12 justify-start bg-transparent" variant="outline" onClick={() => navigate("/student/browse") }>
              <Search className="w-4 h-4 mr-2" />
              Browse Research
            </Button>
            <Button className="h-12 justify-start bg-transparent" variant="outline" onClick={() => navigate("/student/guidelines") }>
              <BookOpen className="w-4 h-4 mr-2" />
              Research Guidelines
            </Button>
            <Button className="h-12 justify-start bg-transparent" variant="outline" onClick={() => navigate("/student/settings") }>
              <User className="w-4 h-4 mr-2" />
              Profile Settings
            </Button>
          </div>
          
          {/* Research Proponent Actions */}
          {isResearchProponent && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-blue-600" />
                Research Proponent Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button className="h-12 justify-start bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100" variant="outline" onClick={() => navigate("/student/research/projects")}>
                  <FlaskConical className="w-4 h-4 mr-2" />
                  My Research Projects
                </Button>
                <Button className="h-12 justify-start bg-green-50 border-green-200 text-green-700 hover:bg-green-100" variant="outline" onClick={() => navigate("/student/research/submit")}>
                  <Upload className="w-4 h-4 mr-2" />
                  Submit Research
                </Button>
                <Button className="h-12 justify-start bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100" variant="outline" onClick={() => navigate("/student/research/proposals")}>
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Research Proposals
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Announcements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Latest Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-600">Loading announcements...</div>
          ) : announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-gray-900">{announcement.title}</h4>
                    <Badge className={getPriorityColor(announcement.priority)}>
                      {announcement.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{announcement.content}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <User className="w-3 h-3 mr-1" />
                      {announcement.author}
                    </div>
                  </div>
                  {announcement.expiration_date && (
                    <div className="text-xs text-gray-400 mt-1">
                      Expires: {new Date(announcement.expiration_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements</h3>
              <p className="text-gray-600">There are no active announcements at this time.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paper Detail Modal */}
      {showModal && selectedPaper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 pr-4">{selectedPaper.title}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Authors:</strong> {selectedPaper.authors}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Category:</strong> {selectedPaper.category} • <strong>Year:</strong> {selectedPaper.year}
                </p>
                <div className="flex items-center text-sm text-gray-600">
                  <Eye className="w-4 h-4 mr-1" />
                  {selectedPaper.views} views
                </div>
              </div>
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Abstract</h3>
                <p className="text-gray-700 leading-relaxed">{selectedPaper.abstract}</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button className="flex-1">Request Full Access</Button>
                <Button variant="outline" onClick={() => toggleBookmark(selectedPaper.id)}>
                  <Bookmark className={`w-4 h-4 mr-2 ${selectedPaper.isBookmarked ? "fill-current" : ""}`} />
                  {selectedPaper.isBookmarked ? "Bookmarked" : "Bookmark"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentDashboard
