"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Users,
  Eye,
  Calendar,
  UserCheck,
  RotateCcw,
  GraduationCap,
  BookOpen,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Save,
  X,
  FileText,
  MessageSquare,
} from "lucide-react"
import { supabase } from "../../../supabase/client"

export default function GroupManagement() {
  // State for all projects
  const [projects, setProjects] = useState([]);
  // Details modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [projectDetails, setProjectDetails] = useState(null);
  // Fetch all projects for superadmin view
  useEffect(() => {
    const fetchAllProjects = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('research_projects')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setProjects(data || []);
      setLoading(false);
    };
    fetchAllProjects();
  }, []);

  // View Details handler (modal logic)
  const handleViewDetails = async (project) => {
    setSelectedProject(project);
    setLoadingDetails(true);
    setShowDetailsModal(true);
    try {
      // Fetch proposals for this group
      const { data: proposals } = await supabase
        .from('research_proposals')
        .select('*')
        .eq('group_id', project.group_id);
      // Fetch full project details
      const { data: fullProject } = await supabase
        .from('research_projects')
        .select('*')
        .eq('id', project.id)
        .single();
      setProjectDetails({
        ...project,
        proposals: proposals || [],
        fullProject: fullProject || {},
      });
    } catch (error) {
      setProjectDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };
  const [groups, setGroups] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [newGroup, setNewGroup] = useState({
    group_name: '',
    description: '',
    research_focus: '',
    max_members: 5,
    adviser_id: '',
    student_leader_id: ''
  })

  // Fetch all data on component mount
  useEffect(() => {
    fetchGroups()
    fetchUsers()
  }, [])

  const fetchGroups = async () => {
    try {
      setLoading(true)
      
      // Fetch groups with related data
      const { data: groupsData, error: groupsError } = await supabase
        .from('student_groups')
        .select(`*`)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (groupsError) {
        console.error('Error fetching groups:', groupsError)
        // If table doesn't exist, create mock data structure
        if (groupsError.code === '42P01') {
          console.warn('Groups table not found. Using fallback data.')
          setGroups([])
          return
        }
        throw groupsError
      }

      // Fetch research project submissions to calculate actual progress
      let researchProjects = []
      try {
        const { data: projectsData, error: projectsError } = await supabase
          .from('research_proposals')
          .select('group_id, status')
        
        if (!projectsError) {
          researchProjects = projectsData || []
        }
      } catch (error) {
        console.warn('Could not fetch research proposals for progress calculation:', error)
      }

      // Fetch user details for all group members and creators
      const allUserIds = new Set()
      
      groupsData?.forEach(group => {
        if (group.created_by) allUserIds.add(group.created_by)
      })

      // Fetch adviser assignments
      const { data: adviserAssignments, error: adviserError } = await supabase
        .from('adviser_group_assignments')
        .select('adviser_id, group_id')

      if (adviserError) {
        console.warn('Could not fetch adviser assignments:', adviserError)
      }

      // Add adviser IDs to user list
      adviserAssignments?.forEach(assignment => {
        if (assignment.adviser_id) allUserIds.add(assignment.adviser_id)
      })

      // Fetch user details from auth.users (since your FK points to auth.users)
      let usersData = []
      if (allUserIds.size > 0) {
        const { data: userData, error: usersError } = await supabase
          .from('users') // Your app's users table with profile info
          .select('id, firstName, lastName, email, role')
          .in('id', Array.from(allUserIds))

        if (usersError) {
          console.warn('Could not fetch user details:', usersError)
        } else {
          usersData = userData || []
        }
      }

      const processedGroups = (groupsData || []).map(group => {
        // Find creator
        const creator = usersData.find(user => user.id === group.created_by)

        // Find adviser
        const adviserAssignment = adviserAssignments?.find(a => a.group_id === group.id)
        const adviser = adviserAssignment ? usersData.find(user => user.id === adviserAssignment.adviser_id) : null

        // Calculate progress based on actual research project submissions
        const groupProjects = researchProjects.filter(project => project.group_id === group.id)
        let progress = 0
        
        if (groupProjects.length > 0) {
          // Calculate progress based on research proposal status
          const approvedProjects = groupProjects.filter(project => project.status === 'approved').length
          const totalProjects = groupProjects.length
          
          if (totalProjects > 0) {
            // Basic progress calculation: 
            // - Has submitted projects: minimum 25%
            // - Has approved projects: additional percentage
            progress = Math.max(25, Math.floor((approvedProjects / totalProjects) * 100))
          }
        }
        // If no research projects exist, progress remains 0%

        return {
          id: group.id,
          name: group.group_name,
          description: group.description,
          department: 'Computer Science', // You can add this field to your table if needed
          adviser: adviser ? {
            id: adviser.id,
            name: `${adviser.firstName || ''} ${adviser.lastName || ''}`.trim() || adviser.email,
            email: adviser.email
          } : null,
          studentLeader: creator ? {
            id: creator.id,
            name: `${creator.firstName || ''} ${creator.lastName || ''}`.trim() || creator.email,
            email: creator.email
          } : null,
          progress: progress, // 0% when no research project exists, calculated based on submissions
          status: group.is_active ? 'active' : 'inactive',
          deadline: '2024-12-31', // You can add deadline field to your table
          lastUpdate: formatLastUpdate(group.updated_at || group.created_at),
          researchFocus: group.research_focus,
          createdAt: group.created_at,
          isActive: group.is_active
        }
      })

      setGroups(processedGroups)
    } catch (error) {
      console.error('Error in fetchGroups:', error)
      setGroups([])
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data: usersData, error } = await supabase
        .from('users')
        .select('id, firstName, lastName, email, role')
        .in('role', ['student', 'adviser'])
        .order('firstName')

      if (error) {
        console.error('Error fetching users:', error)
        setUsers([])
        return
      }

      setUsers(usersData || [])
    } catch (error) {
      console.error('Error in fetchUsers:', error)
      setUsers([])
    }
  }

  const getGroupStatus = (group) => {
    // Simple status logic based on is_active
    if (!group.is_active) return 'inactive'
    return 'active'
  }

  const formatLastUpdate = (dateString) => {
    if (!dateString) return 'Never'
    
    const now = new Date()
    const updated = new Date(dateString)
    const diffInHours = Math.floor((now - updated) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return '1 day ago'
    if (diffInDays < 7) return `${diffInDays} days ago`
    
    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks === 1) return '1 week ago'
    return `${diffInWeeks} weeks ago`
  }

  const handleCreateGroup = async () => {
    if (!newGroup.group_name.trim()) {
      alert('Please enter a group name')
      return
    }

    try {
      setSubmitting(true)
      
      // Get current user (superadmin creating the group)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        console.error('Error getting session:', sessionError)
        alert('Please login again')
        return
      }

      const currentUserId = session?.user?.id
      if (!currentUserId) {
        alert('Please login again')
        return
      }
      
      const { data, error } = await supabase
        .from('student_groups')
        .insert([{
          group_name: newGroup.group_name,
          description: newGroup.description,
          research_focus: newGroup.research_focus,
          max_members: parseInt(newGroup.max_members),
          created_by: newGroup.student_leader_id || currentUserId,
          leader_id: newGroup.student_leader_id || currentUserId,
          is_active: true
        }])
        .select()

      if (error) {
        console.error('Error creating group:', error)
        if (error.code === '23505' && error.constraint === 'student_groups_group_name_key') {
          alert('A group with this name already exists. Please choose a different name.')
        } else {
          alert('Error creating group: ' + error.message)
        }
        return
      }

      const groupId = data[0]?.id
      if (!groupId) {
        alert('Error: Group was not created properly')
        return
      }

      // No need to add leader to student_group_members; leader_id is set in student_groups

      // If we have an adviser, create the assignment
      if (newGroup.adviser_id) {
        const { error: adviserError } = await supabase
          .from('adviser_group_assignments')
          .insert([{
            adviser_id: newGroup.adviser_id,
            group_id: groupId,
            assigned_by: currentUserId
          }])

        if (adviserError) {
          console.error('Error assigning adviser:', adviserError)
          // Don't fail the whole operation, just warn
          alert('Group created but could not assign adviser. You can assign them manually.')
        }
      }

      // Reset form and refresh data
      setNewGroup({
        group_name: '',
        description: '',
        research_focus: '',
        max_members: 5,
        adviser_id: '',
        student_leader_id: ''
      })
      setCreateDialogOpen(false)
      await fetchGroups()

      alert('Group created successfully!')

    } catch (error) {
      console.error('Error in handleCreateGroup:', error)
      alert('Error creating group')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteGroup = async (groupId) => {
    if (!confirm('Are you sure you want to delete this group? This will also remove all members and adviser assignments.')) {
      return
    }

    try {
      setSubmitting(true)
      
      // Delete adviser assignments first
      await supabase
        .from('adviser_group_assignments')
        .delete()
        .eq('group_id', groupId)

      // Delete the group (your FK constraints will handle cascade)
      const { error } = await supabase
        .from('student_groups')
        .delete()
        .eq('id', groupId)

      if (error) {
        console.error('Error deleting group:', error)
        alert('Error deleting group: ' + error.message)
        return
      }

      await fetchGroups()
      alert('Group deleted successfully!')

    } catch (error) {
      console.error('Error in handleDeleteGroup:', error)
      alert('Error deleting group')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleGroupStatus = async (groupId, currentStatus) => {
    try {
      setSubmitting(true)
      
      const { error } = await supabase
        .from('student_groups')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', groupId)

      if (error) {
        console.error('Error updating group status:', error)
        alert('Error updating group status: ' + error.message)
        return
      }

      await fetchGroups()
      
    } catch (error) {
      console.error('Error in handleToggleGroupStatus:', error)
      alert('Error updating group status')
    } finally {
      setSubmitting(false)
    }
  }

  const getStudents = () => users.filter(user => user.role === 'student')
  const getAdvisers = () => users.filter(user => user.role === 'adviser')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading groups...</span>
        </div>
      </div>
    )
  }

  const totalGroups = groups.length
  const activeGroups = groups.filter((g) => g.status === "active").length
  const inactiveGroups = groups.filter((g) => g.status === "inactive").length
  const avgProgress = groups.length > 0 ? Math.round(groups.reduce((sum, g) => sum + g.progress, 0) / groups.length) : 0

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* ...existing summary cards code... */}
      {/* ...existing group management code... */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Group & Project Management</h1>
            <p className="text-gray-600">Monitor and manage all capstone project groups and their progress</p>
          </div>
          {/* Removed SA avatar icon */}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Groups</p>
                <p className="text-2xl font-bold text-gray-900">{totalGroups}</p>
                <p className="text-sm mt-1 text-green-600">+2 this month</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Active Groups</p>
                <p className="text-2xl font-bold text-gray-900">{activeGroups}</p>
                <p className="text-sm mt-1 text-green-600">On track</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Inactive Groups</p>
                <p className="text-2xl font-bold text-gray-900">{inactiveGroups}</p>
                <p className="text-sm mt-1 text-orange-600">Suspended/Archived</p>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Average Progress</p>
                <p className="text-2xl font-bold text-gray-900">{avgProgress}%</p>
                <p className="text-sm mt-1 text-green-600">+5% this month</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Create Group Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button className="hidden">Create Group</Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Group Name *</label>
              <Input
                placeholder="Enter group name"
                value={newGroup.group_name}
                onChange={(e) => setNewGroup({ ...newGroup, group_name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
              <Input
                placeholder="Brief description of the project"
                value={newGroup.description}
                onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Research Focus</label>
              <Input
                placeholder="Main research area or focus"
                value={newGroup.research_focus}
                onChange={(e) => setNewGroup({ ...newGroup, research_focus: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Max Members</label>
              <Input
                type="number"
                min="1"
                max="10"
                value={newGroup.max_members}
                onChange={(e) => setNewGroup({ ...newGroup, max_members: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Assign Adviser</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={newGroup.adviser_id}
                onChange={(e) => setNewGroup({ ...newGroup, adviser_id: e.target.value })}
              >
                <option value="">Select an adviser</option>
                {getAdvisers().map((adviser) => (
                  <option key={adviser.id} value={adviser.id}>
                    {`${adviser.firstName || ''} ${adviser.lastName || ''}`.trim() || adviser.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Student Leader</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={newGroup.student_leader_id}
                onChange={(e) => setNewGroup({ ...newGroup, student_leader_id: e.target.value })}
              >
                <option value="">Select a student leader</option>
                {getStudents().map((student) => (
                  <option key={student.id} value={student.id}>
                    {`${student.firstName || ''} ${student.lastName || ''}`.trim() || student.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleCreateGroup} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Group
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* All Research Projects grid replaces All Groups card */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              All Research Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {loading ? (
                [1,2,3,4].map(i => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded w-full"></div>
                    </CardContent>
                  </Card>
                ))
              ) : projects.length > 0 ? (
                projects.map(project => (
                  <Card key={project.id} className="group relative bg-white border-l-4 border-blue-500 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.03] overflow-hidden cursor-pointer">
                    <CardContent className="p-6 relative">
                      {/* Category/Status Badge */}
                      <span className="absolute top-4 right-4 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full shadow-sm z-10">Active</span>
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-bold text-gray-900 text-xl leading-tight mb-2 pr-20 tracking-tight">
                            {project.title}
                          </h3>
                          <div className="flex items-center text-sm text-gray-600 mb-2 gap-2">
                            <Users className="w-4 h-4 mr-1" />
                            <span>{(() => {
                              const user = users.find(u => u.id === project.student_id);
                              return user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Student';
                            })()}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 mb-2 gap-2">
                            <GraduationCap className="w-4 h-4 mr-1" />
                            <span>{(() => {
                              // Try to get adviser name from project.adviser or users list
                              if (project.adviser && project.adviser.name) return project.adviser.name;
                              if (project.adviser && project.adviser.email) return project.adviser.email;
                              // Fallback: try to find adviser in users
                              const adviser = users.find(u => u.id === project.adviser_id);
                              return adviser ? `${adviser.firstName || ''} ${adviser.lastName || ''}`.trim() || adviser.email : 'Adviser';
                            })()}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 mb-3 gap-2">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>{project.start_date ? new Date(project.start_date).getFullYear() : new Date().getFullYear()}</span>
                          </div>
                        </div>
                        <div className="relative mb-4 overflow-hidden rounded-lg bg-gray-50">
                          <div className="relative h-56 overflow-hidden">
                            {project.image_url ? (
                              <img 
                                src={project.image_url} 
                                alt={project.title}
                                className="w-full h-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg">
                                <div className="text-center">
                                  <BookOpen className="h-20 w-20 mx-auto text-gray-400 mb-3" />
                                  <p className="text-base text-gray-500">Research Image</p>
                                </div>
                              </div>
                            )}
                            {/* Gradient overlay for image */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none rounded-lg"></div>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:bg-blue-50 hover:border-blue-400 group-hover:scale-105"
                          onClick={() => handleViewDetails(project)}
                        >
                          <Eye className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                          Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No research projects yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    No projects have been created yet.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details Modal - matches adviser progress.jsx modal */}
      {showDetailsModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedProject.title}</h2>
                  <p className="text-gray-600">Detailed Progress Report & Chapter Status</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetailsModal(false)}
                >
                  ×
                </Button>
              </div>
            </div>
            <div className="p-6 space-y-8">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span className="text-gray-600">Loading detailed progress...</span>
                </div>
              ) : projectDetails ? (
                <>
                  {/* Progress Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Overall Progress</p>
                            <p className="text-2xl font-bold">{projectDetails.fullProject.progress || 0}%</p>
                          </div>
                          <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                            <TrendingUp className="w-5 h-5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Research Proposals</p>
                            <p className="text-2xl font-bold">{projectDetails.proposals.length}</p>
                          </div>
                          <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                            <FileText className="w-5 h-5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Team Members</p>
                            <p className="text-2xl font-bold">1</p>
                          </div>
                          <div className="p-3 rounded-full bg-green-100 text-green-600">
                            <Users className="w-5 h-5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Pending Chapters</p>
                            {(() => {
                              const pendingChapters = [1,2,3,4,5].filter(num => {
                                const status = projectDetails.fullProject[`chapter_${num}_status`];
                                return status === 'pending_review';
                              });
                              return (
                                <>
                                  <p className="text-2xl font-bold">{pendingChapters.length}</p>
                                  {pendingChapters.length > 0 && (
                                    <p className="text-xs text-yellow-700 mt-1">{pendingChapters.map(num => `Chapter ${num}`).join(', ')}</p>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                          <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                            <TrendingUp className="w-5 h-5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  {/* Proposals Section */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Research Proposals
                    </h3>
                    {projectDetails.proposals.length > 0 ? (
                      <div className="space-y-4">
                        {projectDetails.proposals.map((proposal, idx) => (
                          <Card key={idx} className="border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900">{proposal.title}</h4>
                                  <p className="text-sm text-gray-600 mt-1">{proposal.description}</p>
                                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                    <span>Category: {proposal.category || 'Not specified'}</span>
                                    <span>Submitted: {proposal.submitted_at ? new Date(proposal.submitted_at).toLocaleDateString() : 'N/A'}</span>
                                  </div>
                                </div>
                                <Badge className="bg-blue-100 text-blue-800">{proposal.status}</Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">No research proposals submitted yet.</p>
                    )}
                  </div>
                  {/* Chapters Section */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <BookOpen className="w-5 h-5 mr-2" />
                      Chapter Progress
                    </h3>
                    {/* Example: show chapter status for 5 chapters */}
                    <div className="space-y-3">
                      {[1,2,3,4,5].map(num => {
                        const chapterTitle = [
                          'Introduction and Background',
                          'Literature Review',
                          'Research Methodology',
                          'Results and Discussion',
                          'Conclusion and Recommendation'
                        ][num-1];
                        const completed = projectDetails.fullProject[`chapter_${num}_completed`];
                        const status = projectDetails.fullProject[`chapter_${num}_status`];
                        const filename = projectDetails.fullProject[`chapter_${num}_file_name`];
                        const feedback = projectDetails.fullProject[`chapter_${num}_feedback`];
                        const content = projectDetails.fullProject[`chapter_${num}_content`];
                        const submitted_at = projectDetails.fullProject[`chapter_${num}_submitted_at`];
                        const hasSubmission = !!(filename || content);
                        return (
                          <div key={num} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${completed ? 'bg-green-500 text-white' : status === 'pending_review' ? 'bg-yellow-500 text-white' : status === 'in_progress' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                                  {completed ? '✓' : status === 'pending_review' ? '⏳' : num}
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900">
                                    Chapter {num}: {chapterTitle}
                                  </h5>
                                  {filename && (
                                    <p className="text-sm text-blue-600 mt-1">📄 File: {filename}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <Badge className={`${completed ? 'bg-green-100 text-green-800' : status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' : status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                  {status === 'pending_review' ? 'Pending Review' : completed ? 'Complete' : status === 'in_progress' ? 'In Progress' : 'Not Started'}
                                </Badge>
                                {/* View button for chapter content */}
                                {(content && content.length > 0) && (
                                  <Button size="sm" variant="outline" onClick={() => alert(content)}>
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                  </Button>
                                )}
                              </div>
                            </div>
                            {/* Feedback Section */}
                            <div className="mt-3 ml-12">
                              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                                <div className="flex items-start space-x-2 flex-1">
                                  <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-blue-800">Feedback:</p>
                                    <p className="text-sm text-blue-700 mt-1">{feedback || 'No feedback provided yet'}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {/* Status and Info */}
                            <div className="mt-3 ml-12 text-xs text-gray-500">
                              <span>Status: {status || 'Not Started'}</span>
                              {content && (
                                <span className="ml-4">Content Length: {content.length} characters</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-600 py-8">No detailed information available.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
