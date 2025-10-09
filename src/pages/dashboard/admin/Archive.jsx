"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Eye, Trash2, Search, Calendar, User, FolderOpen } from "lucide-react"
import { useState, useEffect } from "react"
import { supabase } from "@/supabase/client" // <-- Make sure this path is correct
import Toast from "@/components/Toast"

const ArchivePage = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [researchPapers, setResearchPapers] = useState([])
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false })

  // Helper to show toast
  const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true })
  }

  // Fetch all research papers on mount
  useEffect(() => {
    fetchAllPapers()
  }, [])

  const fetchAllPapers = async () => {
    const { data, error } = await supabase
      .from("research_papers")
      .select("*")
      .order("uploaded_at", { ascending: false })
    if (error) {
      showToast("Failed to fetch papers: " + error.message, 'error')
    } else {
      setResearchPapers(data)
    }
  }

  // Get unique categories for the dropdown
  const categories = Array.from(
    new Set(researchPapers.map((p) => p.category).filter(Boolean))
  )

  // Filter papers based on search and category
  const filteredPapers = researchPapers.filter(
    (paper) =>
      (categoryFilter === "" || paper.category === categoryFilter) &&
      (
        (paper.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (paper.authors || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (String(paper.year_published) || "").includes(searchTerm) ||
        (paper.category || "").toLowerCase().includes(searchTerm.toLowerCase())
      )
  )

  const handleViewPaper = (paper) => {
    setSelectedPaper(paper)
    setShowModal(true)
  }

  const handleDeletePaper = async (paperId) => {
    if (window.confirm("Are you sure you want to delete this research paper?")) {
      const { error } = await supabase.from("research_papers").delete().eq("id", paperId)
      if (error) {
        showToast("Failed to delete paper: " + error.message, 'error')
      } else {
        showToast("Research paper deleted successfully.", 'success')
        fetchAllPapers()
      }
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedPaper(null)
  }

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
      {/* Welcome Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center">
              <FolderOpen className="w-6 h-6 mr-2 text-blue-600" />
              Research Papers Archive
            </h1>
            <p className="text-gray-600">Browse and manage archived research papers</p>
          </div>
        </div>
      </div>

      {/* Archive Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Research Papers Archive</CardTitle>
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0 mt-2">
            <div className="relative w-full md:w-1/2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search papers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="w-full md:w-1/3">
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Title</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Authors</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Year Published</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPapers.map((paper) => (
                  <tr
                    key={paper.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900 max-w-xs truncate">{paper.title}</div>
                    </td>
                    <td className="py-4 px-4 text-gray-600 max-w-xs truncate">{paper.authors}</td>
                    <td className="py-4 px-4 text-gray-600">{paper.year_published}</td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {paper.category}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewPaper(paper)}
                          className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeletePaper(paper.id)}
                          className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPapers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No research papers found matching your search criteria.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Abstract Modal */}
      {showModal && selectedPaper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900 pr-4">{selectedPaper.title}</h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">
                  ×
                </button>
              </div>
              <div className="mb-4 text-gray-600 space-y-1">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  <span>
                    <strong>Authors:</strong> {selectedPaper.authors}
                  </span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>
                    <strong>Year:</strong> {selectedPaper.year_published}
                  </span>
                </div>
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  <span>
                    <strong>Category:</strong> {selectedPaper.category}
                  </span>
                </div>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Abstract</h3>
                <p className="text-gray-700 leading-relaxed">{selectedPaper.abstract}</p>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => window.open(selectedPaper.file_url, "_blank")}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Full Research Paper
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ArchivePage