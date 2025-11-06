"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Settings, User, Shield, Save, Eye, EyeOff, Upload, Camera, Clock, MapPin, Lock, Edit, X } from "lucide-react"
import { useState, useEffect } from "react"
import { supabase } from "../../../supabase/client"
import { useProfilePictureUpload } from "../../../hooks/useProfilePictureUpload"

const SettingsPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [profilePicture, setProfilePicture] = useState("/admin-profile.png")
  const [currentUser, setCurrentUser] = useState(null)
  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [uploadSuccess, setUploadSuccess] = useState("")
  
  // Profile picture upload hook
  const {
    uploading: uploadingProfilePicture,
    uploadProgress,
    uploadProfilePicture,
    removeProfilePicture,
    updateUserProfilePicture
  } = useProfilePictureUpload()

  const [settings, setSettings] = useState({
    // Profile Settings
    adminName: "Administrator",
    email: "admin@rkive.edu",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",

    // Security Settings
    sessionTimeout: "30",
    maxLoginAttempts: "5",
    requireStrongPasswords: true,
    twoFactorAuth: false,
  })

  // Get current user data
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
          return
        }
        
        if (session?.user) {
          const localUser = JSON.parse(localStorage.getItem("user") || "{}")
          if (localUser.uid) {
            setCurrentUser(localUser)
            // Update settings with real user data
            setSettings(prev => ({
              ...prev,
              adminName: localUser.firstName && localUser.lastName 
                ? `${localUser.firstName} ${localUser.lastName}` 
                : localUser.name || "Administrator",
              email: localUser.email || session.user.email || "",
            }))
            
            // Set profile picture from database
            if (localUser.profile_picture_url) {
              setProfilePicture(localUser.profile_picture_url)
            }
          } else {
            // Fallback to session data
            const userData = {
              uid: session.user.id,
              email: session.user.email,
              role: 'admin'
            }
            setCurrentUser(userData)
            setSettings(prev => ({
              ...prev,
              email: session.user.email || "",
            }))
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      }
    }

    getCurrentUser()
  }, [])

  const handleInputChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0]
    if (!file || !currentUser) return

    // Clear previous messages
    setUploadError("")
    setUploadSuccess("")

    try {
      // Upload to Supabase storage
      const uploadResult = await uploadProfilePicture(file, currentUser.uid)
      
      if (uploadResult.success) {
        // Update database
        const dbResult = await updateUserProfilePicture(currentUser.uid, uploadResult.url)
        
        if (dbResult.success) {
          // Update local state
          setProfilePicture(uploadResult.url)
          
          // Update localStorage
          const updatedUser = { ...currentUser, profile_picture_url: uploadResult.url }
          localStorage.setItem("user", JSON.stringify(updatedUser))
          setCurrentUser(updatedUser)
          
          setUploadSuccess("Profile picture updated successfully!")
          
          // Clear success message after 3 seconds
          setTimeout(() => setUploadSuccess(""), 3000)
        } else {
          throw new Error(dbResult.error)
        }
      } else {
        throw new Error(uploadResult.error)
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error)
      setUploadError(error.message || 'Failed to upload profile picture')
    }
    
    // Clear the file input
    event.target.value = ''
  }

  const handleRemoveProfilePicture = async () => {
    if (!currentUser) return

    setUploadError("")
    setUploadSuccess("")

    try {
      const result = await removeProfilePicture(currentUser.uid)
      
      if (result.success) {
        setProfilePicture("/admin-profile.png")
        
        const updatedUser = { ...currentUser, profile_picture_url: null }
        localStorage.setItem("user", JSON.stringify(updatedUser))
        setCurrentUser(updatedUser)
        
        setUploadSuccess("Profile picture removed successfully!")
        setTimeout(() => setUploadSuccess(""), 3000)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error removing profile picture:', error)
      setUploadError(error.message || 'Failed to remove profile picture')
    }
  }

  const handleEditEmail = () => {
    setIsEditingEmail(true)
  }

  const handleSaveEmail = () => {
    // Here you would typically call an API to update the email
    console.log('Saving new email:', settings.email)
    setIsEditingEmail(false)
    alert('Email updated successfully!')
  }

  const handleCancelEmailEdit = () => {
    // Reset email to original value if needed
    setIsEditingEmail(false)
  }

  const handleSave = (section) => {
    // Handle save logic here
    console.log(`Saving ${section} settings:`, settings)
    alert(`${section} settings saved successfully!`)
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
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
    {
      id: 4,
      date: "2024-01-12",
      time: "08:20 AM",
      location: "Unknown Location",
      device: "Safari on macOS",
      ip: "45.123.67.89",
      status: "Failed",
    },
    {
      id: 5,
      date: "2024-01-11",
      time: "04:30 PM",
      location: "Manila, Philippines",
      device: "Chrome on Windows",
      ip: "192.168.1.100",
      status: "Success",
    },
  ]

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
            <p className="text-gray-600">Manage your admin panel configuration and preferences</p>
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
                    <div 
                      className="relative cursor-pointer group"
                      onClick={() => document.getElementById('admin-profile-picture-input').click()}
                    >
                      <img
                        src={profilePicture || "/placeholder.svg"}
                        alt="Profile Picture"
                        className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md group-hover:opacity-75 transition-opacity"
                      />
                      {uploadingProfilePicture && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                          <div className="text-white text-xs font-medium">{uploadProgress}%</div>
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1.5 cursor-pointer hover:bg-blue-700 transition-colors group-hover:bg-blue-700">
                        <Camera className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <input
                      id="admin-profile-picture-input"
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      className="hidden"
                      disabled={uploadingProfilePicture}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-2">Profile Picture</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Upload a new profile picture. Recommended size: 200x200px
                    </p>
                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('admin-profile-picture-input').click()}
                        disabled={uploadingProfilePicture}
                        className="flex items-center bg-transparent"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadingProfilePicture ? 'Uploading...' : 'Upload New'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveProfilePicture}
                        disabled={uploadingProfilePicture || profilePicture === "/admin-profile.png"}
                      >
                        Remove
                      </Button>
                    </div>
                    {uploadError && (
                      <div className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded border border-red-200">
                        {uploadError}
                      </div>
                    )}
                    {uploadSuccess && (
                      <div className="text-xs text-green-600 mt-2 p-2 bg-green-50 rounded border border-green-200">
                        {uploadSuccess}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Admin Name</label>
                    <Input
                      value={settings.adminName}
                      onChange={(e) => handleInputChange("adminName", e.target.value)}
                      placeholder="Enter admin name"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Email Address
                        {!isEditingEmail && (
                          <span className="ml-1 text-xs text-gray-500">(Account Email)</span>
                        )}
                      </label>
                      {!isEditingEmail && (
                        <button
                          onClick={handleEditEmail}
                          className="flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Change Email
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        type="email"
                        value={settings.email}
                        onChange={isEditingEmail ? (e) => handleInputChange("email", e.target.value) : undefined}
                        readOnly={!isEditingEmail}
                        className={`${
                          isEditingEmail 
                            ? "border-blue-500 focus:ring-blue-500 pr-20" 
                            : "bg-gray-50 cursor-not-allowed pr-10"
                        }`}
                        tabIndex={isEditingEmail ? 0 : -1}
                      />
                      {isEditingEmail ? (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                          <button
                            onClick={handleSaveEmail}
                            className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            title="Save"
                          >
                            <Save className="w-3 h-3" />
                          </button>
                          <button
                            onClick={handleCancelEmailEdit}
                            className="p-1.5 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors"
                            title="Cancel"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Lock className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                    {!isEditingEmail && (
                      <p className="text-xs text-gray-500 mt-1">
                        <Lock className="w-3 h-3 inline mr-1" />
                        This is your account email. Click "Change Email" to update.
                      </p>
                    )}
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
                    <Save className="w-4 h-4 mr-2" />
                    Save Profile Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}





          {/* Security Settings */}
          {activeTab === "security" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                    <Input
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => handleInputChange("sessionTimeout", e.target.value)}
                      placeholder="Enter session timeout"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
                    <Input
                      type="number"
                      value={settings.maxLoginAttempts}
                      onChange={(e) => handleInputChange("maxLoginAttempts", e.target.value)}
                      placeholder="Enter max login attempts"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Require Strong Passwords</h4>
                      <p className="text-sm text-gray-600">Enforce strong password requirements for all users</p>
                    </div>
                    <button
                      onClick={() => handleInputChange("requireStrongPasswords", !settings.requireStrongPasswords)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.requireStrongPasswords ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.requireStrongPasswords ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                      <p className="text-sm text-gray-600">Enable two-factor authentication for admin accounts</p>
                    </div>
                    <button
                      onClick={() => handleInputChange("twoFactorAuth", !settings.twoFactorAuth)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.twoFactorAuth ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.twoFactorAuth ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Shield className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Security Recommendations</h4>
                      <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                        <li>• Enable two-factor authentication for enhanced security</li>
                        <li>• Use strong passwords with at least 12 characters</li>
                        <li>• Regularly review user access and permissions</li>
                        <li>• Keep session timeouts reasonable (15-60 minutes)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => handleSave("Security")} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save Security Settings
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
                    <p className="text-sm text-gray-600">Recent login activities for your admin account</p>
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

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <Shield className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                      <div>
                        <h4 className="font-medium text-blue-800">Security Notice</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          If you notice any suspicious login activity, please change your password immediately and
                          enable two-factor authentication.
                        </p>
                      </div>
                    </div>
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

export default SettingsPage
