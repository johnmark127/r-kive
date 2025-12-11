"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  FileText,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  Tag,
  Filter,
  Search,
  Calendar,
  User,
  BookOpen,
  Shield,
  Activity,
  Plus,
  Edit3,
  Loader2,
} from "lucide-react"
import { supabase } from "../../../supabase/client"

export default function Repository() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPapers: 0,
    totalDownloads: 0
  })

  // Fixed 5 categories (matching database values)
  const predefinedCategories = [
    { name: "Database Expert", color: "bg-blue-100 text-blue-800" },
    { name: "Mobile App", color: "bg-green-100 text-green-800" },
    { name: "cai (E-Learning/Computer-Aided Instruction Systems)", color: "bg-purple-100 text-purple-800" },
    { name: "Website", color: "bg-yellow-100 text-yellow-800" },
    { name: "software/hardware", color: "bg-red-100 text-red-800" },
  ]

  useEffect(() => {
    fetchPapers()
    fetchStats()
  }, [])

  const fetchPapers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('research_papers')
        .select('*')
        .order('uploaded_at', { ascending: false })

      if (error) throw error
      setPapers(data || [])
    } catch (error) {
      console.error('Error fetching papers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Fetch total research papers count
      const { count } = await supabase
        .from('research_papers')
        .select('*', { count: 'exact', head: true })

      // Fetch total views from paper_views_log (same as admin dashboard)
      const { count: viewsCount } = await supabase
        .from('paper_views_log')
        .select('paper_id,user_id', { count: 'exact', head: true })

      setStats({
        totalPapers: count || 0,
        totalDownloads: viewsCount || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const filteredPapers = papers.filter(paper => {
    if (selectedCategory === "all") return true
    
    // Case-insensitive comparison and trim whitespace
    const paperCategory = (paper.category || '').toLowerCase().trim()
    const selectedCat = selectedCategory.toLowerCase().trim()
    
    return paperCategory === selectedCat
  })

  const getCategoryCount = (categoryName) => {
    return papers.filter(p => {
      const paperCat = (p.category || '').toLowerCase().trim()
      const searchCat = categoryName.toLowerCase().trim()
      return paperCat === searchCat
    }).length
  }

  // Repository statistics with real data
  const repositoryStats = [
    {
      title: "Total Papers",
      value: stats.totalPapers.toString(),
      change: "Uploaded by admin",
      icon: FileText,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Categories",
      value: "5",
      change: "Research areas",
      icon: Tag,
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Total Views",
      value: stats.totalDownloads.toString(),
      change: "Repository access",
      icon: Eye,
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "This Month",
      value: papers.filter(p => {
        const uploadDate = new Date(p.uploaded_at)
        const now = new Date()
        return uploadDate.getMonth() === now.getMonth() && uploadDate.getFullYear() === now.getFullYear()
      }).length.toString(),
      change: "Recent uploads",
      icon: Calendar,
      color: "bg-yellow-50 text-yellow-600",
    },
  ]

  // Map papers to display format
  const recentProjects = filteredPapers.map(paper => ({
    id: paper.id,
    title: paper.title,
    author: paper.authors || 'Unknown',
    department: paper.category || 'Uncategorized',
    uploadDate: new Date(paper.uploaded_at).toLocaleDateString(),
    status: 'approved',
    downloads: 0,
    category: paper.category,
    tags: paper.keywords ? paper.keywords.split(',').map(k => k.trim()).slice(0, 3) : [],
    year: paper.year_published
  }))

  // Mock data for admin activities
  const adminActivities = [
    {
      id: 1,
      admin: "Dr. Maria Garcia",
      action: "Approved project",
      project: "AI-Powered Student Management System",
      timestamp: "2 hours ago",
      type: "approval",
    },
    {
      id: 2,
      admin: "Prof. David Lee",
      action: "Added new category",
      project: "Healthcare Technology",
      timestamp: "5 hours ago",
      type: "category",
    },
    {
      id: 3,
      admin: "Dr. Sarah Johnson",
      action: "Removed project",
      project: "Outdated System Analysis",
      timestamp: "1 day ago",
      type: "removal",
    },
    {
      id: 4,
      admin: "Prof. Robert Kim",
      action: "Updated tags",
      project: "Digital Marketing Strategy for SMEs",
      timestamp: "2 days ago",
      type: "update",
    },
  ]

  // Categories with counts from database
  const categories = predefinedCategories.map(cat => ({
    ...cat,
    count: getCategoryCount(cat.name)
  }))

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "under_review":
        return <Badge className="bg-blue-100 text-blue-800">Under Review</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    }
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case "approval":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "removal":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "category":
        return <Tag className="h-4 w-4 text-blue-600" />
      case "update":
        return <Edit3 className="h-4 w-4 text-yellow-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Repository Oversight 📚</h1>
              <p className="text-gray-600">Manage and monitor all capstone project submissions</p>
            </div>
            {/* Removed SA avatar icon */}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {repositoryStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-green-600 mt-1">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Projects List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters and Search */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Project Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <select
                      className="border rounded-md px-3 py-1 text-sm"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      <option value="all">All Categories</option>
                      {predefinedCategories.map((cat, idx) => (
                        <option key={idx} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Projects List */}
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : recentProjects.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No papers found
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {recentProjects.map((project) => (
                    <div key={project.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{project.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <span className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {project.author}
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-4 w-4" />
                              {project.department}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {project.uploadDate}
                            </span>
                            {project.year && (
                              <span className="flex items-center gap-1">
                                <FileText className="h-4 w-4" />
                                Year: {project.year}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-green-100 text-green-800">Published</Badge>
                            <Badge variant="outline">{project.category}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {project.tags.map((tag, tagIndex) => (
                              <Badge key={tagIndex} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button size="sm" variant="outline" title="View Paper">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Categories Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={category.color}>{category.name}</Badge>
                      </div>
                      <span className="text-sm text-gray-600">{category.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Admin Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Admin Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {adminActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="p-1 rounded-full bg-gray-100">{getActivityIcon(activity.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.admin}</p>
                        <p className="text-sm text-gray-600">{activity.action}</p>
                        <p className="text-xs text-blue-600 truncate">{activity.project}</p>
                        <p className="text-xs text-gray-500">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
