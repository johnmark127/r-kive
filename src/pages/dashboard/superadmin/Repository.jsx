"use client"

import { useState } from "react"
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
} from "lucide-react"

export default function Repository() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")

  // Mock data for repository statistics
  const repositoryStats = [
    {
      title: "Total Projects",
      value: "1,247",
      change: "+23 this month",
      icon: FileText,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Pending Approval",
      value: "18",
      change: "+5 this week",
      icon: Eye,
      color: "bg-yellow-50 text-yellow-600",
    },
    {
      title: "Categories",
      value: "12",
      change: "+2 this semester",
      icon: Tag,
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Total Downloads",
      value: "8,934",
      change: "+156 this week",
      icon: Download,
      color: "bg-purple-50 text-purple-600",
    },
  ]

  // Mock data for recent projects
  const recentProjects = [
    {
      id: 1,
      title: "AI-Powered Student Management System",
      author: "John Doe, Jane Smith",
      department: "Computer Science",
      uploadDate: "2024-01-15",
      status: "approved",
      downloads: 234,
      category: "Software Development",
      tags: ["AI", "Machine Learning", "Web Development"],
    },
    {
      id: 2,
      title: "Sustainable Energy Solutions for Rural Areas",
      author: "Mike Johnson",
      department: "Engineering",
      uploadDate: "2024-01-14",
      status: "pending",
      downloads: 0,
      category: "Environmental Engineering",
      tags: ["Sustainability", "Energy", "Rural Development"],
    },
    {
      id: 3,
      title: "Digital Marketing Strategy for SMEs",
      author: "Sarah Wilson, Tom Brown",
      department: "Business Administration",
      uploadDate: "2024-01-13",
      status: "approved",
      downloads: 156,
      category: "Business Strategy",
      tags: ["Marketing", "Digital", "SME"],
    },
    {
      id: 4,
      title: "Mobile Health Application for Elderly Care",
      author: "Lisa Chen",
      department: "Information Technology",
      uploadDate: "2024-01-12",
      status: "under_review",
      downloads: 0,
      category: "Healthcare Technology",
      tags: ["Mobile App", "Healthcare", "Elderly Care"],
    },
  ]

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

  // Mock data for categories
  const categories = [
    { name: "Software Development", count: 234, color: "bg-blue-100 text-blue-800" },
    { name: "Business Strategy", count: 189, color: "bg-green-100 text-green-800" },
    { name: "Engineering", count: 156, color: "bg-purple-100 text-purple-800" },
    { name: "Healthcare Technology", count: 123, color: "bg-red-100 text-red-800" },
    { name: "Environmental Engineering", count: 98, color: "bg-yellow-100 text-yellow-800" },
    { name: "Data Science", count: 87, color: "bg-indigo-100 text-indigo-800" },
  ]

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
                      <option value="software">Software Development</option>
                      <option value="business">Business Strategy</option>
                      <option value="engineering">Engineering</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="border rounded-md px-3 py-1 text-sm"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="under_review">Under Review</option>
                    </select>
                  </div>
                </div>

                {/* Projects List */}
                <div className="space-y-4">
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
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusBadge(project.status)}
                            <Badge variant="outline">{project.category}</Badge>
                            <span className="text-sm text-gray-500">{project.downloads} downloads</span>
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
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          {project.status === "pending" && (
                            <>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="destructive">
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Categories Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Categories
                  </span>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={category.color}>{category.name}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{category.count}</span>
                        <Button size="sm" variant="ghost">
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      </div>
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
