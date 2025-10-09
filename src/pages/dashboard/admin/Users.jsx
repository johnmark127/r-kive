"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Search, UserCheck, UserX, Edit, Trash2, CheckCircle, XCircle } from "lucide-react"
import { supabase } from "@/supabase/client"
import Toast from "@/components/Toast"

const UsersPage = () => {
  const [students, setStudents] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [editingStudent, setEditingStudent] = useState(null)
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '' })
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false })

  // Toast helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true })
  }

  // Fetch all users with role "student"
  useEffect(() => {
    fetchStudents()
    // eslint-disable-next-line
  }, [])

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "student")
      .order("created_at", { ascending: false })
    if (error) {
      showToast("Failed to fetch students: " + error.message, 'error')
    } else {
      setStudents(data)
    }
  }

  // Compose full name for display
  const getName = (student) =>
    [student.firstName, student.lastName].filter(Boolean).join(" ") || "-"

  // Status is not in your schema, use "active" for now
  const getStatusBadge = (status) => {
    const statusConfig = {
      active: {
        variant: "default",
        className: "bg-green-100 text-green-800 hover:bg-green-100",
        icon: CheckCircle,
      },
      disabled: {
        variant: "secondary",
        className: "bg-red-100 text-red-800 hover:bg-red-100",
        icon: XCircle,
      },
    }
    return statusConfig[status] || statusConfig.active
  }

  // Filter by name, email, or role
  const filteredStudents = students.filter(
    (student) =>
      (student.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      getName(student).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.role || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Edit logic
  const handleEditStudent = (student) => {
    setEditingStudent(student)
    setEditForm({
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      email: student.email || '',
    })
  }

  const handleEditFormChange = (e) => {
    const { name, value } = e.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSaveEdit = async () => {
    const { error } = await supabase
      .from("users")
      .update({
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
      })
      .eq("id", editingStudent.id)
    if (error) {
      showToast("Failed to update student: " + error.message, 'error')
    } else {
      setStudents((prev) =>
        prev.map((s) =>
          s.id === editingStudent.id ? { ...s, ...editForm } : s
        )
      )
      setEditingStudent(null)
      showToast("Student updated successfully.", "success")
    }
  }

  // Delete logic
  const handleDeleteStudent = async (studentId) => {
    if (
      confirm(
        "Are you sure you want to permanently delete this student account? This action cannot be undone."
      )
    ) {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", studentId)
      if (error) {
        showToast("Failed to delete student: " + error.message, "error")
      } else {
        setStudents((prev) => prev.filter((s) => s.id !== studentId))
        showToast("Student deleted successfully.", "success")
      }
    }
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
              <Users className="w-7 h-7 mr-3 text-blue-600" />
              Student Management
            </h1>
            <p className="text-gray-600">View and manage student accounts</p>
          </div>
        </div>
      </div>

      {/* Student Accounts Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Student Accounts</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Created At</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => {
                  const statusConfig = getStatusBadge("active")
                  const StatusIcon = statusConfig.icon
                  return (
                    <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 font-medium text-gray-900">{student.email}</td>
                      <td className="py-4 px-4 text-gray-600">{getName(student)}</td>
                      <td className="py-4 px-4 text-gray-600">{student.role}</td>
                      <td className="py-4 px-4 text-gray-600">
                        {student.created_at
                          ? new Date(student.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : ""}
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          variant={statusConfig.variant}
                          className={`${statusConfig.className} flex items-center w-fit`}
                        >
                          <StatusIcon className="w-3 h-3 mr-1" />
                          active
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditStudent(student)}>
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteStudent(student.id)}>
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filteredStudents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No student accounts found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit Student</h3>
            <div className="space-y-4">
              <input
                className="w-full p-2 border rounded"
                placeholder="First Name"
                name="firstName"
                value={editForm.firstName}
                onChange={handleEditFormChange}
              />
              <input
                className="w-full p-2 border rounded"
                placeholder="Last Name"
                name="lastName"
                value={editForm.lastName}
                onChange={handleEditFormChange}
              />
              <input
                className="w-full p-2 border rounded"
                placeholder="Email"
                name="email"
                value={editForm.email}
                onChange={handleEditFormChange}
              />
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setEditingStudent(null)}>
                  Cancel
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveEdit}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersPage