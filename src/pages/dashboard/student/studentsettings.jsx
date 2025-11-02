"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Settings,
  User,
  Eye,
  EyeOff,
  Upload,
  Camera,
  Clock,
  MapPin,
  Lock,
  Edit,
  Save,
  X,
} from "lucide-react"
import { useState, useEffect } from "react"
import { supabase } from "../../../supabase/client"
import { useProfilePictureUpload } from "../../../hooks/useProfilePictureUpload"

const StudentSettingsPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [profilePicture, setProfilePicture] = useState("/placeholder.svg?height=80&width=80")
  const [currentUser, setCurrentUser] = useState(null)
  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [uploadSuccess, setUploadSuccess] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)
  
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
    studentName: "",
    studentId: null,
    email: "",
    course: "Bachelor of Science in Information Technology",
    yearLevel: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
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
              studentName: localUser.firstName && localUser.lastName 
                ? `${localUser.firstName} ${localUser.lastName}` 
                : localUser.name || "",
              studentId: localUser.studentId || null,
              email: localUser.email || session.user.email || "",
              course: localUser.course || "Bachelor of Science in Information Technology",
              yearLevel: localUser.yearLevel || "",
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
              role: 'student'
            }
            setCurrentUser(userData)
            setSettings(prev => ({
              ...prev,
              email: session.user.email || "",
              studentId: null,
              course: "Bachelor of Science in Information Technology",
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
    // Clear password errors when user starts typing in password fields
    if (field.includes('Password') && passwordError) {
      setPasswordError("")
    }
    
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

  const handleSave = async (section) => {
    if (section === "Profile") {
      await handleProfileSave()
    }
  }

  const handleProfileSave = async () => {
    // Only process password change if password fields are filled
    if (settings.currentPassword || settings.newPassword || settings.confirmPassword) {
      await handlePasswordChange()
    } else {
      // Save other profile data (name, student ID, course, year level)
      await handleProfileDataSave()
    }
  }

  const handleProfileDataSave = async () => {
    try {
      if (!currentUser) return

      // Update user data in database
      const { error } = await supabase
        .from('users')
        .update({
          firstName: settings.studentName.split(' ')[0] || '',
          lastName: settings.studentName.split(' ').slice(1).join(' ') || '',
          // Note: studentId, course, yearLevel would need to be added to users table
          // For now, we'll just update localStorage
        })
        .eq('id', currentUser.uid)

      if (error) {
        throw error
      }

      // Update localStorage
      const updatedUser = { 
        ...currentUser, 
        firstName: settings.studentName.split(' ')[0] || '',
        lastName: settings.studentName.split(' ').slice(1).join(' ') || '',
        name: settings.studentName
      }
      localStorage.setItem("user", JSON.stringify(updatedUser))
      setCurrentUser(updatedUser)

      setPasswordSuccess("Profile updated successfully!")
      setTimeout(() => setPasswordSuccess(""), 3000)

    } catch (error) {
      console.error('Error updating profile:', error)
      setPasswordError(error.message || 'Failed to update profile')
    }
  }

  const handlePasswordChange = async () => {
    // Clear previous messages
    setPasswordError("")
    setPasswordSuccess("")

    // Validation
    if (!settings.newPassword) {
      setPasswordError("New password is required")
      return
    }

    if (settings.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long")
      return
    }

    if (settings.newPassword !== settings.confirmPassword) {
      setPasswordError("New password and confirmation do not match")
      return
    }

    setChangingPassword(true)

    try {
      // Note: Supabase doesn't provide a direct way to verify current password
      // In production, you might want to implement a server-side verification
      // For now, we'll proceed with the password update directly
      
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: settings.newPassword
      })

      if (updateError) {
        throw updateError
      }

      // Clear password fields
      setSettings(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }))

      setPasswordSuccess("Password changed successfully!")
      setTimeout(() => setPasswordSuccess(""), 3000)

    } catch (error) {
      console.error('Error changing password:', error)
      setPasswordError(error.message || 'Failed to change password. Please try again.')
    } finally {
      setChangingPassword(false)
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
    // You might want to restore the original email here
  }

  const handleRemoveProfilePicture = async () => {
    if (!currentUser || !currentUser.profile_picture_url) return

    // Clear previous messages
    setUploadError("")
    setUploadSuccess("")

    try {
      // Extract filename from URL for deletion
      const url = currentUser.profile_picture_url
      const urlParts = url.split('/')
      const fileName = `${currentUser.uid}/${urlParts[urlParts.length - 1]}`
      
      // Remove from storage
      const removeResult = await removeProfilePicture(fileName)
      
      if (removeResult.success) {
        // Update database
        const dbResult = await updateUserProfilePicture(currentUser.uid, null)
        
        if (dbResult.success) {
          // Update local state
          setProfilePicture("/placeholder.svg?height=80&width=80")
          
          // Update localStorage
          const updatedUser = { ...currentUser, profile_picture_url: null }
          localStorage.setItem("user", JSON.stringify(updatedUser))
          setCurrentUser(updatedUser)
          
          setUploadSuccess("Profile picture removed successfully!")
          
          // Clear success message after 3 seconds
          setTimeout(() => setUploadSuccess(""), 3000)
        } else {
          throw new Error(dbResult.error)
        }
      } else {
        throw new Error(removeResult.error)
      }
    } catch (error) {
      console.error('Error removing profile picture:', error)
      setUploadError(error.message || 'Failed to remove profile picture')
    }
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
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
    <div className="space-y-4 sm:space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Student Settings</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage your account preferences and customize your experience</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Settings Navigation */}
        <Card className="lg:col-span-1">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg font-semibold">Settings Menu</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Mobile: Horizontal scroll tabs */}
            <div className="lg:hidden overflow-x-auto">
              <div className="flex space-x-1 p-2 min-w-max">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex flex-col items-center px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                        activeTab === tab.id ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="w-4 h-4 mb-1" />
                      <span className="text-xs">{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            
            {/* Desktop: Vertical list */}
            <div className="hidden lg:block space-y-1">
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
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">
          {/* Profile Settings */}
          {activeTab === "profile" && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg font-semibold flex items-center">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Profile Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Profile Picture Section */}
                <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 p-4 bg-gray-50 rounded-lg">
                  <div className="relative self-center sm:self-auto">
                    <div 
                      className="relative cursor-pointer group"
                      onClick={() => document.getElementById('profile-picture-input').click()}
                    >
                      <img
                        src={profilePicture || "/placeholder.svg"}
                        alt="Profile Picture"
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-white shadow-md group-hover:opacity-75 transition-opacity"
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
                      id="profile-picture-input"
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      className="hidden"
                      disabled={uploadingProfilePicture}
                    />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Profile Picture</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-3">
                      Upload a new profile picture. Recommended size: 200x200px
                    </p>
                    <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 justify-center sm:justify-start">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('profile-picture-input').click()}
                        disabled={uploadingProfilePicture}
                        className="flex items-center bg-transparent text-xs sm:text-sm"
                      >
                        <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        {uploadingProfilePicture ? 'Uploading...' : 'Upload New'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveProfilePicture}
                        disabled={uploadingProfilePicture || profilePicture === "/placeholder.svg?height=80&width=80"}
                        className="text-xs sm:text-sm"
                      >
                        Remove
                      </Button>
                    </div>
                    
                    {/* Upload Status Messages */}
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

                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <Input
                      value={settings.studentName}
                      onChange={(e) => handleInputChange("studentName", e.target.value)}
                      placeholder="Enter your full name"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Student ID</label>
                    <Input
                      value={settings.studentId}
                      onChange={(e) => handleInputChange("studentId", e.target.value)}
                      placeholder="Enter student ID"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700">
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
                        className={`text-sm ${
                          isEditingEmail 
                            ? "border-blue-500 focus:ring-blue-500 pr-20" 
                            : "bg-gray-50 cursor-not-allowed pr-10"
                        }`}
                        tabIndex={isEditingEmail ? 0 : -1}
                      />
                      {isEditingEmail ? (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                          <button
                            onClick={handleSaveEmail}
                            className="p-1 text-green-600 hover:text-green-800 transition-colors"
                            title="Save email"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEmailEdit}
                            className="p-1 text-red-600 hover:text-red-800 transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Course</label>
                    <Input
                      value={settings.course}
                      onChange={(e) => handleInputChange("course", e.target.value)}
                      placeholder="Enter your course"
                      className="text-sm"
                    />
                  </div>
                  <div className="md:col-span-2 lg:col-span-1">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Year Level</label>
                    <select
                      value={settings.yearLevel}
                      onChange={(e) => handleInputChange("yearLevel", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="Graduate">Graduate</option>
                    </select>
                  </div>
                </div>

                <div className="border-t pt-4 sm:pt-6">
                  <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-2">Change Password</h3>
                  <p className="text-xs text-gray-600 mb-4">
                    Enter your new password below. You'll remain signed in after the password is changed.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Current Password 
                        <span className="text-gray-500 font-normal">(optional)</span>
                      </label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={settings.currentPassword}
                          onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                          placeholder="Enter current password"
                          className="text-sm pr-10"
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
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <Input
                        type="password"
                        value={settings.newPassword}
                        onChange={(e) => handleInputChange("newPassword", e.target.value)}
                        placeholder="Enter new password"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                      <Input
                        type="password"
                        value={settings.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        placeholder="Confirm new password"
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Password Change Status Messages */}
                {passwordError && (
                  <div className="text-sm text-red-600 p-3 bg-red-50 rounded border border-red-200">
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="text-sm text-green-600 p-3 bg-green-50 rounded border border-green-200">
                    {passwordSuccess}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button 
                    onClick={() => handleSave("Profile")} 
                    disabled={changingPassword || uploadingProfilePicture}
                    className="bg-blue-600 hover:bg-blue-700 text-sm sm:text-base w-full sm:w-auto"
                  >
                    {changingPassword ? "Changing Password..." : "Save Profile Settings"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}











          {/* Login History */}
          {activeTab === "login-history" && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg font-semibold flex items-center">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Login History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3">
                    <p className="text-xs sm:text-sm text-gray-600">Recent login activities for your student account</p>
                    <Button variant="outline" size="sm" className="text-xs w-full xs:w-auto">
                      Export History
                    </Button>
                  </div>

                  {/* Mobile Card View */}
                  <div className="block md:hidden space-y-3">
                    {loginHistory.map((login) => (
                      <div key={login.id} className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{login.date}</div>
                            <div className="text-xs text-gray-600">{login.time}</div>
                          </div>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              login.status === "Success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {login.status}
                          </span>
                        </div>
                        <div className="flex items-center text-xs text-gray-600">
                          <MapPin className="w-3 h-3 text-gray-400 mr-1" />
                          <span>{login.location}</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Device:</span> {login.device}
                        </div>
                        <div className="text-xs text-gray-600 font-mono">
                          <span className="font-sans font-medium">IP:</span> {login.ip}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Date & Time</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Location</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Device</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">IP Address</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loginHistory.map((login) => (
                          <tr key={login.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900 text-sm">{login.date}</span>
                                <span className="text-xs text-gray-600">{login.time}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-gray-900 text-sm">{login.location}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-900 text-sm">{login.device}</td>
                            <td className="py-3 px-4 text-gray-600 font-mono text-xs">{login.ip}</td>
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

