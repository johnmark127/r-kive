"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react"
import { supabase } from "../../../../supabase/client"

const SubmitResearch = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    researchTopic: "",
    documents: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [currentUser, setCurrentUser] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Get current user on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
          return
        }
        if (session?.user) {
          // Always use Supabase session user for email and id
          setCurrentUser({
            uid: session.user.id,
            email: session.user.email,
            role: 'student',
            student_email: session.user.email
          })
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      }
    }
    getCurrentUser()
  }, [])

  const categories = [
    "Website",
    "Database Expert",
    "Software/Hardware", 
    "KAI",
    "Mobile Application"
  ]

  const researchTopics = [
    "Artificial Intelligence",
    "Machine Learning", 
    "Data Science",
    "Cybersecurity",
    "Blockchain",
    "Internet of Things (IoT)",
    "Cloud Computing",
    "Network Systems",
    "Computer Graphics",
    "Human-Computer Interaction",
    "Information Systems",
    "Other"
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const validTypes = ['.pdf', '.doc', '.docx', '.txt']
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
      const isValidType = validTypes.includes(fileExtension)
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB limit
      
      if (!isValidType) {
        setSubmitError(`Invalid file type: ${file.name}. Only PDF, DOC, DOCX, and TXT files are allowed.`)
        return false
      }
      
      if (!isValidSize) {
        setSubmitError(`File too large: ${file.name}. Maximum size is 10MB.`)
        return false
      }
      
      return true
    })
    
    if (validFiles.length !== files.length) {
      return // Error already set above
    }
    
    setSubmitError("") // Clear any previous errors
    setFormData(prev => ({
      ...prev,
      documents: validFiles
    }))
  }

  const uploadFileToSupabase = async (file, proposalId) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${proposalId}-${Date.now()}.${fileExt}`
      const filePath = `research-proposals/${fileName}`

      const { data, error } = await supabase.storage
        .from('research-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw error
      }

      return {
        fileName: file.name,
        filePath: data.path,
        fileSize: file.size,
        fileType: file.type || `application/${fileExt}`
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      throw new Error(`Failed to upload ${file.name}: ${error.message}`)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError("")
    setSubmitSuccess(false)
    setUploadProgress(0)

    try {
      // Validation
      if (!formData.title.trim()) {
        throw new Error("Research title is required")
      }
      if (!formData.description.trim()) {
        throw new Error("Research description is required")
      }
      if (!formData.category) {
        throw new Error("Please select a category")
      }
      if (!formData.researchTopic) {
        throw new Error("Please select a research topic")
      }
      if (!currentUser?.uid) {
        throw new Error("User authentication required")
      }

      // First, insert the research proposal record
      if (!currentUser?.email && !currentUser?.student_email) {
        throw new Error("Student email is required to submit proposal. Please ensure your account has a valid email.")
      }
      const proposalData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        research_topic: formData.researchTopic,
        student_id: currentUser.uid,
        student_email: currentUser.email || currentUser.student_email,
        status: 'pending'
      }

      const { data: proposal, error: insertError } = await supabase
        .from('research_proposals')
        .insert([proposalData])
        .select()
        .single()

      if (insertError) {
        throw new Error(`Failed to submit proposal: ${insertError.message}`)
      }

      // If files are uploaded, handle file upload and update the record
      if (formData.documents.length > 0) {
        setUploadProgress(25)
        
        try {
          const uploadedFiles = []
          
          // Upload each file
          for (let i = 0; i < formData.documents.length; i++) {
            const file = formData.documents[i]
            const fileData = await uploadFileToSupabase(file, proposal.id)
            uploadedFiles.push(fileData)
            
            // Update progress for each file
            const progress = 25 + ((i + 1) / formData.documents.length) * 50
            setUploadProgress(Math.round(progress))
          }
          
          // For now, store the first file's info in the main columns
          // You could extend your schema to have a separate files table for multiple files
          const primaryFile = uploadedFiles[0]
          
          // Update the proposal record with file information
          const { error: updateError } = await supabase
            .from('research_proposals')
            .update({
              file_name: primaryFile.fileName,
              file_path: primaryFile.filePath,
              file_size: primaryFile.fileSize,
              file_type: primaryFile.fileType
            })
            .eq('id', proposal.id)

          if (updateError) {
            console.error('Error updating file info:', updateError)
            // Don't throw error here as the proposal is already submitted
          }
          
          // If you have multiple files, you might want to create a separate table
          // or modify your schema to handle multiple files per proposal
          
        } catch (fileError) {
          console.error('File upload error:', fileError)
          // Set a warning but don't fail the submission
          setSubmitError(`Proposal submitted successfully, but file upload failed: ${fileError.message}`)
        }
      }

      setUploadProgress(100)
      setSubmitSuccess(true)
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "",
        researchTopic: "",
        documents: []
      })

      // Reset file input
      const fileInput = document.getElementById('documents')
      if (fileInput) {
        fileInput.value = ''
      }

    } catch (error) {
      console.error('Submission error:', error)
      setSubmitError(error.message)
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Upload className="h-6 w-6 text-blue-600" />
              Submit Research Project 📝
            </h1>
            <p className="text-gray-600">Propose a new research project for review and approval</p>
          </div>
          {currentUser && (
            <div className="text-right">
              <p className="text-sm text-gray-600">Submitting as:</p>
              <p className="text-sm font-medium text-gray-900">{currentUser.email}</p>
            </div>
          )}
        </div>
      </div>

      {/* Authentication Check */}
      {!currentUser ? (
        <Card className="mb-6">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication Required</h3>
            <p className="text-gray-600">Please log in to submit a research proposal.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Submission Guidelines */}
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Submission Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-800">
              <ul className="space-y-2">
                <li>• Ensure your research proposal is original and not previously submitted</li>
                <li>• Provide a clear and detailed description of your research objectives</li>
                <li>• Select the most appropriate category for your research</li>
                <li>• Attach any supporting documents (proposal, references, etc.)</li>
                <li>• Review all information carefully before submission</li>
              </ul>
            </CardContent>
          </Card>

      {/* Submission Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Research Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Research Title *
                </label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter your research project title"
                  required
                  className="w-full"
                />
              </div>

              <div className="lg:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Research Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Provide a detailed description of your research project, objectives, methodology, and expected outcomes..."
                  required
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="researchTopic" className="block text-sm font-medium text-gray-700 mb-2">
                  Research Topic *
                </label>
                <select
                  id="researchTopic"
                  name="researchTopic"
                  value={formData.researchTopic}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a research topic</option>
                  {researchTopics.map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label htmlFor="documents" className="block text-sm font-medium text-gray-700 mb-2">
                Supporting Documents
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <input
                  id="documents"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="documents"
                  className="cursor-pointer text-sm text-gray-600 hover:text-gray-800"
                >
                  Click to upload research proposal, references, or other supporting documents
                  <br />
                  <span className="text-xs text-gray-500">PDF, DOC, DOCX, TXT files up to 10MB each</span>
                </label>
                {formData.documents.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Selected files:</p>
                    <ul className="text-sm text-gray-600">
                      {formData.documents.map((file, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {file.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Error/Success Messages */}
            {submitError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-600">{submitError}</p>
                </div>
              </div>
            )}

            {submitSuccess && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-600 font-medium">
                    Research project submitted successfully!
                  </p>
                </div>
                <p className="text-xs text-green-500">
                  Your submission will be reviewed by the research committee. You'll receive an email notification about the status.
                </p>
              </div>
            )}

            {/* Upload Progress */}
            {isSubmitting && uploadProgress > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Upload className="h-4 w-4 text-blue-600" />
                  <p className="text-sm text-blue-600 font-medium">
                    Uploading files... {uploadProgress}%
                  </p>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Save as Draft
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !currentUser}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {uploadProgress > 0 ? "Uploading..." : "Submitting..."}
                  </div>
                ) : (
                  "Submit Research Project"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  )
}

export default SubmitResearch
