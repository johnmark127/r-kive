"use client"

import { useEffect, useState } from "react"
import ToastManager, { useToast } from "@/components/ToastManager"
import { supabase } from "@/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Clock, CheckCircle, XCircle, Search, Eye, User, Calendar, Download } from "lucide-react"

const AccessRequestsPage = () => {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewRequest, setViewRequest] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const [accessDuration, setAccessDuration] = useState("7"); // Default 7 days
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [accessRequests, setAccessRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const { showToast } = useToast();

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true)
      setError("")
      const { data, error } = await supabase
        .from("research_paper_access_requests")
        .select(`
          id,
          student_id,
          student_name,
          student_email,
          status,
          created_at,
          reason,
          paper_id,
          research_papers (
            id,
            title,
            authors
          )
        `)
        .order("created_at", { ascending: false })
      if (error) {
        setError(error.message)
        setAccessRequests([])
      } else {
        // Flatten paper info into each request for easier rendering
        setAccessRequests(
          data.map(req => ({
            ...req,
            paperTitle: req.research_papers?.title || "",
            paperAuthor: req.research_papers?.authors || "",
            requestDate: req.created_at,
          }))
        )
      }
      setLoading(false)
    }
    fetchRequests()
  }, [])

  // Stats calculation
  const stats = [
    {
      title: "Pending Requests",
      value: accessRequests.filter(r => r.status === "pending").length,
      icon: Clock,
      color: "bg-yellow-50 text-yellow-600",
      change: "", // Optionally, you can calculate daily/weekly change
    },
    {
      title: "Approved Requests",
      value: accessRequests.filter(r => r.status === "approved").length,
      icon: CheckCircle,
      color: "bg-green-50 text-green-600",
      change: "",
    },
    {
      title: "Rejected Requests",
      value: accessRequests.filter(r => r.status === "rejected").length,
      icon: XCircle,
      color: "bg-red-50 text-red-600",
      change: "",
    },
    {
      title: "Total Papers Requested",
      value: accessRequests.length,
      icon: FileText,
      color: "bg-blue-50 text-blue-600",
      change: "",
    },
  ]

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        variant: "secondary",
        className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
        icon: Clock,
      },
      approved: {
        variant: "default",
        className: "bg-green-100 text-green-800 hover:bg-green-100",
        icon: CheckCircle,
      },
      rejected: {
        variant: "destructive",
        className: "bg-red-100 text-red-800 hover:bg-red-100",
        icon: XCircle,
      },
    }
    return statusConfig[status] || statusConfig.pending
  }

  // Admin actions (approve/reject) - you can implement Supabase update here as needed
  const handleApprove = (requestId) => {
    setApprovingId(requestId);
    setAccessDuration("7"); // Reset to default
    setShowApproveModal(true);
  };

  const confirmApprove = async () => {
    if (!accessDuration || accessDuration <= 0) {
      showToast && showToast("Please select a valid access duration.", "warning");
      return;
    }

    // Calculate expiration date
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + parseInt(accessDuration));

    const { error } = await supabase
      .from("research_paper_access_requests")
      .update({ 
        status: "approved",
        approved_at: new Date().toISOString(),
        expires_at: expirationDate.toISOString()
      })
      .eq("id", approvingId)
    
    if (error) {
      showToast && showToast("Failed to approve request: " + error.message, "error");
    } else {
      setAccessRequests(reqs => reqs.map(r => r.id === approvingId ? { 
        ...r, 
        status: "approved",
        approved_at: new Date().toISOString(),
        expires_at: expirationDate.toISOString()
      } : r));
      
      // Log activity
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      const req = accessRequests.find(r => r.id === approvingId);
      await supabase.from("activities").insert([
        {
          user_id: userId,
          type: "accept student request",
          description: `Accepted access request for research paper: ${req?.paperTitle || approvingId} (Expires in ${accessDuration} days)`,
          timestamp: new Date().toISOString(),
          target_id: approvingId,
          meta: {
            student: req?.student_name,
            paper: req?.paperTitle,
            access_duration: accessDuration,
            expires_at: expirationDate.toISOString()
          },
        },
      ]);
      showToast && showToast(`Request approved! Access granted for ${accessDuration} days.`, "success");
      setShowApproveModal(false);
      setApprovingId(null);
    }
  };

  const handleReject = (requestId) => {
    setRejectingId(requestId);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      showToast && showToast("Please provide a reason for rejection.", "warning");
      return;
    }
    const { error } = await supabase
      .from("research_paper_access_requests")
      .update({ status: "rejected", reason: rejectReason })
      .eq("id", rejectingId);
    if (error) {
      showToast && showToast("Failed to reject request: " + error.message, "error");
    } else {
      setAccessRequests(reqs => reqs.map(r => r.id === rejectingId ? { ...r, status: "rejected", reason: rejectReason } : r));
      // Log activity
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      const req = accessRequests.find(r => r.id === rejectingId);
      await supabase.from("activities").insert([
        {
          user_id: userId,
          type: "reject student request",
          description: `Rejected access request for research paper: ${req?.paperTitle || rejectingId}`,
          timestamp: new Date().toISOString(),
          target_id: rejectingId,
          meta: {
            student: req?.student_name,
            paper: req?.paperTitle,
            reason: rejectReason,
          },
        },
      ]);
      showToast && showToast("Request rejected.", "success");
      setShowRejectModal(false);
      setRejectingId(null);
      setRejectReason("");
    }
  };

  const filteredRequests = accessRequests.filter((request) => {
    const matchesSearch =
      (request.student_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.paperTitle || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.student_email || "").toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterStatus === "all" || request.status === filterStatus

    return matchesSearch && matchesFilter
  })

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <ToastManager />
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Access Requests</h1>
            <p className="text-gray-600">Manage student requests for full research paper access</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm mt-1 text-gray-600">{stat.change}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                onClick={() => setFilterStatus("all")}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={filterStatus === "pending" ? "default" : "outline"}
                onClick={() => setFilterStatus("pending")}
                size="sm"
              >
                Pending
              </Button>
              <Button
                variant={filterStatus === "approved" ? "default" : "outline"}
                onClick={() => setFilterStatus("approved")}
                size="sm"
              >
                Approved
              </Button>
              <Button
                variant={filterStatus === "rejected" ? "default" : "outline"}
                onClick={() => setFilterStatus("rejected")}
                size="sm"
              >
                Rejected
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Access Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {loading ? "Loading..." : error ? "Error loading requests" : `Access Requests (${filteredRequests.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-gray-500">Loading requests...</div>
          ) : error ? (
            <div className="py-10 text-center text-red-500">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Student</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Paper Requested</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Request Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{request.student_name}</div>
                            <div className="text-sm text-gray-500">{request.student_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="max-w-xs">
                          <div className="font-medium text-gray-900 truncate">{request.paperTitle}</div>
                          <div className="text-sm text-gray-500">by {request.paperAuthor}</div>
                          <div className="text-xs text-gray-400 mt-1">{request.reason}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          {request.requestDate ? new Date(request.requestDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }) : ""}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          variant={getStatusBadge(request.status).variant}
                          className={getStatusBadge(request.status).className}
                        >
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          {request.status === "pending" ? (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleApprove(request.id)}
                                className="text-green-600 hover:bg-green-50"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleReject(request.id)}
                                className="text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => { setViewRequest(request); setShowViewModal(true); }}
                                className="text-blue-600 hover:bg-blue-50"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => { setViewRequest(request); setShowViewModal(true); }}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredRequests.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No access requests found matching your criteria.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Approve with Duration Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-2 text-green-700">✓ Approve Access Request</h2>
            <p className="mb-4 text-gray-700">Set the duration for which the student will have access to the full paper:</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Access Duration</label>
              <select
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={accessDuration}
                onChange={(e) => setAccessDuration(e.target.value)}
              >
                <option value="1">1 Day</option>
                <option value="3">3 Days</option>
                <option value="7">7 Days (1 Week)</option>
                <option value="14">14 Days (2 Weeks)</option>
                <option value="30">30 Days (1 Month)</option>
                <option value="60">60 Days (2 Months)</option>
                <option value="90">90 Days (3 Months)</option>
                <option value="180">180 Days (6 Months)</option>
                <option value="365">365 Days (1 Year)</option>
              </select>
              
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-800">
                  <span className="font-semibold">⏰ Note:</span> Access will automatically expire after the selected duration. 
                  The student will need to request access again if needed.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowApproveModal(false); setApprovingId(null); }}>Cancel</Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={confirmApprove}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Access
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-2">Reject Request</h2>
            <p className="mb-2 text-gray-700">Please provide a reason for rejecting this request:</p>
            <textarea
              className="w-full border border-gray-300 rounded-md p-2 mb-4"
              rows={3}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Enter reason..."
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowRejectModal(false); setRejectingId(null); setRejectReason(""); }}>Cancel</Button>
              <Button variant="destructive" onClick={confirmReject}>Reject</Button>
            </div>
          </div>
        </div>
      )}

      {/* View Request Modal */}
      {showViewModal && viewRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4">Request Details</h2>
            <div className="mb-2"><span className="font-medium">Student:</span> {viewRequest.student_name} ({viewRequest.student_email})</div>
            <div className="mb-2"><span className="font-medium">Paper:</span> {viewRequest.paperTitle} <span className="text-gray-500">by {viewRequest.paperAuthor}</span></div>
            <div className="mb-2"><span className="font-medium">Status:</span> {viewRequest.status.charAt(0).toUpperCase() + viewRequest.status.slice(1)}</div>
            <div className="mb-2"><span className="font-medium">Requested on:</span> {viewRequest.requestDate ? new Date(viewRequest.requestDate).toLocaleString() : ""}</div>
            <div className="mb-2"><span className="font-medium">Reason (if rejected):</span> {viewRequest.reason || <span className="text-gray-400">N/A</span>}</div>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => { setShowViewModal(false); setViewRequest(null); }}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AccessRequestsPage