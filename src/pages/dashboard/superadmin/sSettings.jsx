"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Settings,
  Users,
  Shield,
  Bell,
  Database,
  FileText,
  BarChart3,
  Globe,
  Lock,
  Mail,
  Clock,
  AlertTriangle,
  Check,
  X,
} from "lucide-react"

export default function SSettings() {
  const [activeTab, setActiveTab] = useState("system")

  const settingsTabs = [
    { id: "system", label: "System Configuration", icon: Settings },
    { id: "users", label: "User Management", icon: Users },
    { id: "groups", label: "Groups & Projects", icon: FileText },
    { id: "repository", label: "Repository Settings", icon: Database },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "analytics", label: "Analytics & Reports", icon: BarChart3 },
  ]

  const systemSettings = [
    { name: "Application Name", value: "R-kive Capstone Management", type: "text" },
    { name: "Academic Year", value: "2024-2025", type: "select" },
    { name: "Semester", value: "First Semester", type: "select" },
    { name: "Maintenance Mode", value: false, type: "toggle" },
    { name: "Auto Backup", value: true, type: "toggle" },
  ]

  const userSettings = [
    { name: "Max Librarians", value: "15", type: "number" },
    { name: "Max Advisers per Department", value: "20", type: "number" },
    { name: "Student Leader per Group", value: "1", type: "number" },
    { name: "Auto Account Approval", value: false, type: "toggle" },
    { name: "Password Reset Period", value: "90 days", type: "select" },
  ]

  const groupSettings = [
    { name: "Max Group Size", value: "8", type: "number" },
    { name: "Min Group Size", value: "3", type: "number" },
    { name: "Auto Group Assignment", value: true, type: "toggle" },
    { name: "Progress Tracking", value: true, type: "toggle" },
    { name: "Milestone Notifications", value: true, type: "toggle" },
  ]

  const repositorySettings = [
    { name: "Max File Size", value: "50MB", type: "select" },
    { name: "Allowed File Types", value: "PDF, DOCX, PPTX", type: "text" },
    { name: "Auto Approval", value: false, type: "toggle" },
    { name: "Version Control", value: true, type: "toggle" },
    { name: "Public Access", value: false, type: "toggle" },
  ]

  const renderSettingItem = (setting) => (
    <div key={setting.name} className="flex items-center justify-between p-4 border rounded-lg">
      <div>
        <h4 className="font-medium text-gray-900">{setting.name}</h4>
        <p className="text-sm text-gray-500">Configure {setting.name.toLowerCase()}</p>
      </div>
      <div className="flex items-center gap-2">
        {setting.type === "toggle" ? (
          <Button
            variant={setting.value ? "default" : "outline"}
            size="sm"
            className={setting.value ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {setting.value ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        ) : (
          <span className="text-sm font-medium text-gray-700">{setting.value}</span>
        )}
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case "system":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Configuration</h3>
            {systemSettings.map(renderSettingItem)}
          </div>
        )
      case "users":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Management Settings</h3>
            {userSettings.map(renderSettingItem)}
          </div>
        )
      case "groups":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Groups & Projects Settings</h3>
            {groupSettings.map(renderSettingItem)}
          </div>
        )
      case "repository":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Repository Settings</h3>
            {repositorySettings.map(renderSettingItem)}
          </div>
        )
      case "notifications":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h3>
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    Email Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>New Project Submissions</span>
                    <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>User Registration</span>
                    <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>System Alerts</span>
                    <Button variant="outline" size="sm">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )
      case "security":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-blue-600" />
                    Authentication
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Two-Factor Authentication</span>
                    <Button variant="outline" size="sm">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Session Timeout</span>
                    <span className="text-sm font-medium">30 minutes</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Password Complexity</span>
                    <Badge variant="secondary">High</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )
      case "analytics":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics & Reports Settings</h3>
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Data Collection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>User Activity Tracking</span>
                    <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Performance Metrics</span>
                    <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Report Generation</span>
                    <span className="text-sm font-medium">Weekly</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">System Settings ⚙️</h1>
            <p className="text-gray-600">Configure and manage all system settings and preferences</p>
          </div>
          {/* Removed SA avatar icon */}
        </div>
      </div>

      {/* Settings Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Settings Categories</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {settingsTabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                        activeTab === tab.id ? "bg-blue-50 border-r-2 border-blue-600 text-blue-600" : "text-gray-700"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">{renderTabContent()}</CardContent>
          </Card>
        </div>
      </div>

      {/* System Status */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-green-600" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-600">All Systems Operational</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Last Backup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Today at 3:00 AM</p>
            <Badge variant="secondary" className="mt-1">
              Successful
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Pending Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">3 system updates available</p>
            <Button variant="outline" size="sm" className="mt-2 bg-transparent">
              View Updates
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
