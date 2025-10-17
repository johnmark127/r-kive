"use client"

import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  FlaskConical, Plus, Edit3, Eye, Calendar, Users, Clock, BookOpen, FileText, 
  Lightbulb, Presentation, BarChart3, TrendingUp, MessageSquare,
  CheckCircle, XCircle, AlertTriangle, Download, Trash2
} from "lucide-react"
import { supabase } from "../../../../supabase/client"

const ResearchHub = () => {
  const location = useLocation()
  
  // Active tab state - set based on URL
  const getTabFromPath = (path) => {
    if (path.includes('/projects')) return 'projects'
    if (path.includes('/reports')) return 'reports'
    return 'proposals'
  }
  
  const [activeTab, setActiveTab] = useState(getTabFromPath(location.pathname))
  
  // Update tab when URL changes
  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname))
  }, [location.pathname])
  
  // Common states
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  // Project-related states
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [chapterDialogOpen, setChapterDialogOpen] = useState(false)
  const [activeChapter, setActiveChapter] = useState(1)
  const [chapterContent, setChapterContent] = useState("")
  const [savingChapter, setSavingChapter] = useState(false)
  
  // File upload states
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState("")
  
  // Image upload states
  const [uploadingImage, setUploadingImage] = useState(false)
  const [projectImage, setProjectImage] = useState(null)
  const [imagePreview, setImagePreview] = useState("")
  
  // New Project Dialog States
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false)
  const [creatingProject, setCreatingProject] = useState(false)
  const [newProjectForm, setNewProjectForm] = useState({
    title: "",
    description: "",
    category: "",
    research_topic: "",
    start_date: "",
    image_url: ""
  })

  // View Project Dialog States
  const [viewProjectDialogOpen, setViewProjectDialogOpen] = useState(false)
  const [viewProject, setViewProject] = useState(null)
  const [editingImage, setEditingImage] = useState(false)
  const [updatingProjectImage, setUpdatingProjectImage] = useState(false)

  // Edit Project Dialog States
  const [editProjectDialogOpen, setEditProjectDialogOpen] = useState(false)
  const [editProject, setEditProject] = useState(null)
  const [editProjectForm, setEditProjectForm] = useState({
    title: "",
    description: "",
    category: "",
    research_topic: "",
    start_date: ""
  })
  const [updatingProject, setUpdatingProject] = useState(false)

  // Proposal states
  const [proposals, setProposals] = useState([])
  const [newProposalDialogOpen, setNewProposalDialogOpen] = useState(false)
  const [viewProposalDialogOpen, setViewProposalDialogOpen] = useState(false)
  const [viewProposal, setViewProposal] = useState(null)
  const [proposalForm, setProposalForm] = useState({
    title: "",
    description: "",
    category: "",
    research_topic: ""
  })
  const [submittingProposal, setSubmittingProposal] = useState(false)

  // Tab configuration
  const tabs = [
    { id: "proposals", label: "Proposals", icon: Lightbulb, color: "text-yellow-600" },
    { id: "projects", label: "My Projects", icon: FlaskConical, color: "text-blue-600" },
    { id: "reports", label: "Progress", icon: BarChart3, color: "text-green-600" }
  ]

  // Get logged-in user
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
            setUser(localUser)
          } else {
            setUser({
              uid: session.user.id,
              email: session.user.email,
              role: 'student'
            })
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      }
    }

    getCurrentUser()
  }, [])

  // Fetch user's research projects
  useEffect(() => {
    if (!user?.uid) return

    const fetchProjects = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('research_projects')
          .select('*')
          .eq('student_id', user.uid)
          .order('created_at', { ascending: false })

        if (error) {
          throw error
        }

        // Enhance projects with chapter data
        const enhancedProjects = (data || []).map(project => {
          const enhancedProject = { ...project }
          
          // Load chapter data for all 5 chapters - all data now comes from database
          for (let chapterNum = 1; chapterNum <= 5; chapterNum++) {
            // All chapters (1-5) now have data in database
            enhancedProject[`chapter_${chapterNum}_content`] = project[`chapter_${chapterNum}_content`] || ''
            enhancedProject[`chapter_${chapterNum}_completed`] = project[`chapter_${chapterNum}_completed`] || false
            enhancedProject[`chapter_${chapterNum}_file_name`] = project[`chapter_${chapterNum}_file_name`] || ''
            enhancedProject[`chapter_${chapterNum}_status`] = project[`chapter_${chapterNum}_status`] || 'Not started'
            enhancedProject[`chapter_${chapterNum}_feedback`] = project[`chapter_${chapterNum}_feedback`] || ''
            
            // Fallback to localStorage for backward compatibility (if needed)
            const metaStorageKey = `project_${project.id}_chapter_${chapterNum}_meta`
            const storedMetaData = localStorage.getItem(metaStorageKey)
            if (storedMetaData && !project[`chapter_${chapterNum}_file_name`]) {
              try {
                const metaData = JSON.parse(storedMetaData)
                enhancedProject[`chapter_${chapterNum}_file_name`] = metaData.fileName || ''
              } catch (e) {
                console.warn(`Failed to parse meta data for chapter ${chapterNum}:`, e)
              }
            }
            
            // For chapters 4-5, also check localStorage for content if not in database
            if (chapterNum > 3) {
              const chapterStorageKey = `project_${project.id}_chapter_${chapterNum}`
              const storedChapterData = localStorage.getItem(chapterStorageKey)
              
              if (storedChapterData && !project[`chapter_${chapterNum}_content`]) {
                try {
                  const chapterData = JSON.parse(storedChapterData)
                  enhancedProject[`chapter_${chapterNum}_content`] = chapterData.content || ''
                  enhancedProject[`chapter_${chapterNum}_completed`] = chapterData.completed || false
                } catch (e) {
                  console.warn(`Failed to parse chapter data for chapter ${chapterNum}:`, e)
                }
              }
            }
          }
          
          return enhancedProject
        })

        setProjects(enhancedProjects)
      } catch (error) {
        console.error("Error fetching projects:", error)
        // Fallback to empty array if table doesn't exist yet
        setProjects([])
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [user])

  // Fetch user's research proposals
  useEffect(() => {
    if (!user?.uid) return

    const fetchProposals = async () => {
      try {
        const { data, error } = await supabase
          .from('research_proposals')
          .select('*')
          .eq('student_id', user.uid)
          .order('submitted_at', { ascending: false })

        if (error) {
          throw error
        }

        setProposals(data || [])
      } catch (error) {
        console.error("Error fetching proposals:", error)
        // Fallback to empty array if table doesn't exist yet
        setProposals([])
      }
    }

    fetchProposals()
  }, [user])

  const createNewProject = async () => {
    if (!user?.uid || !newProjectForm.title.trim() || !newProjectForm.description.trim()) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setCreatingProject(true)

      const projectData = {
        title: newProjectForm.title.trim(),
        description: newProjectForm.description.trim(),
        category: newProjectForm.category || 'General',
        research_topic: newProjectForm.research_topic.trim(),
        start_date: newProjectForm.start_date || new Date().toISOString().split('T')[0],
        student_id: user.uid,
        status: 'planning',
        progress: 0,
        chapter_1_content: '',
        chapter_1_completed: false,
        chapter_1_file_name: '',
        chapter_1_feedback: '',
        chapter_1_status: 'Not started',
        chapter_2_content: '',
        chapter_2_completed: false,
        chapter_2_file_name: '',
        chapter_2_feedback: '',
        chapter_2_status: 'Not started',
        chapter_3_content: '',
        chapter_3_completed: false,
        chapter_3_file_name: '',
        chapter_3_feedback: '',
        chapter_3_status: 'Not started',
        chapter_4_content: '',
        chapter_4_completed: false,
        chapter_4_file_name: '',
        chapter_4_feedback: '',
        chapter_4_status: 'Not started',
        chapter_5_content: '',
        chapter_5_completed: false,
        chapter_5_file_name: '',
        chapter_5_feedback: '',
        chapter_5_status: 'Not started',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('research_projects')
        .insert([projectData])
        .select()

      if (error) {
        throw error
      }

      // Add new project to local state
      if (data && data[0]) {
        setProjects(prev => [data[0], ...prev])
      }

      // Reset form and close dialog
      setNewProjectForm({
        title: "",
        description: "",
        category: "",
        research_topic: "",
        start_date: "",
        image_url: ""
      })
      setImagePreview("")
      setProjectImage(null)
      setNewProjectDialogOpen(false)

    } catch (error) {
      console.error('Error creating project:', error)
      alert('Error creating project. Please try again.')
    } finally {
      setCreatingProject(false)
    }
  }

  const handleFormChange = (field, value) => {
    setNewProjectForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleProposalFormChange = (field, value) => {
    setProposalForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const createNewProposal = async () => {
    if (!user?.uid || !proposalForm.title.trim() || !proposalForm.description.trim()) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setSubmittingProposal(true)

      if (!user?.email) {
        alert('User email is required to submit a proposal. Please ensure your account has a valid email.');
        setSubmittingProposal(false);
        return;
      }

      // Fetch student's active group by leader_id
      let groupId = null;
      try {
        const { data: groupData, error: groupError } = await supabase
          .from('student_groups')
          .select('id')
          .eq('leader_id', user.uid)
          .eq('is_active', true)
          .single();
        if (!groupError && groupData) {
          groupId = groupData.id;
        }
      } catch (e) {
        console.warn('Could not fetch group:', e);
      }

      const proposalData = {
        title: proposalForm.title.trim(),
        description: proposalForm.description.trim(),
        category: proposalForm.category || 'General',
        research_topic: proposalForm.research_topic.trim(),
        student_id: user.uid,
        student_email: user.email,
        status: 'pending',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...(groupId && { group_id: groupId })
      };

      const { data, error } = await supabase
        .from('research_proposals')
        .insert([proposalData])
        .select();

      if (error) {
        throw error;
      }

      // Add new proposal to local state
      if (data && data[0]) {
        setProposals(prev => [data[0], ...prev]);
      }

      // Reset form and close dialog
      setProposalForm({
        title: "",
        description: "",
        category: "",
        research_topic: ""
      });
      setNewProposalDialogOpen(false);

    } catch (error) {
      console.error('Error creating proposal:', error);
      alert('Error creating proposal. Please try again.');
    } finally {
      setSubmittingProposal(false);
    }
  }

  const handleEditFormChange = (field, value) => {
    setEditProjectForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const openViewProject = (project) => {
    setViewProject(project)
    setViewProjectDialogOpen(true)
  }

  const openViewProposal = (proposal) => {
    setViewProposal(proposal)
    setViewProposalDialogOpen(true)
  }

  const openEditProject = (project) => {
    setEditProject(project)
    setEditProjectForm({
      title: project.title,
      description: project.description,
      category: project.category,
      research_topic: project.research_topic,
      start_date: project.start_date
    })
    setEditProjectDialogOpen(true)
  }

  const updateProject = async () => {
    if (!editProject?.id || !editProjectForm.title.trim() || !editProjectForm.description.trim()) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setUpdatingProject(true)

      const updateData = {
        title: editProjectForm.title.trim(),
        description: editProjectForm.description.trim(),
        category: editProjectForm.category,
        research_topic: editProjectForm.research_topic.trim(),
        start_date: editProjectForm.start_date,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('research_projects')
        .update(updateData)
        .eq('id', editProject.id)

      if (error) {
        throw error
      }

      // Update local state
      setProjects(prev =>
        prev.map(project =>
          project.id === editProject.id
            ? { ...project, ...updateData }
            : project
        )
      )

      setEditProjectDialogOpen(false)
      setEditProject(null)
      setEditProjectForm({
        title: "",
        description: "",
        category: "",
        research_topic: "",
        start_date: ""
      })

    } catch (error) {
      console.error('Error updating project:', error)
      alert('Error updating project. Please try again.')
    } finally {
      setUpdatingProject(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "planning":
        return "bg-yellow-100 text-yellow-800"
      case "on_hold":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getProposalStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "under_review":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getProposalStatusLabel = (status) => {
    switch (status) {
      case "approved":
        return "Approved"
      case "under_review":
        return "Under Review"
      case "pending":
        return "Pending"
      case "rejected":
        return "Needs Revision"
      default:
        return "Unknown"
    }
  }

  const openChapterEditor = (project, chapterNumber) => {
    setSelectedProject(project)
    setActiveChapter(chapterNumber)
    
    // Load existing chapter content
    const chapterKey = `chapter_${chapterNumber}_content`
    setChapterContent(project[chapterKey] || "")
    
    // Load uploaded file name if exists
    const fileNameKey = `chapter_${chapterNumber}_file_name`
    setUploadedFileName(project[fileNameKey] || "")
    
    setChapterDialogOpen(true)
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setUploadingFile(true)
    
    try {
      // Read file content based on type
      let content = ""
      
      if (file.type === "text/plain") {
        content = await file.text()
      } else if (file.type === "application/pdf") {
        // For PDF, we'll just note that a PDF was uploaded
        // In a real app, you'd use a PDF parser library
        content = `[PDF File Uploaded: ${file.name}]\n\nPlease manually copy the content from your PDF file into this text area, or implement PDF parsing functionality.`
      } else if (file.type.includes("document") || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        // For Word docs, we'll just note that a document was uploaded
        // In a real app, you'd use a document parser library
        content = `[Word Document Uploaded: ${file.name}]\n\nPlease manually copy the content from your document into this text area, or implement document parsing functionality.`
      } else {
        // Try to read as text for other file types
        content = await file.text()
      }

      setChapterContent(content)
      setUploadedFileName(file.name)
      
    } catch (error) {
      console.error('Error reading file:', error)
      alert('Error reading file. Please try again or copy the content manually.')
    } finally {
      setUploadingFile(false)
    }
  }

  // Handle project image upload
  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, GIF, etc.)')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB')
      return
    }

    setUploadingImage(true)
    
    try {
      // Create a unique filename
      const timestamp = Date.now()
      const fileName = `project_${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('project-images')
        .upload(fileName, file)

      if (error) {
        throw error
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('project-images')
        .getPublicUrl(fileName)

      const imageUrl = urlData.publicUrl

      // Update form and preview
      setNewProjectForm(prev => ({ ...prev, image_url: imageUrl }))
      setProjectImage(file)
      setImagePreview(URL.createObjectURL(file))
      
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Error uploading image. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  // Handle project image update in view modal
  const handleProjectImageUpdate = async (event) => {
    const file = event.target.files[0]
    if (!file || !viewProject) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, GIF, etc.)')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB')
      return
    }

    setUpdatingProjectImage(true)
    
    try {
      console.log('Starting image upload for project:', viewProject.id)
      
      // Create a unique filename with research-images folder path
      const timestamp = Date.now()
      const fileExt = file.name.split('.').pop()
      const fileName = `research-images/project_${viewProject.id}_${timestamp}.${fileExt}`
      
      console.log('Uploading file to research-files bucket:', fileName)

      // Check if bucket is public and try to make it public if needed
      const { data: buckets } = await supabase.storage.listBuckets()
      const researchFilesBucket = buckets?.find(bucket => bucket.name === 'research-files')
      
      if (researchFilesBucket && !researchFilesBucket.public) {
        console.log('Bucket is private, attempting to make it public...')
        const { error: bucketError } = await supabase.storage
          .updateBucket('research-files', { public: true })
        
        if (bucketError) {
          console.error('Could not make bucket public:', bucketError)
        } else {
          console.log('Bucket made public successfully')
        }
      }

      // Upload to Supabase storage using research-files bucket
      const { data, error } = await supabase.storage
        .from('research-files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) {
        console.error('Upload error:', error)
        throw new Error(`Upload failed: ${error.message}`)
      }

      console.log('Upload successful:', data)

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('research-files')
        .getPublicUrl(fileName)

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded image')
      }

      const imageUrl = urlData.publicUrl
      console.log('Public URL:', imageUrl)

      // Update the project in database
      const { error: updateError } = await supabase
        .from('research_projects')
        .update({ image_url: imageUrl })
        .eq('id', viewProject.id)

      if (updateError) {
        console.error('Database update error:', updateError)
        throw new Error(`Database update failed: ${updateError.message}`)
      }

      console.log('Database updated successfully')

      // Update local state
      setViewProject(prev => ({ ...prev, image_url: imageUrl }))
      
      // Update projects list
      setProjects(prev => prev.map(project => 
        project.id === viewProject.id 
          ? { ...project, image_url: imageUrl }
          : project
      ))

      setEditingImage(false)
      alert('Project image updated successfully!')
      
    } catch (error) {
      console.error('Error updating project image:', error)
      alert(`Error updating project image: ${error.message || 'Please try again.'}`)
    } finally {
      setUpdatingProjectImage(false)
      // Reset the file input
      event.target.value = ''
    }
  }

  const saveChapterContent = async () => {
    if (!selectedProject || !user?.uid) {
      alert('Missing project or user information')
      return
    }

    try {
      setSavingChapter(true)
      
      console.log('Saving chapter:', {
        projectId: selectedProject.id,
        activeChapter,
        contentLength: chapterContent?.length || 0,
        fileName: uploadedFileName
      })
      
      const isCompleted = chapterContent.trim().length > 0
      
      // Prepare update data for all chapters (1-5) - all now exist in database
      const updateData = {
        updated_at: new Date().toISOString()
      }

      // Update the current chapter content, completion status, and file name
      const chapterKey = `chapter_${activeChapter}_content`
      const completedKey = `chapter_${activeChapter}_completed`
      const fileNameKey = `chapter_${activeChapter}_file_name`
      
      updateData[chapterKey] = chapterContent
      updateData[completedKey] = isCompleted
      updateData[fileNameKey] = uploadedFileName || ''
    // Add chapter status to updateData so it is saved in the backend
    const statusKey = `chapter_${activeChapter}_status`
    updateData[statusKey] = isCompleted ? 'Pending Review' : 'Not Started'

      // Calculate overall progress based on completed chapters
      let completedChapters = 0
      for (let num = 1; num <= 5; num++) {
        let chapterCompleted = false
        
        if (num === activeChapter) {
          chapterCompleted = isCompleted
        } else {
          // All chapters now exist in database
          chapterCompleted = selectedProject[`chapter_${num}_completed`] || false
        }
        
        if (chapterCompleted) completedChapters++
      }

      updateData.progress = Math.round((completedChapters / 5) * 100)
      
      // Update status based on progress
      if (updateData.progress === 0) {
        updateData.status = 'planning'
      } else if (updateData.progress === 100) {
        updateData.status = 'completed'
      } else {
        updateData.status = 'in_progress'
      }

      console.log('Update data:', updateData)

      // Update database for all chapters (1-5)
      const { data, error } = await supabase
        .from('research_projects')
        .update(updateData)
        .eq('id', selectedProject.id)
        .select()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Database update successful:', data)

      // Clean up old localStorage data for chapters 4-5 (no longer needed)
      if (activeChapter > 3) {
        const chapterStorageKey = `project_${selectedProject.id}_chapter_${activeChapter}`
        localStorage.removeItem(chapterStorageKey)
        console.log('Removed old localStorage data:', chapterStorageKey)
      }

      // Clean up old meta data from localStorage (no longer needed since file names are in database)
      const metaStorageKey = `project_${selectedProject.id}_chapter_${activeChapter}_meta`
      localStorage.removeItem(metaStorageKey)

      // Update local state
      const updatedProject = { ...selectedProject, ...updateData }
      
  // Add chapter data to the project object for display
  updatedProject[`chapter_${activeChapter}_content`] = chapterContent
  updatedProject[`chapter_${activeChapter}_completed`] = isCompleted
  updatedProject[`chapter_${activeChapter}_file_name`] = uploadedFileName || ''
  updatedProject[`chapter_${activeChapter}_status`] = isCompleted ? 'Pending Review' : 'Not Started'
      
      setProjects(prev =>
        prev.map(project =>
          project.id === selectedProject.id ? updatedProject : project
        )
      )

      setChapterDialogOpen(false)
      setSelectedProject(null)
      setChapterContent("")
      setUploadedFileName("")

      alert('Chapter saved successfully!')

    } catch (error) {
      console.error('Error saving chapter:', error)
      
      // More detailed error message
      let errorMessage = 'Error saving chapter. '
      if (error.code === 'PGRST204') {
        errorMessage = 'Database column not found. Some chapter data will be stored locally until database is fully updated.'
      } else if (error.message) {
        errorMessage += `Details: ${error.message}`
      } else if (error.error_description) {
        errorMessage += `Details: ${error.error_description}`
      } else {
        errorMessage += 'Please check the console for more details and try again.'
      }
      
      alert(errorMessage)
    } finally {
      setSavingChapter(false)
    }
  }

  const getChapterProgress = (project) => {
    const chapters = [1, 2, 3, 4, 5]
    const completedChapters = chapters.filter(num => 
      project[`chapter_${num}_completed`]
    ).length
    return { completed: completedChapters, total: chapters.length }
  }

  const stats = [
    {
      title: "Total Projects",
      value: projects.length,
      icon: FlaskConical,
      color: "bg-blue-50 text-blue-600"
    },
    {
      title: "In Progress",
      value: projects.filter(p => p.status === "in_progress").length,
      icon: Clock,
      color: "bg-orange-50 text-orange-600"
    },
    {
      title: "Completed",
      value: projects.filter(p => p.status === "completed").length,
      icon: Eye,
      color: "bg-green-50 text-green-600"
    },
    {
      title: "Chapters Written",
      value: projects.reduce((total, project) => {
        return total + [1, 2, 3, 4, 5].filter(num => project[`chapter_${num}_completed`]).length
      }, 0),
      icon: BookOpen,
      color: "bg-purple-50 text-purple-600"
    }
  ]

  // Render functions for each tab
  const renderProjectsTab = () => (
    <div>
      {/* Stats Cards - Compact Mobile Layout */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <div className="flex items-center gap-2 sm:flex-col sm:items-start sm:gap-1">
                  <div className={`p-1.5 sm:p-3 rounded-lg ${stat.color} sm:hidden`}>
                    <stat.icon className="h-3 w-3 sm:h-6 sm:w-6" />
                  </div>
                  <div className="flex-1 sm:flex-initial">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-0.5 sm:mb-1 line-clamp-1">{stat.title}</p>
                    <p className="text-lg sm:text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
                <div className={`p-2 sm:p-3 rounded-lg ${stat.color} hidden sm:block`}>
                  <stat.icon className="h-4 w-4 sm:h-6 sm:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Projects Grid - Mobile-First with Better Exposure */}
      <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-8">
        {loading ? (
          // Loading skeleton
          [1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-32 sm:h-48 bg-gray-200 rounded-t-lg"></div>
              <CardContent className="p-3 sm:p-4">
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-2 sm:h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-2 sm:h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="h-6 sm:h-8 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))
        ) : projects.length > 0 ? (
          projects.map((project) => (
            <Card key={project.id} className="group relative hover:shadow-lg transition-all duration-300 sm:hover:scale-[1.02] overflow-hidden cursor-pointer">
              {/* Mobile: Show image first, then content */}
              <div className="block sm:hidden">
                {/* Mobile Image Section */}
                <div className="relative h-40 overflow-hidden">
                  {project.image_url ? (
                    <img 
                      src={project.image_url} 
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <div className="text-center">
                        <FlaskConical className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Research Image</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Status Badge - Mobile Top Right */}
                  <div className="absolute top-2 right-2 z-20">
                    {(() => {
                      const hasAnyChapter = [1, 2, 3, 4, 5].some(num => 
                        project[`chapter_${num}_content`] && project[`chapter_${num}_content`].trim().length > 0
                      );
                      
                      const completedChapters = [1, 2, 3, 4, 5].filter(num => 
                        project[`chapter_${num}_completed`]
                      ).length;
                      
                      if (completedChapters === 5) {
                        return (
                          <Badge className="bg-green-100 text-green-800 shadow-md text-xs">
                            <CheckCircle className="w-2.5 h-2.5 mr-1" />
                            Completed
                          </Badge>
                        );
                      } else if (hasAnyChapter) {
                        return (
                          <Badge className="bg-blue-100 text-blue-800 shadow-md text-xs">
                            <Clock className="w-2.5 h-2.5 mr-1" />
                            In Progress
                          </Badge>
                        );
                      } else {
                        return (
                          <Badge className="bg-yellow-100 text-yellow-800 shadow-md text-xs">
                            <FileText className="w-2.5 h-2.5 mr-1" />
                            Planning
                          </Badge>
                        );
                      }
                    })()}
                  </div>
                </div>
                
                {/* Mobile Content */}
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Title */}
                    <h3 className="font-semibold text-gray-900 text-base leading-tight line-clamp-2">
                      {project.title}
                    </h3>
                    
                    {/* Author & Year - Horizontal Layout */}
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <div className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        <span className="truncate max-w-[120px]">{user?.user_metadata?.full_name || user?.email || 'Student'}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>{project.start_date ? new Date(project.start_date).getFullYear() : new Date().getFullYear()}</span>
                      </div>
                    </div>
                    
                    {/* Progress Stats - Mobile */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="text-xs">
                        <div className="font-semibold text-blue-600">{[1, 2, 3, 4, 5].filter(num => project[`chapter_${num}_completed`]).length}</div>
                        <div className="text-gray-500">Chapters</div>
                      </div>
                      <div className="text-xs">
                        <div className="font-semibold text-green-600">{Math.round(([1, 2, 3, 4, 5].filter(num => project[`chapter_${num}_completed`]).length / 5) * 100)}%</div>
                        <div className="text-gray-500">Complete</div>
                      </div>
                      <div className="text-xs">
                        <Button 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openViewProject(project);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 h-6 px-2 text-xs"
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </div>
              
              {/* Desktop Layout (Hidden on Mobile) */}
              <CardContent className="hidden sm:block p-6 relative">
                {/* Status Badge - Desktop Top Right Corner */}
                <div className="absolute top-4 right-4 z-20">
                  {(() => {
                    // Check if any chapter has content
                    const hasAnyChapter = [1, 2, 3, 4, 5].some(num => 
                      project[`chapter_${num}_content`] && project[`chapter_${num}_content`].trim().length > 0
                    );
                    
                    const completedChapters = [1, 2, 3, 4, 5].filter(num => 
                      project[`chapter_${num}_completed`]
                    ).length;
                    
                    if (completedChapters === 5) {
                      return (
                        <Badge className="bg-green-100 text-green-800 shadow-md">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                      );
                    } else if (hasAnyChapter) {
                      return (
                        <Badge className="bg-blue-100 text-blue-800 shadow-md">
                          <Clock className="w-3 h-3 mr-1" />
                          In Progress
                        </Badge>
                      );
                    } else {
                      return (
                        <Badge className="bg-yellow-100 text-yellow-800 shadow-md">
                          <FileText className="w-3 h-3 mr-1" />
                          Planning
                        </Badge>
                      );
                    }
                  })()}
                </div>
                
                <div className="space-y-4">
                  <div>
                    {/* Title */}
                    <h3 className="font-semibold text-gray-900 text-lg leading-tight mb-2 line-clamp-2 pr-20">
                      {project.title}
                    </h3>
                    
                    {/* Author */}
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Users className="w-4 h-4 mr-1" />
                      <span className="truncate">{user?.user_metadata?.full_name || user?.email || 'Student'}</span>
                    </div>
                    
                    {/* Year */}
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>{project.start_date ? new Date(project.start_date).getFullYear() : new Date().getFullYear()}</span>
                    </div>
                  </div>

                  {/* Larger Image Section */}
                  <div className="relative mb-4 overflow-hidden rounded-md bg-gray-50">
                    <div className="relative h-64 overflow-hidden">
                      {project.image_url ? (
                        <img 
                          src={project.image_url} 
                          alt={project.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          <div className="text-center">
                            <FlaskConical className="h-20 w-20 mx-auto text-gray-400 mb-3" />
                            <p className="text-base text-gray-500">Research Image</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Hover Action Buttons Overlay */}
                      <div 
                        className="absolute inset-0 flex items-center justify-center z-10 transition-all duration-300"
                        style={{
                          backgroundColor: 'rgba(0, 0, 0, 0.6)',
                          opacity: 0,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '0';
                        }}
                      >
                        <div className="flex gap-3">
                          <Button 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              openViewProject(project);
                            }}
                            className="bg-white text-blue-600 hover:bg-gray-50 font-medium border-0 shadow-lg"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-8 sm:py-12">
            <FlaskConical className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              No research projects yet
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-4">
              Start your research journey by creating your first project
            </p>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              onClick={() => setNewProjectDialogOpen(true)}
              size="sm"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              <span className="text-sm">Create Your First Project</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )

  const renderProposalsTab = () => (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            Research Proposals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Submit research proposals for adviser review and approval.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Approved proposals will automatically create research projects in your Projects tab.
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Proposals List */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : proposals.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {proposals.map((proposal) => (
            <Card key={proposal.id} className="hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900 leading-tight">
                    {proposal.title}
                  </CardTitle>
                  <Badge className={getProposalStatusColor(proposal.status)}>
                    {getProposalStatusLabel(proposal.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {proposal.description}
                </p>
                
                <div className="space-y-3">
                  {/* Proposal Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Submitted: {new Date(proposal.submitted_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      <span>{proposal.research_topic}</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded">{proposal.category}</span>
                  </div>

                  {/* Status Progress */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        proposal.status === 'approved' ? 'bg-green-500 w-full' :
                        proposal.status === 'under_review' ? 'bg-blue-500 w-2/3' :
                        proposal.status === 'rejected' ? 'bg-red-500 w-1/3' :
                        'bg-yellow-500 w-1/3'
                      }`}
                    ></div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => openViewProposal(proposal)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {proposal.status === 'rejected' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-orange-600 border-orange-200 hover:bg-orange-50"
                      >
                        <Edit3 className="h-4 w-4 mr-1" />
                        Revise
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Lightbulb className="h-16 w-16 text-yellow-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals submitted yet</h3>
          <p className="text-gray-600 mb-6">Create your first research proposal to get started</p>
          <Button 
            className="bg-yellow-600 hover:bg-yellow-700"
            onClick={() => setNewProposalDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Submit Your First Proposal
          </Button>
        </div>
      )}
    </div>
  )

  const renderReportsTab = () => (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-green-600" />
            Progress Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h3 className="text-2xl font-bold text-blue-600">{projects.length}</h3>
              <p className="text-sm text-blue-800">Active Projects</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h3 className="text-2xl font-bold text-green-600">
                {projects.filter(p => p.status === 'completed').length}
              </h3>
              <p className="text-sm text-green-800">Completed</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <h3 className="text-2xl font-bold text-yellow-600">
                {Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / (projects.length || 1))}%
              </h3>
              <p className="text-sm text-yellow-800">Avg Progress</p>
            </div>
          </div>
          
          {projects.length > 0 ? (
            <div className="space-y-4">
              {projects.map(project => (
                <Card key={project.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{project.title}</h4>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                    <Progress value={project.progress || 0} className="mb-3" />
                    <p className="text-xs text-gray-600 mb-4">{project.progress || 0}% complete</p>
                    
                    {/* Chapter Progress - One per line */}
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Chapter Progress:</h5>
                      {[1, 2, 3, 4, 5].map(chapterNum => {
                        const hasContent = project[`chapter_${chapterNum}_content`] && project[`chapter_${chapterNum}_content`].trim().length > 0;
                        const hasFile = project[`chapter_${chapterNum}_file_name`] && project[`chapter_${chapterNum}_file_name`].trim().length > 0;
                        const isCompleted = project[`chapter_${chapterNum}_completed`];
                        // Restrict chapter 4-5 editing/uploading unless defense status is Passed
                        const canEditChapters4And5 = project.pre_oral_defense_status === 'Passed';
                        const isRestricted = (chapterNum === 4 || chapterNum === 5) && !canEditChapters4And5;
                        return (
                          <div key={chapterNum} className="border rounded-lg p-3 bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${
                                  isCompleted 
                                    ? 'bg-green-500' 
                                    : hasContent || hasFile
                                    ? 'bg-blue-500'
                                    : 'bg-gray-300'
                                }`}></div>
                                <span className="text-sm font-medium">
                                  Chapter {chapterNum}: {
                                    chapterNum === 1 ? "Introduction and Background" :
                                    chapterNum === 2 ? "Literature Review" :
                                    chapterNum === 3 ? "Research Methodology" :
                                    chapterNum === 4 ? "Results and Discussion" :
                                    "Conclusion and Recommendation"
                                  }
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {/* Restrict edit button for chapters 4-5 unless defense status is Passed */}
                                {!isRestricted ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openChapterEditor(project, chapterNum)}
                                    className="text-xs px-3 py-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                                  >
                                    <Edit3 className="w-3 h-3 mr-1" />
                                    Edit Chapter
                                  </Button>
                                ) : (
                                  <Badge className="bg-gray-100 text-gray-600 border-gray-200">
                                    Pre-Oral Defense Required
                                  </Badge>
                                )}
                                <Badge className={
                                  project[`chapter_${chapterNum}_status`] === 'Completed' ? 'bg-green-100 text-green-800' :
                                  project[`chapter_${chapterNum}_status`] === 'To Revise' ? 'bg-yellow-100 text-yellow-800' :
                                  project[`chapter_${chapterNum}_status`] === 'Needs Work' ? 'bg-red-100 text-red-800' :
                                  project[`chapter_${chapterNum}_status`] === 'Pending Review' ? 'bg-yellow-100 text-yellow-800' :
                                  project[`chapter_${chapterNum}_status`] === 'In Progress' ? 'bg-blue-100 text-blue-600' :
                                  hasContent || hasFile ? 'bg-blue-100 text-blue-600' : 
                                  'bg-gray-100 text-gray-600'
                                }>
                                  {project[`chapter_${chapterNum}_status`] || (hasContent || hasFile ? 'Draft' : 'Not Started')}
                                </Badge>
                              </div>
                            </div>
                            
                            {/* Always show feedback section if there's content or file */}
                            {(hasContent || hasFile) && (
                              <>
                                {/* Adviser Feedback Section */}
                                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <div className="flex items-start gap-2">
                                    <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-blue-800 mb-1">Adviser Feedback:</p>
                                      <div className="bg-white rounded p-2 border border-blue-100">
                                        <p className="text-sm text-gray-700">
                                          {project[`chapter_${chapterNum}_feedback`] || 'No feedback provided yet. Your chapter is pending review.'}
                                        </p>
                                      </div>
                                      {project[`chapter_${chapterNum}_feedback`] && (
                                        <p className="text-xs text-blue-600 mt-1">
                                          Last updated: {new Date().toLocaleDateString()}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Chapter Status and File Info */}
                                <div className="mt-2 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-600">Status: {project[`chapter_${chapterNum}_status`] || 'Pending Review'}</span>
                                  </div>
                                  {hasFile && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                      <FileText className="h-3 w-3" />
                                      <span>{project[`chapter_${chapterNum}_file_name`]}</span>
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No projects to report on yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border mb-4 sm:mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <FlaskConical className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
              <span className="line-clamp-1">Research Hub 🔬</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-600 line-clamp-2">Complete research management - projects, proposals & progress tracking</p>
          </div>
          <div className="flex gap-2">
            {activeTab === "proposals" && (
              <Button 
                className="bg-yellow-600 hover:bg-yellow-700 flex-1 sm:flex-none text-sm"
                onClick={() => setNewProposalDialogOpen(true)}
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="sm:hidden">Proposal</span>
                <span className="hidden sm:inline">New Proposal</span>
              </Button>
            )}
            {activeTab === "projects" && (
              <Button 
                className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none text-sm"
                onClick={() => setNewProjectDialogOpen(true)}
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="sm:hidden">Project</span>
                <span className="hidden sm:inline">New Project</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border mb-4 sm:mb-6">
        <div className="flex border-b overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 font-medium transition-colors border-b-2 text-sm sm:text-base whitespace-nowrap ${
                  activeTab === tab.id
                    ? `border-blue-500 ${tab.color} bg-blue-50`
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="hidden xs:inline sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "proposals" && renderProposalsTab()}
      {activeTab === "projects" && renderProjectsTab()}
      {activeTab === "reports" && renderReportsTab()}

      {/* Chapter Editor Dialog */}
      <Dialog open={chapterDialogOpen} onOpenChange={setChapterDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Chapter {activeChapter} - {selectedProject?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="mb-4">
              <div className="flex gap-2 mb-3">
                {[1, 2, 3, 4, 5].map(num => (
                  <Button
                    key={num}
                    variant={activeChapter === num ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setActiveChapter(num)
                      const chapterKey = `chapter_${num}_content`
                      const fileNameKey = `chapter_${num}_file_name`
                      setChapterContent(selectedProject?.[chapterKey] || "")
                      setUploadedFileName(selectedProject?.[fileNameKey] || "")
                    }}
                  >
                    Chapter {num}
                  </Button>
                ))}
              </div>
              <div className="text-sm text-gray-600 mb-3">
                {activeChapter === 1 && "Introduction and Background of the Study"}
                {activeChapter === 2 && "Review of Related Literature"}
                {activeChapter === 3 && "Research Methodology"}
                {activeChapter === 4 && "Results and Discussion"}
                {activeChapter === 5 && "Summary, Conclusions, and Recommendations"}
              </div>
              
              {/* File Upload Section */}
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Upload Chapter File</span>
                  <input
                    type="file"
                    accept=".txt,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id={`file-upload-${activeChapter}`}
                    disabled={uploadingFile}
                  />
                  <label
                    htmlFor={`file-upload-${activeChapter}`}
                    className={`px-3 py-1 text-xs rounded cursor-pointer transition-colors ${
                      uploadingFile 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    {uploadingFile ? 'Uploading...' : 'Choose File'}
                  </label>
                </div>
                {uploadedFileName && (
                  <div className="text-xs text-green-600 flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span>Uploaded: {uploadedFileName}</span>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: .txt, .pdf, .doc, .docx
                </p>
              </div>
            </div>
            <div className="flex-1 min-h-[400px]">
              <textarea
                value={chapterContent}
                onChange={(e) => setChapterContent(e.target.value)}
                placeholder={`Write your Chapter ${activeChapter} content here...`}
                className="w-full h-full p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex justify-between items-center pt-4 border-t mt-4">
            <div className="text-sm text-gray-500">
              {chapterContent.trim().length > 0 ? (
                <span className="text-green-600">✓ Content available</span>
              ) : (
                <span className="text-gray-400">No content yet</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setChapterDialogOpen(false)}
                disabled={savingChapter}
              >
                Cancel
              </Button>
              <Button
                onClick={saveChapterContent}
                disabled={savingChapter}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {savingChapter ? "Saving..." : "Save Chapter"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Project Dialog */}
      <Dialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Create New Research Project
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Title *
              </label>
              <Input
                value={newProjectForm.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                placeholder="Enter your research project title..."
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={newProjectForm.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="Describe your research project..."
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={newProjectForm.category}
                  onChange={(e) => handleFormChange('category', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Natural Sciences">Natural Sciences</option>
                  <option value="Social Sciences">Social Sciences</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Business">Business</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={newProjectForm.start_date}
                  onChange={(e) => handleFormChange('start_date', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Research Topic
              </label>
              <Input
                value={newProjectForm.research_topic}
                onChange={(e) => handleFormChange('research_topic', e.target.value)}
                placeholder="Main research topic or keywords..."
                className="w-full"
              />
            </div>

            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Image
              </label>
              <div className="space-y-3">
                {imagePreview && (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Project preview"
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setImagePreview("")
                        setProjectImage(null)
                        setNewProjectForm(prev => ({ ...prev, image_url: "" }))
                      }}
                      className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                    >
                      Remove
                    </Button>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="flex-1"
                    disabled={uploadingImage}
                  />
                  {uploadingImage && (
                    <div className="text-sm text-blue-600">Uploading...</div>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Upload an image to represent your research project (recommended: 16:9 aspect ratio)
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setNewProjectDialogOpen(false)
                  setNewProjectForm({
                    title: "",
                    description: "",
                    category: "",
                    research_topic: "",
                    start_date: "",
                    image_url: ""
                  })
                  setImagePreview("")
                  setProjectImage(null)
                }}
                disabled={creatingProject}
              >
                Cancel
              </Button>
              <Button
                onClick={createNewProject}
                disabled={creatingProject || !newProjectForm.title.trim() || !newProjectForm.description.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {creatingProject ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Project Dialog */}
      <Dialog open={viewProjectDialogOpen} onOpenChange={setViewProjectDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <Eye className="h-5 w-5" />
              View Research Project
            </DialogTitle>
          </DialogHeader>
          {viewProject && (
            <div className="space-y-6">
              {/* Pre-Oral Defense Status and Feedback */}
              <div className="mb-4 flex items-center gap-3">
                <Badge className={
                  viewProject.pre_oral_defense_status === 'Passed' ? 'bg-green-100 text-green-800' :
                  viewProject.pre_oral_defense_status === 'Failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }>
                  Pre-Oral Defense: {viewProject.pre_oral_defense_status || 'Not Started'}
                </Badge>
              </div>
              {viewProject.pre_oral_defense_feedback && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800 mb-1">Pre-Oral Defense Feedback:</p>
                      <p className="text-sm text-blue-700">{viewProject.pre_oral_defense_feedback}</p>
                    </div>
                  </div>
                </div>
              )}
              {/* Project Header - Image Left, Title & Description Right */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Side - Project Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Image
                  </label>
                  <div className="w-full border border-gray-300 rounded-lg bg-gray-50 p-4">
                    {viewProject.image_url ? (
                      <div className="space-y-3">
                        <div className="relative">
                          <img 
                            src={viewProject.image_url} 
                            alt={viewProject.title}
                            className="w-full h-64 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                          <div 
                            className="w-full h-64 bg-gray-100 rounded-lg border border-gray-200 flex flex-col items-center justify-center text-gray-500"
                            style={{ display: 'none' }}
                          >
                            <FlaskConical className="h-12 w-12 mb-2" />
                            <p className="text-sm">Failed to load image</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Current project image</span>
                          <div className="flex items-center gap-2">
                            {editingImage ? (
                              <>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleProjectImageUpdate}
                                  className="hidden"
                                  id="replace-image-input"
                                  disabled={updatingProjectImage}
                                />
                                <label
                                  htmlFor="replace-image-input"
                                  className={`px-3 py-1 text-sm border border-blue-300 rounded text-blue-600 hover:bg-blue-50 cursor-pointer ${
                                    updatingProjectImage ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                >
                                  {updatingProjectImage ? 'Uploading...' : 'Choose New Image'}
                                </label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingImage(false)}
                                  disabled={updatingProjectImage}
                                  className="text-gray-600 hover:text-gray-700"
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingImage(true)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit3 className="h-4 w-4 mr-1" />
                                Replace Image
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto bg-gray-200 rounded-lg flex items-center justify-center mb-3">
                          <FlaskConical className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-sm mb-3">No image uploaded</p>
                        {editingImage ? (
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleProjectImageUpdate}
                              className="hidden"
                              id="add-image-input"
                              disabled={updatingProjectImage}
                            />
                            <label
                              htmlFor="add-image-input"
                              className={`px-3 py-1 text-sm border border-blue-300 rounded text-blue-600 hover:bg-blue-50 cursor-pointer ${
                                updatingProjectImage ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              {updatingProjectImage ? 'Uploading...' : 'Choose Image'}
                            </label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingImage(false)}
                              disabled={updatingProjectImage}
                              className="text-gray-600 hover:text-gray-700"
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingImage(true)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Image
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side - Title & Description */}
                <div className="space-y-4">
                  {/* Project Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Title
                    </label>
                    <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                      {viewProject.title}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 min-h-[180px] flex items-start">
                      {viewProject.description || 'No description provided'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Category and Start Date Row */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                    {viewProject.category || 'Not specified'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                    {viewProject.start_date ? new Date(viewProject.start_date).toLocaleDateString() : 'Not set'}
                  </div>
                </div>
              </div>

              {/* Research Topic */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Research Topic
                </label>
                <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                  {viewProject.research_topic || 'Not specified'}
                </div>
              </div>

              {/* Progress Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Research Progress
                </label>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                        <span className="text-sm font-semibold text-blue-600">{viewProject.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${viewProject.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Status Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border border-gray-300 rounded-lg bg-gray-50">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <Badge className={getStatusColor(viewProject.status)}>
                        {viewProject.status === 'completed' ? 'Completed' : 
                         viewProject.status === 'in_progress' ? 'In Progress' : 
                         viewProject.status}
                      </Badge>
                    </div>
                    <div className="p-3 border border-gray-300 rounded-lg bg-gray-50">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                      <p className="text-gray-900 text-sm">
                        {new Date(viewProject.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chapter Progress */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Chapter Progress
                </label>
                <div className="space-y-3">
                  {[
                    { num: 1, title: "Introduction and Background of the Study" },
                    { num: 2, title: "Review of Related Literature" },
                    { num: 3, title: "Research Methodology" },
                    { num: 4, title: "Results and Discussion" },
                    { num: 5, title: "Summary, Conclusions, and Recommendations" }
                  ].map(chapter => {
                    const isCompleted = viewProject[`chapter_${chapter.num}_completed`];
                    const hasContent = viewProject[`chapter_${chapter.num}_content`];
                    const wordCount = hasContent ? viewProject[`chapter_${chapter.num}_content`].split(' ').length : 0;
                    
                    return (
                      <div key={chapter.num} className="border border-gray-300 rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                              isCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {chapter.num}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                Chapter {chapter.num}: {chapter.title}
                              </h4>
                              {wordCount > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {wordCount.toLocaleString()} words
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={
                              !viewProject[`chapter_${chapter.num}_file_name`] ? 'bg-gray-100 text-gray-600' :
                              viewProject[`chapter_${chapter.num}_status`] === 'Completed' ? 'bg-green-100 text-green-800' :
                              viewProject[`chapter_${chapter.num}_status`] === 'To Revise' ? 'bg-yellow-100 text-yellow-800' :
                              viewProject[`chapter_${chapter.num}_status`] === 'Pending Review' ? 'bg-blue-100 text-blue-800' :
                              viewProject[`chapter_${chapter.num}_status`] === 'Not Started' ? 'bg-gray-100 text-gray-600' :
                              'bg-gray-100 text-gray-600'
                            }>
                              {!viewProject[`chapter_${chapter.num}_file_name`] ? 'Not Started' : (viewProject[`chapter_${chapter.num}_status`] || 'Pending Review')}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openChapterEditor(viewProject, chapter.num)}
                              className={`text-xs px-3 py-1 ${
                                hasContent 
                                  ? 'text-blue-600 border-blue-200 hover:bg-blue-50' 
                                  : 'text-green-600 border-green-200 hover:bg-green-50'
                              }`}
                            >
                              {hasContent ? (
                                <>
                                  <Edit3 className="w-3 h-3 mr-1" />
                                  Edit Chapter
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add Chapter
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        {/* Always show feedback section if there's content or file */}
                        {(hasContent || viewProject[`chapter_${chapter.num}_file_name`]) && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-blue-800 mb-1">Adviser Feedback:</p>
                                <div className="bg-white rounded p-2 border border-blue-100">
                                  <p className="text-sm text-gray-700">
                                    {viewProject[`chapter_${chapter.num}_feedback`] || 'No feedback provided yet. Your chapter is pending review.'}
                                  </p>
                                </div>
                                {viewProject[`chapter_${chapter.num}_feedback`] && (
                                  <p className="text-xs text-blue-600 mt-1">
                                    Last updated: {new Date().toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setViewProjectDialogOpen(false)}
                  className="px-6"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setViewProjectDialogOpen(false)
                    openEditProject(viewProject)
                  }}
                  className="bg-blue-600 hover:bg-blue-700 px-6"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Project
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={editProjectDialogOpen} onOpenChange={setEditProjectDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Edit Research Project
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Title *
              </label>
              <Input
                value={editProjectForm.title}
                onChange={(e) => handleEditFormChange('title', e.target.value)}
                placeholder="Enter your research project title..."
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={editProjectForm.description}
                onChange={(e) => handleEditFormChange('description', e.target.value)}
                placeholder="Describe your research project..."
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={editProjectForm.category}
                  onChange={(e) => handleEditFormChange('category', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Natural Sciences">Natural Sciences</option>
                  <option value="Social Sciences">Social Sciences</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Business">Business</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={editProjectForm.start_date}
                  onChange={(e) => handleEditFormChange('start_date', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Research Topic
              </label>
              <Input
                value={editProjectForm.research_topic}
                onChange={(e) => handleEditFormChange('research_topic', e.target.value)}
                placeholder="Main research topic or keywords..."
                className="w-full"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setEditProjectDialogOpen(false)
                  setEditProject(null)
                  setEditProjectForm({
                    title: "",
                    description: "",
                    category: "",
                    research_topic: "",
                    start_date: ""
                  })
                }}
                disabled={updatingProject}
              >
                Cancel
              </Button>
              <Button
                onClick={updateProject}
                disabled={updatingProject || !editProjectForm.title.trim() || !editProjectForm.description.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updatingProject ? "Updating..." : "Update Project"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Proposal Dialog */}
      <Dialog open={viewProposalDialogOpen} onOpenChange={setViewProposalDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader className="pb-3 sm:pb-6">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Eye className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span>Proposal Details</span>
            </DialogTitle>
          </DialogHeader>
          {viewProposal && (
            <div className="space-y-4 sm:space-y-6">
              {/* Proposal Header */}
              <div className="border-b pb-3 sm:pb-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-2">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 line-clamp-2 flex-1">{viewProposal.title}</h2>
                  <Badge className={`${getProposalStatusColor(viewProposal.status)} self-start sm:self-auto flex-shrink-0`}>
                    {getProposalStatusLabel(viewProposal.status)}
                  </Badge>
                </div>
                <p className="text-sm sm:text-base text-gray-600 line-clamp-3 sm:line-clamp-none">{viewProposal.description}</p>
              </div>

              {/* Proposal Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Category</label>
                    <p className="text-sm sm:text-base text-gray-900">{viewProposal.category || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Research Topic</label>
                    <p className="text-sm sm:text-base text-gray-900 line-clamp-2 sm:line-clamp-none">{viewProposal.research_topic || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Submitted Date</label>
                    <p className="text-sm sm:text-base text-gray-900">
                      {new Date(viewProposal.submitted_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status</label>
                    <div className="flex items-center gap-2">
                      <Badge className={getProposalStatusColor(viewProposal.status)}>
                        {getProposalStatusLabel(viewProposal.status)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                    <p className="text-sm sm:text-base text-gray-900">
                      {new Date(viewProposal.updated_at || viewProposal.submitted_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Review Progress</label>
                    <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 mb-1">
                      <div 
                        className={`h-2 sm:h-3 rounded-full transition-all duration-300 ${
                          viewProposal.status === 'approved' ? 'bg-green-500 w-full' :
                          viewProposal.status === 'under_review' ? 'bg-blue-500 w-2/3' :
                          viewProposal.status === 'rejected' ? 'bg-red-500 w-1/3' :
                          'bg-yellow-500 w-1/3'
                        }`}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2 sm:line-clamp-none">
                      {viewProposal.status === 'approved' ? 'Approved - Ready to start research' :
                       viewProposal.status === 'under_review' ? 'Currently being reviewed by advisers' :
                       viewProposal.status === 'rejected' ? 'Requires revision based on feedback' :
                       'Waiting for initial review'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Adviser Feedback Section */}
              {viewProposal.feedback && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                  <h3 className="text-xs sm:text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                    <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span>Adviser Feedback</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">{viewProposal.feedback}</p>
                </div>
              )}

              {/* Status Timeline */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Review Timeline</h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm">Proposal Submitted</p>
                      <p className="text-xs text-gray-600">
                        {new Date(viewProposal.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${
                      ['under_review', 'approved', 'rejected'].includes(viewProposal.status) 
                        ? 'bg-green-500' 
                        : 'bg-gray-300'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm">Under Review</p>
                      <p className="text-xs text-gray-600">
                        {['under_review', 'approved', 'rejected'].includes(viewProposal.status)
                          ? 'In progress'
                          : 'Pending'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${
                      viewProposal.status === 'approved' ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm">Final Decision</p>
                      <p className="text-xs text-gray-600 line-clamp-1 sm:line-clamp-none">
                        {viewProposal.status === 'approved' ? 'Approved - Ready to start project' :
                         viewProposal.status === 'rejected' ? 'Revision required' :
                         'Pending review completion'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-2 pt-3 sm:pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setViewProposalDialogOpen(false)}
                  className="w-full sm:w-auto order-3 sm:order-1"
                  size="sm"
                >
                  Close
                </Button>
                {viewProposal.status === 'rejected' && (
                  <Button
                    className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto order-1 sm:order-2"
                    size="sm"
                  >
                    <Edit3 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    <span className="text-sm">Revise Proposal</span>
                  </Button>
                )}
                {viewProposal.status === 'approved' && (
                  <Button
                    className="bg-green-600 hover:bg-green-700 w-full sm:w-auto order-1 sm:order-2"
                    size="sm"
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    <span className="text-sm">Create Project</span>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Proposal Dialog */}
      <Dialog open={newProposalDialogOpen} onOpenChange={setNewProposalDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Submit New Research Proposal
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proposal Title *
              </label>
              <Input
                value={proposalForm.title}
                onChange={(e) => handleProposalFormChange('title', e.target.value)}
                placeholder="Enter your research proposal title..."
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={proposalForm.description}
                onChange={(e) => handleProposalFormChange('description', e.target.value)}
                placeholder="Describe your research proposal, objectives, methodology, and expected outcomes..."
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={proposalForm.category}
                  onChange={(e) => handleProposalFormChange('category', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  <option value="Database Expert">Database Expert</option>
                  <option value="Kai">Kai</option>
                  <option value="Mobile App">Mobile App</option>
                  <option value="Website">Website</option>
                  <option value="Hardware/Software">Hardware/Software</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Research Topic
                </label>
                <Input
                  value={proposalForm.research_topic}
                  onChange={(e) => handleProposalFormChange('research_topic', e.target.value)}
                  placeholder="Main research topic or keywords..."
                  className="w-full"
                />
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> Once submitted, your proposal will be reviewed by advisers. 
                Approved proposals will automatically create research projects that you can work on.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setNewProposalDialogOpen(false)
                  setProposalForm({
                    title: "",
                    description: "",
                    category: "",
                    research_topic: ""
                  })
                }}
                disabled={submittingProposal}
              >
                Cancel
              </Button>
              <Button
                onClick={createNewProposal}
                disabled={submittingProposal || !proposalForm.title.trim() || !proposalForm.description.trim()}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                {submittingProposal ? "Submitting..." : "Submit Proposal"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ResearchHub
