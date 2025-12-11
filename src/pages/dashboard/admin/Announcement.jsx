"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Megaphone, Plus, Search, Edit, Trash2, Eye, Calendar, User, Filter, MoreHorizontal } from "lucide-react"
import { supabase } from "@/supabase/client"
import { sendNotificationToStudents } from "../../../utils/sendNotificationToStudents";
import Toast from "@/components/Toast"

const AnnouncementsPage = () => {
  // State for listing, creating, editing, viewing
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false })

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newContent, setNewContent] = useState("")
  const [newPriority, setNewPriority] = useState("low")
  const [newStatus, setNewStatus] = useState("draft")
  const [releaseDate, setReleaseDate] = useState("")
  const [expirationDate, setExpirationDate] = useState("")

  // Edit modal state
  const [editingAnnouncement, setEditingAnnouncement] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', content: '', priority: 'low', status: 'draft', releaseDate: '', expirationDate: '' })

  // View modal state
  const [viewingAnnouncement, setViewingAnnouncement] = useState(null)

  // Toast helper
  const showToast = (message, type = 'success') => setToast({ message, type, visible: true })

  // Fetch announcements
  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) {
      showToast("Failed to fetch announcements: " + error.message, "error")
    } else {
      setAnnouncements(data)
    }
    setLoading(false)
  }

  // Create announcement
  const handleCreateAnnouncement = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      showToast("Title and content are required.", "error")
      return
    }
    const insertData = {
      title: newTitle,
      content: newContent,
      status: newStatus,
      priority: newPriority,
      author: "Admin",
      publish_date: releaseDate ? new Date(releaseDate).toISOString() : null,
      expiration_date: expirationDate ? new Date(expirationDate).toISOString() : null,
    }
    const { error } = await supabase.from("announcements").insert([insertData])
    if (error) {
      showToast("Failed to create announcement: " + error.message, "error")
    } else {
      // Log activity in activities table
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      let activityType = "announcement";
      let activityDescription = `Posted new announcement: ${newTitle}`;
      if (newStatus === "scheduled") {
        activityType = "scheduled";
        activityDescription = `Scheduled announcement: ${newTitle}`;
      }
      if (newStatus === "expired") {
        activityType = "expired";
        activityDescription = `Announcement expired: ${newTitle}`;
      }
      await supabase.from("activities").insert([
        {
          user_id: userId,
          type: activityType,
          description: activityDescription,
          timestamp: new Date().toISOString(),
          target_id: null,
          meta: {
            title: newTitle,
            content: newContent,
            priority: newPriority,
            status: newStatus,
          },
        },
      ]);

      // Send notification to students
      await sendNotificationToStudents(
        "New Announcement Posted",
        `${newTitle} - Check the announcements page for details.`,
        'info',
        '/admin/announcements'
      );
      showToast("Announcement created successfully!", "success")
      setShowCreateModal(false)
      setNewTitle("")
      setNewContent("")
      setNewPriority("low")
      setNewStatus("draft")
      setReleaseDate("")
      setExpirationDate("")
      fetchAnnouncements()
    }
  }

  // Edit announcement (open modal)
  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement)
    setEditForm({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      status: announcement.status,
      releaseDate: announcement.publish_date ? new Date(announcement.publish_date).toISOString().slice(0,16) : "",
      expirationDate: announcement.expiration_date ? new Date(announcement.expiration_date).toISOString().slice(0,16) : "",
    })
  }

  // Save edit
  const handleSaveEdit = async () => {
    if (!editForm.title.trim() || !editForm.content.trim()) {
      showToast("Title and content are required.", "error")
      return
    }
    const updateData = {
      title: editForm.title,
      content: editForm.content,
      priority: editForm.priority,
      status: editForm.status,
      publish_date: editForm.releaseDate ? new Date(editForm.releaseDate).toISOString() : null,
      expiration_date: editForm.expirationDate ? new Date(editForm.expirationDate).toISOString() : null,
    }
    const { error } = await supabase.from("announcements").update(updateData).eq("id", editingAnnouncement.id)
    if (error) {
      showToast("Failed to update announcement: " + error.message, "error")
    } else {
      showToast("Announcement updated!", "success")
      setEditingAnnouncement(null)
      fetchAnnouncements()
    }
  }

  // Delete announcement
  const handleDeleteAnnouncement = async (id) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return
    const { error } = await supabase.from("announcements").delete().eq("id", id)
    if (error) {
      showToast("Failed to delete announcement: " + error.message, "error")
    } else {
      showToast("Announcement deleted.", "success")
      setAnnouncements((prev) => prev.filter(a => a.id !== id))
    }
  }

  // View announcement modal
  const handleViewAnnouncement = (announcement) => setViewingAnnouncement(announcement)

  // Badge helpers
  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { variant: "default", className: "bg-green-100 text-green-800 hover:bg-green-100" },
      draft: { variant: "secondary", className: "bg-gray-100 text-gray-800 hover:bg-gray-100" },
      scheduled: { variant: "outline", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
      archived: { variant: "outline", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
    }
    return statusConfig[status] || statusConfig.draft
  }
  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      high: { variant: "destructive", className: "bg-red-100 text-red-800 hover:bg-red-100" },
      medium: { variant: "outline", className: "bg-orange-100 text-orange-800 hover:bg-orange-100" },
      low: { variant: "secondary", className: "bg-gray-100 text-gray-600 hover:bg-gray-100" },
    }
    return priorityConfig[priority] || priorityConfig.medium
  }

  // Filter for search and status
  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch =
      (announcement.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (announcement.content || "").toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || announcement.status === filterStatus
    return matchesSearch && matchesFilter
  })

  // Stats using live announcements
  const stats = [
    { title: "Total Announcements", value: `${announcements.length}`, icon: Megaphone, change: "", changeType: "neutral" },
    { title: "Active Announcements", value: `${announcements.filter(a => a.status === "active").length}`, icon: Eye, change: "", changeType: "neutral" },
    { title: "Draft Announcements", value: `${announcements.filter(a => a.status === "draft").length}`, icon: Edit, change: "", changeType: "neutral" },
    { title: "Scheduled", value: `${announcements.filter(a => a.status === "scheduled").length}`, icon: Calendar, change: "", changeType: "neutral" },
  ]

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Toast */}
      {toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(t => ({ ...t, visible: false }))}
        />
      )}

      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Announcements</h1>
            <p className="text-gray-600">Manage system announcements and notifications</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Announcement
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
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

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="archived">Archived</option>
              </select>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Announcements Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">All Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading announcements...</div>
            ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Title</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Priority</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Author</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Created</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Expiration Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAnnouncements.map((announcement) => (
                  <tr key={announcement.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900 max-w-xs truncate">{announcement.title}</div>
                        <div className="text-sm text-gray-500 max-w-md truncate mt-1">{announcement.content}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge
                        variant={getStatusBadge(announcement.status).variant}
                        className={getStatusBadge(announcement.status).className}
                      >
                        {announcement.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <Badge
                        variant={getPriorityBadge(announcement.priority).variant}
                        className={getPriorityBadge(announcement.priority).className}
                      >
                        {announcement.priority}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">{announcement.author}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {announcement.created_at
                        ? new Date(announcement.created_at).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {announcement.expiration_date
                        ? new Date(announcement.expiration_date).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewAnnouncement(announcement)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEditAnnouncement(announcement)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteAnnouncement(announcement.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAnnouncements.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      No announcements found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Create New Announcement</h2>
              <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                ×
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <Input
                  placeholder="Enter announcement title..."
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Enter announcement content..."
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value)}
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                  {newStatus === "scheduled" && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Release Date</label>
                      <input
                        type="datetime-local"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={releaseDate}
                        onChange={e => setReleaseDate(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiration Date</label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={expirationDate}
                  onChange={e => setExpirationDate(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreateAnnouncement}>
                  Create Announcement
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingAnnouncement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Announcement</h2>
              <Button variant="ghost" onClick={() => setEditingAnnouncement(null)}>
                ×
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <Input
                  value={editForm.title}
                  onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  value={editForm.content}
                  onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editForm.priority}
                    onChange={e => setEditForm(f => ({ ...f, priority: e.target.value }))}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editForm.status}
                    onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="archived">Archived</option>
                  </select>
                  {editForm.status === "scheduled" && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Release Date</label>
                      <input
                        type="datetime-local"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={editForm.releaseDate}
                        onChange={e => setEditForm(f => ({ ...f, releaseDate: e.target.value }))}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiration Date</label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editForm.expirationDate}
                  onChange={e => setEditForm(f => ({ ...f, expirationDate: e.target.value }))}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setEditingAnnouncement(null)}>
                  Cancel
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveEdit}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingAnnouncement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">{viewingAnnouncement.title}</h2>
              <Button variant="ghost" onClick={() => setViewingAnnouncement(null)}>
                ×
              </Button>
            </div>
            <div className="space-y-3">
              <p className="text-gray-700">{viewingAnnouncement.content}</p>
              <div className="flex gap-3 text-sm">
                <Badge className={getStatusBadge(viewingAnnouncement.status).className}>
                  {viewingAnnouncement.status}
                </Badge>
                <Badge className={getPriorityBadge(viewingAnnouncement.priority).className}>
                  {viewingAnnouncement.priority}
                </Badge>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Author: {viewingAnnouncement.author}<br/>
                Created: {viewingAnnouncement.created_at
                  ? new Date(viewingAnnouncement.created_at).toLocaleString()
                  : ""}<br/>
                {viewingAnnouncement.expiration_date && (
                  <>
                    Expired: {new Date(viewingAnnouncement.expiration_date).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default AnnouncementsPage