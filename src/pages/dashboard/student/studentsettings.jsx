"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Settings,
  User,
  Bell,
  Eye,
  EyeOff,
  Upload,
  Camera,
  Clock,
  MapPin,
  BookOpen,
  Bookmark,
  GitBranch,
  FileText,
} from "lucide-react"
import { useState } from "react"

const StudentSettingsPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [profilePicture, setProfilePicture] = useState("/placeholder.svg?height=80&width=80")
  const [settings, setSettings] = useState({
    // Profile Settings
    studentName: "John Doe",
    studentId: "2024-001234",
    email: "john.doe@student.edu",
    course: "Computer Science",
    yearLevel: "4th Year",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",

    // Dashboard Preferences
    showRecentPapers: true,
    papersPerPage: "12",
    defaultView: "grid",
    showAnnouncements: true,

    // Bookmarks Settings
    autoBookmark: false,
    bookmarkNotifications: true,
    exportFormat: "pdf",
    sortBookmarksBy: "date",

    // Citation Tree Settings
    maxDepth: "3",
    showLabels: true,
    animateTransitions: true,
    highlightConnections: true,

    // Guidelines Settings
    showProgress: true,
    reminderNotifications: true,
    checklistView: true,

    // Notification Settings
    emailNotifications: true,
    newPaperAlerts: true,
    bookmarkReminders: false,
    guidelineUpdates: true,
    systemAnnouncements: true,
  })

  const handleInputChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleProfilePictureUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfilePicture(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = (section) => {
    console.log(`Saving ${section} settings:`, settings)
    alert(`${section} settings saved successfully!`)
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "dashboard", label: "Dashboard", icon: BookOpen },
    { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
    { id: "citation-tree", label: "Citation Tree", icon: GitBranch },
    { id: "guidelines", label: "Guidelines", icon: FileText },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "login-history", label: "Login History", icon: Clock },
  ]

  const loginHistory = [
    {
      id: 1,
      date: "2024-01-15",
      time: "09:30 AM",
      location: "Manila, Philippines",
      device: "Chrome on Windows",
      ip: "192.168.1.100",
      status: "Success",
    },
    {
      id: 2,
      date: "2024-01-14",
      time: "02:15 PM",
      location: "Manila, Philippines",
      device: "Firefox on Windows",
      ip: "192.168.1.100",
      status: "Success",
    },
    {
      id: 3,
      date: "2024-01-13",
      time: "11:45 AM",
      location: "Quezon City, Philippines",
      device: "Chrome on Android",
      ip: "203.177.12.45",
      status: "Success",
    },
  ]

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Student Settings</h1>
            <p className="text-gray-600">Manage your account preferences and customize your experience</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
            <Settings className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Settings Menu</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                      activeTab === tab.id ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600" : "text-gray-600"
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Settings */}
          {activeTab === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Profile Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Picture Section */}
                <div className="flex items-center space-x-6 p-4 bg-gray-50 rounded-lg">
                  <div className="relative">
                    <img
                      src={profilePicture || "/placeholder.svg"}
                      alt="Profile Picture"
                      className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1.5 cursor-pointer hover:bg-blue-700 transition-colors">
                      <Camera className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-2">Profile Picture</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Upload a new profile picture. Recommended size: 200x200px
                    </p>
                    <div className="flex space-x-3">
                      <label className="cursor-pointer">
                        <input type="file" accept="image/*" onChange={handleProfilePictureUpload} className="hidden" />
                        <Button variant="outline" size="sm" className="flex items-center bg-transparent">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload New
                        </Button>
                      </label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProfilePicture("/placeholder.svg?height=80&width=80")}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <Input
                      value={settings.studentName}
                      onChange={(e) => handleInputChange("studentName", e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
                    <Input
                      value={settings.studentId}
                      onChange={(e) => handleInputChange("studentId", e.target.value)}
                      placeholder="Enter student ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <Input
                      type="email"
                      value={settings.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                    <Input
                      value={settings.course}
                      onChange={(e) => handleInputChange("course", e.target.value)}
                      placeholder="Enter your course"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year Level</label>
                    <select
                      value={settings.yearLevel}
                      onChange={(e) => handleInputChange("yearLevel", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="Graduate">Graduate</option>
                    </select>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-md font-medium text-gray-900 mb-4">Change Password</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={settings.currentPassword}
                          onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <Input
                        type="password"
                        value={settings.newPassword}
                        onChange={(e) => handleInputChange("newPassword", e.target.value)}
                        placeholder="Enter new password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                      <Input
                        type="password"
                        value={settings.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => handleSave("Profile")} className="bg-blue-600 hover:bg-blue-700">
                    Save Profile Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dashboard Settings */}
          {activeTab === "dashboard" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Dashboard Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Papers Per Page</label>
                    <select
                      value={settings.papersPerPage}
                      onChange={(e) => handleInputChange("papersPerPage", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="6">6 papers</option>
                      <option value="12">12 papers</option>
                      <option value="24">24 papers</option>
                      <option value="48">48 papers</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Default View</label>
                    <select
                      value={settings.defaultView}
                      onChange={(e) => handleInputChange("defaultView", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="grid">Grid View</option>
                      <option value="list">List View</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Show Recent Papers</h4>
                      <p className="text-sm text-gray-600">Display recently viewed papers on dashboard</p>
                    </div>
                    <button
                      onClick={() => handleInputChange("showRecentPapers", !settings.showRecentPapers)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.showRecentPapers ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.showRecentPapers ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Show Announcements</h4>
                      <p className="text-sm text-gray-600">Display sticky note announcements</p>
                    </div>
                    <button
                      onClick={() => handleInputChange("showAnnouncements", !settings.showAnnouncements)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.showAnnouncements ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.showAnnouncements ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => handleSave("Dashboard")} className="bg-blue-600 hover:bg-blue-700">
                    Save Dashboard Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bookmarks Settings */}
          {activeTab === "bookmarks" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Bookmark className="w-5 h-5 mr-2" />
                  Bookmarks Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                    <select
                      value={settings.exportFormat}
                      onChange={(e) => handleInputChange("exportFormat", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pdf">PDF</option>
                      <option value="csv">CSV</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort Bookmarks By</label>
                    <select
                      value={settings.sortBookmarksBy}
                      onChange={(e) => handleInputChange("sortBookmarksBy", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="date">Date Added</option>
                      <option value="title">Title</option>
                      <option value="author">Author</option>
                      <option value="category">Category</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Auto-bookmark Viewed Papers</h4>
                      <p className="text-sm text-gray-600">Automatically bookmark papers you view</p>
                    </div>
                    <button
                      onClick={() => handleInputChange("autoBookmark", !settings.autoBookmark)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.autoBookmark ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.autoBookmark ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Bookmark Notifications</h4>
                      <p className="text-sm text-gray-600">Get notified about bookmark-related updates</p>
                    </div>
                    <button
                      onClick={() => handleInputChange("bookmarkNotifications", !settings.bookmarkNotifications)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.bookmarkNotifications ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.bookmarkNotifications ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => handleSave("Bookmarks")} className="bg-blue-600 hover:bg-blue-700">
                    Save Bookmark Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Citation Tree Settings */}
          {activeTab === "citation-tree" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <GitBranch className="w-5 h-5 mr-2" />
                  Citation Tree Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Tree Depth</label>
                  <select
                    value={settings.maxDepth}
                    onChange={(e) => handleInputChange("maxDepth", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="2">2 levels</option>
                    <option value="3">3 levels</option>
                    <option value="4">4 levels</option>
                    <option value="5">5 levels</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Show Node Labels</h4>
                      <p className="text-sm text-gray-600">Display paper titles on tree nodes</p>
                    </div>
                    <button
                      onClick={() => handleInputChange("showLabels", !settings.showLabels)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.showLabels ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.showLabels ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Animate Transitions</h4>
                      <p className="text-sm text-gray-600">Enable smooth animations when exploring the tree</p>
                    </div>
                    <button
                      onClick={() => handleInputChange("animateTransitions", !settings.animateTransitions)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.animateTransitions ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.animateTransitions ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Highlight Connections</h4>
                      <p className="text-sm text-gray-600">Highlight related papers when hovering over nodes</p>
                    </div>
                    <button
                      onClick={() => handleInputChange("highlightConnections", !settings.highlightConnections)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.highlightConnections ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.highlightConnections ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => handleSave("Citation Tree")} className="bg-blue-600 hover:bg-blue-700">
                    Save Citation Tree Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Guidelines Settings */}
          {activeTab === "guidelines" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Guidelines Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Show Progress Tracking</h4>
                      <p className="text-sm text-gray-600">Display progress indicators for research milestones</p>
                    </div>
                    <button
                      onClick={() => handleInputChange("showProgress", !settings.showProgress)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.showProgress ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.showProgress ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Reminder Notifications</h4>
                      <p className="text-sm text-gray-600">Get reminders about important deadlines</p>
                    </div>
                    <button
                      onClick={() => handleInputChange("reminderNotifications", !settings.reminderNotifications)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.reminderNotifications ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.reminderNotifications ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Checklist View</h4>
                      <p className="text-sm text-gray-600">Display guidelines as interactive checklists</p>
                    </div>
                    <button
                      onClick={() => handleInputChange("checklistView", !settings.checklistView)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.checklistView ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.checklistView ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => handleSave("Guidelines")} className="bg-blue-600 hover:bg-blue-700">
                    Save Guidelines Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notification Settings */}
          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {[
                    {
                      key: "emailNotifications",
                      label: "Email Notifications",
                      desc: "Receive notifications via email",
                    },
                    {
                      key: "newPaperAlerts",
                      label: "New Paper Alerts",
                      desc: "Get notified when new papers are published",
                    },
                    {
                      key: "bookmarkReminders",
                      label: "Bookmark Reminders",
                      desc: "Reminders to review your bookmarked papers",
                    },
                    {
                      key: "guidelineUpdates",
                      label: "Guideline Updates",
                      desc: "Get notified when research guidelines are updated",
                    },
                    {
                      key: "systemAnnouncements",
                      label: "System Announcements",
                      desc: "Receive important system announcements",
                    },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{item.label}</h4>
                        <p className="text-sm text-gray-600">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => handleInputChange(item.key, !settings[item.key])}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings[item.key] ? "bg-blue-600" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings[item.key] ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => handleSave("Notifications")} className="bg-blue-600 hover:bg-blue-700">
                    Save Notification Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Login History */}
          {activeTab === "login-history" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Login History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Recent login activities for your student account</p>
                    <Button variant="outline" size="sm">
                      Export History
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Date & Time</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Location</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Device</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">IP Address</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loginHistory.map((login) => (
                          <tr key={login.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900">{login.date}</span>
                                <span className="text-sm text-gray-600">{login.time}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-gray-900">{login.location}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-900">{login.device}</td>
                            <td className="py-3 px-4 text-gray-600 font-mono text-sm">{login.ip}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  login.status === "Success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                }`}
                              >
                                {login.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentSettingsPage

