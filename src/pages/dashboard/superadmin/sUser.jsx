"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Users, UserPlus, Edit3, UserCheck, GraduationCap, Shield, Mail, UsersIcon, Search, Plus, X, Check } from "lucide-react"
import { supabase } from "@/supabase/client"
import { USER_ROLES } from "@/supabase/auth"

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState("admins")
  
  // State for real data counts
  const [adminCount, setAdminCount] = useState(0)
  const [adviserCount, setAdviserCount] = useState(0)
  const [studentCount, setStudentCount] = useState(0)
  const [researchProponentCount, setResearchProponentCount] = useState(0)
  const [loading, setLoading] = useState(true)
  
  // State for real user data
  const [admins, setAdmins] = useState([])
  const [advisers, setAdvisers] = useState([])
  const [students, setStudents] = useState([])

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createUserType, setCreateUserType] = useState('')
  const [createEmail, setCreateEmail] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState('')

  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [editFirstName, setEditFirstName] = useState('')
  const [editLastName, setEditLastName] = useState('')
  const [editRole, setEditRole] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editError, setEditError] = useState('')
  const [editSuccess, setEditSuccess] = useState('')

  // Group assignment modal states
  const [isGroupAssignModalOpen, setIsGroupAssignModalOpen] = useState(false)
  const [groups, setGroups] = useState([])
  const [adviserGroups, setAdviserGroups] = useState({})
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [groupAssignError, setGroupAssignError] = useState('')
  const [groupAssignSuccess, setGroupAssignSuccess] = useState('')
  const [searchGroup, setSearchGroup] = useState('')

  // Adviser selection modal states for new research proponents
  const [isAdviserSelectionModalOpen, setIsAdviserSelectionModalOpen] = useState(false)
  const [newProponentData, setNewProponentData] = useState(null) // Stores user and group data
  const [selectedAdviser, setSelectedAdviser] = useState('')
  const [isAssigningAdviser, setIsAssigningAdviser] = useState(false)
  const [adviserSelectionError, setAdviserSelectionError] = useState('')

  // Fetch real data from Supabase
  const fetchUserData = async () => {
    setLoading(true)
    
    try {
      // Fetch admin users
      const { data: adminData, error: adminError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'admin')
        .order('created_at', { ascending: false })
      
      if (!adminError) {
        setAdmins(adminData.map(user => ({
          id: user.id,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          email: user.email,
          status: "Active", // You can add a status field to your table if needed
          role: "Librarian" // Default role name for display
        })))
        setAdminCount(adminData.length)
      }

      // Fetch adviser users  
      const { data: adviserData, error: adviserError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'adviser')
        .order('created_at', { ascending: false })
      
      if (!adviserError) {
        setAdvisers(adviserData.map(user => ({
          id: user.id,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          email: user.email,
          status: "Active",
          groups: 0, // You might want to count actual groups from another table
          department: "Unknown" // You can add department field to users table
        })))
        setAdviserCount(adviserData.length)
      }

      // Fetch student users (simplified - no groups)
      const { data: allStudentData, error: allStudentError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false })
      
      if (!allStudentError) {
        // Simplified student mapping without groups
        setStudents(allStudentData.map(user => ({
          id: user.id,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          email: user.email,
          status: "Active",
          role: user.is_research_proponent ? "Research Proponent" : "Student",
          group: "No Groups", // Groups functionality removed
          isResearchProponent: user.is_research_proponent || false,
          isGroupLeader: false, // No group leaders without groups
          groupCount: 0 // No groups
        })))
        setStudentCount(allStudentData.length)
        
        // Count actual research proponents from the database
        const proponentCount = allStudentData.filter(student => student.is_research_proponent).length
        setResearchProponentCount(proponentCount)
      }

    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Groups functionality removed - simplified placeholder
  const fetchGroups = async () => {
    setIsLoadingGroups(true)
    try {
      // No groups functionality - set empty arrays
      setGroups([])
      setAdviserGroups({})

    } catch (error) {
      console.error('Groups functionality disabled:', error)
    } finally {
      setIsLoadingGroups(false)
    }
  }

  // Assign adviser to group
  const assignAdviserToGroup = async (adviserId, groupId) => {
    try {
      console.log(`Assigning adviser ${adviserId} to group ${groupId}`)
      
      // Check if assignment already exists
      const { data: existingAssignment, error: checkError } = await supabase
        .from('adviser_group_assignments')
        .select('*')
        .eq('adviser_id', adviserId)
        .eq('group_id', groupId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existingAssignment) {
        console.log('Adviser already assigned to this group')
        return
      }

      // Check if adviser already has 5 groups (maximum limit)
      const { count: adviserGroupCount, error: countError } = await supabase
        .from('adviser_group_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('adviser_id', adviserId)

      if (countError) {
        throw new Error(`Failed to check adviser group count: ${countError.message}`)
      }

      if (adviserGroupCount >= 5) {
        throw new Error(`This adviser already has the maximum of 5 groups assigned. Please remove one before adding another.`)
      }

      // Create new assignment
      const { error: assignError } = await supabase
        .from('adviser_group_assignments')
        .insert([{
          adviser_id: adviserId,
          group_id: groupId,
          assigned_by: JSON.parse(localStorage.getItem('user') || '{}').uid || null,
          assigned_at: new Date().toISOString()
        }])

      if (assignError) {
        throw new Error(`Failed to assign adviser: ${assignError.message}`)
      }

      console.log('Adviser successfully assigned to group')
    } catch (error) {
      console.error('Error assigning adviser to group:', error)
      throw error
    }
  }

  // Groups functionality removed - simplified placeholder
  const removeAdviserFromGroup = async (adviserId, groupId) => {
    setGroupAssignError('Group functionality is not available - groups have been removed')
    setTimeout(() => setGroupAssignError(''), 3000)
  }

  // Open group assignment modal
  const openGroupAssignModal = () => {
    setIsGroupAssignModalOpen(true)
    setGroupAssignError('')
    setGroupAssignSuccess('')
    setSearchGroup('')
    fetchGroups()
  }

  useEffect(() => {
    fetchUserData()
    fetchGroups() // Also fetch groups on component mount
  }, [])

  // Function to create new user
  const createUser = async () => {
    if (!createEmail.trim()) {
      setCreateError('Please enter an email address')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(createEmail)) {
      setCreateError('Please enter a valid email address')
      return
    }

    setIsCreating(true)
    setCreateError('')
    setCreateSuccess('')

    try {
      // Generate a temporary password
      const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`
      
      // Determine role based on user type
      let role = USER_ROLES.STUDENT
      let roleName = 'Student'
      if (createUserType === 'librarian') {
        role = USER_ROLES.ADMIN
        roleName = 'Librarian'
      } else if (createUserType === 'adviser') {
        role = USER_ROLES.ADVISER
        roleName = 'Adviser'
      }

      // Create user with password and role data for email template
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: createEmail,
        password: tempPassword,
        options: {
          data: {
            password: tempPassword, // Include password in email template data
            role: roleName,
            createdByAdmin: true
          }
        }
      })

      if (authError) {
        throw new Error(authError.message)
      }

        // Insert user profile into users table using the user ID from auth
        const userId = authData.user?.id
        if (userId) {
          const { error: insertError } = await supabase
            .from('users')
            .insert([
              {
                id: userId,
                email: createEmail,
                firstName: '',
                lastName: '',
                role: role,
                needs_password_change: true, // Flag for admin-created accounts
                created_at: new Date().toISOString()
              }
            ])

          if (insertError) {
          console.error('Error creating user profile:', insertError)
          setCreateError(`User account created but profile setup failed. Please contact system administrator.`)
          return
        }
      }

      setCreateSuccess(`User account created successfully! A confirmation email with login credentials has been sent to ${createEmail}`)
      setCreateEmail('')
      
      // Refresh user data
      await fetchUserData()
      
      // Close modal after 3 seconds
      setTimeout(() => {
        setIsCreateModalOpen(false)
        setCreateSuccess('')
        setCreateUserType('')
      }, 3000)
      
    } catch (error) {
      console.error('Error creating user:', error)
      
      // Handle specific error cases
      if (error.message.includes('User already registered')) {
        setCreateError('A user with this email already exists')
      } else if (error.message.includes('not_admin')) {
        setCreateError('Admin permissions required. Please contact system administrator.')
      } else {
        setCreateError(error.message || 'Failed to create user')
      }
    } finally {
      setIsCreating(false)
    }
  }

  // Function to open create modal
  const openCreateModal = (userType) => {
    setCreateUserType(userType)
    setIsCreateModalOpen(true)
    setCreateEmail('')
    setCreateError('')
    setCreateSuccess('')
  }

  // Function to open edit modal
  const openEditModal = (user) => {
    setEditUser(user)
    setEditFirstName(user.name.split(' ')[0] || '')
    setEditLastName(user.name.split(' ').slice(1).join(' ') || '')
    setEditRole(user.role === 'Librarian' ? 'admin' : user.role === 'Adviser' ? 'adviser' : 'student')
    setIsEditModalOpen(true)
    setEditError('')
    setEditSuccess('')
  }

  // Function to toggle research proponent status and handle group assignment
  const toggleResearchProponent = async (userId, currentStatus) => {
    try {
      // Get user details first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('firstName, lastName, email')
        .eq('id', userId)
        .single()

      if (userError) {
        throw userError
      }

      const userName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email

      // If promoting to research proponent, show adviser selection modal
      if (!currentStatus) {
        // Store user data for the modal
        setNewProponentData({
          userId,
          userName,
          userEmail: userData.email
        })
        setIsAdviserSelectionModalOpen(true)
        setSelectedAdviser('')
        setAdviserSelectionError('')
        return // Don't proceed with promotion yet
      }

      // If removing research proponent status, proceed normally
      await updateResearchProponentStatus(userId, currentStatus, userName)

    } catch (error) {
      console.error('Error updating research proponent status:', error)
    }
  }

  // Function to actually update the research proponent status
  const updateResearchProponentStatus = async (userId, currentStatus, userName) => {
    try {
      // Update research proponent status
      const { error } = await supabase
        .from('users')
        .update({
          is_research_proponent: !currentStatus
        })
        .eq('id', userId)

      if (error) {
        throw new Error(error.message)
      }

      // If promoting to research proponent, create/assign a group
      if (!currentStatus) { // Becoming a research proponent
        console.log(`Promoting ${userName} to research proponent...`)
        const groupId = await handleResearchProponentGroupAssignment(userId, userName)
        console.log(`Group creation result: ${groupId}`)
        return groupId
      } else { // Removing research proponent status
        console.log(`Removing research proponent status for ${userName}...`)
        await handleResearchProponentGroupRemoval(userId)
        return null
      }
    } catch (error) {
      console.error('Error updating research proponent status:', error)
      throw error
    }
  }

  // Function to handle adviser selection and complete the promotion process
  const handleAdviserSelection = async () => {
    if (!selectedAdviser) {
      setAdviserSelectionError('Please select an adviser')
      return
    }

    setIsAssigningAdviser(true)
    setAdviserSelectionError('')

    try {
      console.log('Starting adviser selection process...', {
        userId: newProponentData.userId,
        adviserId: selectedAdviser,
        userName: newProponentData.userName
      })

      // First, promote the student to research proponent
      const groupId = await updateResearchProponentStatus(
        newProponentData.userId, 
        false, // false means they're becoming a research proponent
        newProponentData.userName
      )

      console.log('Promotion completed, group ID:', groupId)

      if (groupId) {
        // Then assign the selected adviser to the group
        await assignAdviserToGroup(selectedAdviser, groupId)
        console.log('Adviser assigned successfully')
      } else {
        console.warn('No group ID returned, adviser assignment skipped')
      }

      // Refresh user data to update the UI
      await fetchUserData()
      console.log('User data refreshed')

      // Send notification to the promoted student
      try {
        const { data: adviserData } = await supabase
          .from('users')
          .select('firstName, lastName, email')
          .eq('id', selectedAdviser)
          .single();

        const adviserName = adviserData 
          ? `${adviserData.firstName || ''} ${adviserData.lastName || ''}`.trim() || adviserData.email
          : 'your adviser';

        await supabase
          .from('notifications')
          .insert([{
            user_id: newProponentData.userId,
            title: 'Promoted to Research Proponent! 🎓',
            message: `Congratulations! You have been promoted to Research Proponent. ${adviserName} has been assigned as your adviser. You can now submit research proposals.`,
            type: 'success',
            read: false,
            link: '/student/research/proposals'
          }]);

        console.log('Promotion notification sent to student');
      } catch (notifError) {
        console.error('Error sending promotion notification:', notifError);
      }

      // Close modal and show success
      setIsAdviserSelectionModalOpen(false)
      setNewProponentData(null)
      setSelectedAdviser('')

      alert(`Successfully promoted ${newProponentData.userName} to Research Proponent and assigned adviser!`)

    } catch (error) {
      console.error('Error in adviser selection process:', error)
      setAdviserSelectionError(`Failed to assign adviser: ${error.message}`)
    } finally {
      setIsAssigningAdviser(false)
    }
  }

  // Create a group when promoting student to research proponent
  const handleResearchProponentGroupAssignment = async (userId, userName) => {
    try {
      console.log(`Creating group for research proponent ${userName}`)
      
      // Generate a unique group name in case of duplicates
      let groupName = `${userName}'s Research Group`
      let attempt = 1
      
      // Check if group name already exists and make it unique
      while (attempt <= 10) { // Limit attempts to prevent infinite loop
        const { data: existingGroup, error: checkError } = await supabase
          .from('student_groups')
          .select('id')
          .eq('group_name', groupName)
          .single()

        if (checkError && checkError.code === 'PGRST116') {
          // No existing group found, name is unique
          break
        } else if (!checkError && existingGroup) {
          // Group name exists, try a different one
          attempt++
          groupName = `${userName}'s Research Group (${attempt})`
        } else {
          // Other error occurred
          console.error('Error checking group name:', checkError)
          break
        }
      }
      
      // Create a new group for the research proponent
      const groupData = {
        group_name: groupName,
        description: `Research group led by ${userName}`,
        research_focus: 'To be determined based on research proposal',
        max_members: 5,
        is_active: true,
        created_by: userId,
        leader_id: userId // Set the student as the group leader
        // created_at and updated_at will be set automatically by database defaults
      }

      const { data: groupResult, error: groupError } = await supabase
        .from('student_groups')
        .insert([groupData])
        .select()
        .single()

      if (groupError) {
        console.error('Error creating group:', groupError)
        throw new Error(`Failed to create group: ${groupError.message}`)
      }

      console.log('Group created successfully:', groupResult)
      return groupResult.id
    } catch (error) {
      console.error('Error in group creation:', error)
      throw error
    }
  }

  // Removed - no longer needed since groups are removed

  // Remove group when removing research proponent status
  const handleResearchProponentGroupRemoval = async (userId) => {
    try {
      console.log(`Removing group for user ${userId}`)
      
      // Find and deactivate the group created by this user
      const { error: groupError } = await supabase
        .from('student_groups')
        .update({ is_active: false })
        .eq('created_by', userId)

      if (groupError) {
        console.error('Error deactivating group:', groupError)
        // Don't throw error, just log it as this is cleanup
      }

      // Also remove any adviser assignments for this user's groups
      const { data: userGroups } = await supabase
        .from('student_groups')
        .select('id')
        .eq('created_by', userId)

      if (userGroups && userGroups.length > 0) {
        const groupIds = userGroups.map(g => g.id)
        const { error: assignmentError } = await supabase
          .from('adviser_group_assignments')
          .delete()
          .in('group_id', groupIds)

        if (assignmentError) {
          console.error('Error removing adviser assignments:', assignmentError)
          // Don't throw error, just log it as this is cleanup
        }
      }

      console.log(`Group cleanup completed for user ${userId}`)
    } catch (error) {
      console.error('Error in group removal:', error)
      // Don't throw error to prevent blocking the main operation
    }
  }

  // Function to edit user
  const editUserInfo = async () => {
    if (!editFirstName.trim() && !editLastName.trim()) {
      setEditError('Please enter at least a first name or last name')
      return
    }

    setIsEditing(true)
    setEditError('')
    setEditSuccess('')

    try {
      const { error } = await supabase
        .from('users')
        .update({
          firstName: editFirstName.trim(),
          lastName: editLastName.trim(),
          role: editRole
        })
        .eq('id', editUser.id)

      if (error) {
        throw new Error(error.message)
      }

      setEditSuccess('User information updated successfully!')
      
      // Refresh user data
      await fetchUserData()
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setIsEditModalOpen(false)
        setEditSuccess('')
        setEditUser(null)
      }, 2000)

    } catch (error) {
      console.error('Error updating user:', error)
      setEditError(error.message || 'Failed to update user')
    } finally {
      setIsEditing(false)
    }
  }

  const stats = [
    {
      title: "Total Admins (Librarians)",
      value: loading ? "..." : adminCount.toString(),
      change: "+2 this month",
      icon: Shield,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Total Advisers",
      value: loading ? "..." : adviserCount.toString(),
      change: "+5 this month",
      icon: GraduationCap,
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Total Students",
      value: loading ? "..." : studentCount.toString(),
      change: "+89 this month",
      icon: Users,
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Research Proponents",
      value: loading ? "..." : researchProponentCount.toString(),
      change: "+12 this month",
      icon: UserCheck,
      color: "bg-orange-50 text-orange-600",
    },
  ]

  const renderUserList = (users, type) => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-gray-100 rounded-lg animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-32"></div>
                  <div className="h-3 bg-gray-300 rounded w-48"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (users.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No {type} found</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium text-gray-900">{user.name}</h4>
                <p className="text-sm text-gray-500">{user.email}</p>
                {type === "advisers" && (
                  <div>
                    <p className="text-xs text-gray-400">
                      {user.department} • {(adviserGroups[user.id] || []).length} groups assigned
                    </p>
                    {(adviserGroups[user.id] || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(adviserGroups[user.id] || []).slice(0, 3).map(groupId => {
                          const group = groups.find(g => g.id === groupId)
                          return group ? (
                            <span key={groupId} className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                              {group.group_name}
                            </span>
                          ) : null
                        })}
                        {(adviserGroups[user.id] || []).length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{(adviserGroups[user.id] || []).length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {type === "students" && (
                  <div>
                    <p className="text-xs text-gray-400">
                      {user.group} • {user.role}
                      {user.isResearchProponent && <span className="ml-2 text-orange-600 font-medium">🔬 Research Proponent</span>}
                      {user.isGroupLeader && <span className="ml-2 text-blue-600 font-medium">👑 Group Leader</span>}
                    </p>
                    {/* Group count removed - groups functionality disabled */}
                  </div>
                )}
                {type === "admins" && <p className="text-xs text-gray-400">{user.role}</p>}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={user.status === "Active" ? "default" : "secondary"}>{user.status}</Badge>
              {user.isResearchProponent && (
                <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
                  Research Proponent
                </Badge>
              )}
              {user.isGroupLeader && (
                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                  Group Leader
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={() => openEditModal(user)}>
                <Edit3 className="h-4 w-4" />
              </Button>
              {type === "students" && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toggleResearchProponent(user.id, user.isResearchProponent)}
                  className={user.isResearchProponent ? "bg-orange-50 text-orange-600 hover:bg-orange-100" : ""}
                >
                  <UserCheck className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Welcome Card */}
      <div className="bg-white rounded-lg p-6 shadow-sm border mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">User Management Dashboard</h1>
            <p className="text-gray-600">Comprehensive user account management and permissions control</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
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

      {/* Management Sections */}
      <div className="space-y-8">
        {/* Admins Section */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Admins (Librarians)
              </CardTitle>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => openCreateModal('librarian')}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Librarian
              </Button>
            </div>
            <p className="text-sm text-gray-600">Create / Edit / Remove Librarian accounts</p>
          </CardHeader>
          <CardContent className="p-6">{renderUserList(admins, "admins")}</CardContent>
        </Card>

        {/* Advisers Section */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-green-600" />
                Advisers
              </CardTitle>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={openGroupAssignModal}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Assign to Groups
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => openCreateModal('adviser')}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Adviser
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-600">Create / Edit / Remove Adviser accounts • Assign advisers to groups</p>
          </CardHeader>
          <CardContent className="p-6">{renderUserList(advisers, "advisers")}</CardContent>
        </Card>

        {/* Students Section */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Students
              </CardTitle>
              <div className="flex space-x-2">
                <Button variant="outline">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Assign Proponents
                </Button>
                <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => openCreateModal('student')}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              View student list • Assign Research Proponents • Manage student accounts
            </p>
          </CardHeader>
          <CardContent className="p-6">{renderUserList(students, "students")}</CardContent>
        </Card>
      </div>

      {/* Create User Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Create New {createUserType === 'librarian' ? 'Librarian' : createUserType === 'adviser' ? 'Adviser' : 'Student'} Account
            </DialogTitle>
            <DialogDescription>
              Enter the email address to create a new {createUserType === 'librarian' ? 'librarian' : createUserType === 'adviser' ? 'adviser' : 'student'} account. The user will receive an email with their login credentials.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter user email address"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                disabled={isCreating}
              />
              <p className="text-xs text-gray-500">
                A confirmation email with login credentials will be sent to the user.
              </p>
            </div>

            {createError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{createError}</p>
              </div>
            )}

            {createSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-600 font-medium">{createSuccess}</p>
                <p className="text-xs text-green-500 mt-1">
                  The user will receive an email invitation to complete their account setup.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={createUser}
              disabled={isCreating || !createEmail.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isCreating ? 'Creating...' : 'Create Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Edit User Information
            </DialogTitle>
            <DialogDescription>
              Update the user's personal information and role.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                  First Name
                </label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="First name"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  disabled={isEditing}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Last name"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  disabled={isEditing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium text-gray-700">
                User Role
              </label>
              <select
                id="role"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                disabled={isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="admin">Librarian (Admin)</option>
                <option value="adviser">Adviser</option>
                <option value="student">Student</option>
              </select>
            </div>

            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
              <strong>Current Email:</strong> {editUser?.email}
              <br />
              <em>Email cannot be changed through this interface.</em>
            </div>

            {editError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{editError}</p>
              </div>
            )}

            {editSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-600 font-medium">{editSuccess}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isEditing}
            >
              Cancel
            </Button>
            <Button
              onClick={editUserInfo}
              disabled={isEditing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isEditing ? 'Updating...' : 'Update User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Assignment Modal */}
      <Dialog open={isGroupAssignModalOpen} onOpenChange={setIsGroupAssignModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5" />
              Assign Advisers to Groups
            </DialogTitle>
            <DialogDescription>
              Manage group assignments for advisers. Click on a group to assign/remove advisers.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 overflow-y-auto max-h-[60vh]">
            {/* Search Groups */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search groups..."
                value={searchGroup}
                onChange={(e) => setSearchGroup(e.target.value)}
                className="pl-10"
              />
            </div>

            {groupAssignError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{groupAssignError}</p>
              </div>
            )}

            {groupAssignSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-600 font-medium">{groupAssignSuccess}</p>
              </div>
            )}

            {isLoadingGroups ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 bg-gray-100 rounded-lg animate-pulse">
                    <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {groups
                  .filter(group => 
                    group.group_name.toLowerCase().includes(searchGroup.toLowerCase()) ||
                    group.description?.toLowerCase().includes(searchGroup.toLowerCase())
                  )
                  .map((group) => {
                    const assignedAdvisers = advisers.filter(adviser => 
                      (adviserGroups[adviser.id] || []).includes(group.id)
                    )
                    const unassignedAdvisers = advisers.filter(adviser => 
                      !(adviserGroups[adviser.id] || []).includes(group.id)
                    )

                    return (
                      <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-medium text-gray-900">{group.group_name}</h3>
                            <p className="text-sm text-gray-600">{group.description || 'No description'}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Created: {new Date(group.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {assignedAdvisers.length} adviser{assignedAdvisers.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>

                        {/* Assigned Advisers */}
                        {assignedAdvisers.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Assigned Advisers:</h4>
                            <div className="flex flex-wrap gap-2">
                              {assignedAdvisers.map(adviser => (
                                <div key={adviser.id} className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-md text-sm">
                                  <span>{adviser.name}</span>
                                  <button
                                    onClick={() => removeAdviserFromGroup(adviser.id, group.id)}
                                    className="text-green-600 hover:text-red-600 transition-colors"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Available Advisers */}
                        {unassignedAdvisers.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Available Advisers:</h4>
                            <div className="flex flex-wrap gap-2">
                              {unassignedAdvisers.map(adviser => (
                                <button
                                  key={adviser.id}
                                  onClick={() => assignAdviserToGroup(adviser.id, group.id)}
                                  className="flex items-center gap-2 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 px-3 py-1 rounded-md text-sm transition-colors"
                                >
                                  <Plus className="h-3 w-3" />
                                  <span>{adviser.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {assignedAdvisers.length === 0 && unassignedAdvisers.length === 0 && (
                          <p className="text-sm text-gray-500 italic">No advisers available</p>
                        )}
                      </div>
                    )
                  })}

                {groups.length === 0 && !isLoadingGroups && (
                  <div className="text-center py-8 text-gray-500">
                    <UsersIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No groups found</p>
                    <p className="text-sm text-gray-400 mt-1">Groups will appear here when created</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsGroupAssignModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adviser Selection Modal for New Research Proponents */}
      <Dialog open={isAdviserSelectionModalOpen} onOpenChange={setIsAdviserSelectionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-green-600" />
              Assign Adviser to Research Proponent
            </DialogTitle>
            <DialogDescription>
              Promote {newProponentData?.userName} to Research Proponent and assign an adviser.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="adviser" className="text-sm font-medium text-gray-700">
                Select Adviser *
              </label>
              <select
                id="adviser"
                value={selectedAdviser}
                onChange={(e) => setSelectedAdviser(e.target.value)}
                disabled={isAssigningAdviser}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Choose an adviser...</option>
                {advisers.map((adviser) => (
                  <option key={adviser.id} value={adviser.id}>
                    {adviser.name}
                  </option>
                ))}
              </select>
            </div>

            {adviserSelectionError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{adviserSelectionError}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAdviserSelectionModalOpen(false)
                setNewProponentData(null)
                setSelectedAdviser('')
                setAdviserSelectionError('')
              }}
              disabled={isAssigningAdviser}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdviserSelection}
              disabled={isAssigningAdviser || !selectedAdviser}
              className="bg-green-600 hover:bg-green-700"
            >
              {isAssigningAdviser ? 'Processing...' : 'Promote & Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default UserManagement
