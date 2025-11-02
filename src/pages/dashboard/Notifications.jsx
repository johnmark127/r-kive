import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Bell, 
  Search, 
  Check, 
  CheckCheck,
  Trash2,
  Filter,
  Calendar,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  FileText,
  Users,
  Settings as SettingsIcon,
  ArrowLeft
} from "lucide-react"

const Notifications = () => {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [filteredNotifications, setFilteredNotifications] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all") // all, unread, read
  const [filterCategory, setFilterCategory] = useState("all") // all, success, message, reminder, info
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  useEffect(() => {
    filterNotifications()
  }, [notifications, searchQuery, filterType, filterCategory])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      // Temporary mock data - expanded set
      const mockNotifications = [
        {
          id: 1,
          title: "Research Proposal Approved",
          message: "Your research proposal 'AI-Powered Learning Analytics System' has been approved by the committee. You can now proceed with your research.",
          time: "2024-11-02T10:30:00Z",
          read: false,
          type: "success",
          category: "Research"
        },
        {
          id: 2,
          title: "New Message from Adviser",
          message: "Dr. Maria Santos sent you a message about your progress report. Please check your messages.",
          time: "2024-11-02T09:15:00Z",
          read: false,
          type: "message",
          category: "Messages"
        },
        {
          id: 3,
          title: "Deadline Reminder",
          message: "Your monthly progress report is due in 3 days. Please submit it before November 5, 2024.",
          time: "2024-11-02T08:00:00Z",
          read: false,
          type: "reminder",
          category: "Deadlines"
        },
        {
          id: 4,
          title: "System Update",
          message: "New features have been added to the research submission portal. Check out the enhanced citation tracking system.",
          time: "2024-11-01T14:20:00Z",
          read: true,
          type: "info",
          category: "System"
        },
        {
          id: 5,
          title: "Group Assignment Updated",
          message: "You have been assigned to Research Group 3B with Dr. John Cruz as your adviser.",
          time: "2024-11-01T11:45:00Z",
          read: true,
          type: "info",
          category: "Groups"
        },
        {
          id: 6,
          title: "Feedback Available",
          message: "Your adviser has provided feedback on your recent progress report. View the comments in your research hub.",
          time: "2024-11-01T09:30:00Z",
          read: true,
          type: "message",
          category: "Research"
        },
        {
          id: 7,
          title: "Citation Request Approved",
          message: "Your request to access the citation tree for 'Machine Learning in Education' has been approved.",
          time: "2024-10-31T16:00:00Z",
          read: true,
          type: "success",
          category: "Citations"
        },
        {
          id: 8,
          title: "Upcoming Defense Schedule",
          message: "Your research defense has been scheduled for November 15, 2024 at 2:00 PM in Room 304.",
          time: "2024-10-31T13:20:00Z",
          read: true,
          type: "reminder",
          category: "Events"
        },
        {
          id: 9,
          title: "Document Upload Successful",
          message: "Your progress report for October has been successfully uploaded and is now under review.",
          time: "2024-10-30T15:10:00Z",
          read: true,
          type: "success",
          category: "Research"
        },
        {
          id: 10,
          title: "New Announcement",
          message: "Important: Research Ethics Workshop scheduled for November 10, 2024. Attendance is mandatory for all researchers.",
          time: "2024-10-30T10:00:00Z",
          read: true,
          type: "info",
          category: "Announcements"
        }
      ]
      
      setNotifications(mockNotifications)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterNotifications = () => {
    let filtered = [...notifications]

    // Filter by read/unread
    if (filterType === "unread") {
      filtered = filtered.filter(n => !n.read)
    } else if (filterType === "read") {
      filtered = filtered.filter(n => n.read)
    }

    // Filter by category
    if (filterCategory !== "all") {
      filtered = filtered.filter(n => n.type === filterCategory)
    }

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredNotifications(filtered)
  }

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    )
  }

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }

  const deleteAllRead = () => {
    setNotifications(prev => prev.filter(notif => !notif.read))
  }

  const getTimeAgo = (timestamp) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now - time) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
    return time.toLocaleDateString()
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-5 h-5" />
      case "message":
        return <MessageSquare className="w-5 h-5" />
      case "reminder":
        return <AlertCircle className="w-5 h-5" />
      case "info":
        return <Bell className="w-5 h-5" />
      default:
        return <Bell className="w-5 h-5" />
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case "success":
        return "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
      case "message":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
      case "reminder":
        return "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
      case "info":
        return "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
      default:
        return "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Back Button */}
      <div className="mb-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                Notifications
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={markAllAsRead}
                className="flex items-center gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all as read
              </Button>
            )}
            <Button
              variant="outline"
              onClick={deleteAllRead}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              disabled={notifications.filter(n => n.read).length === 0}
            >
              <Trash2 className="w-4 h-4" />
              Clear read
            </Button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter by read status */}
            <div className="flex gap-2">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                onClick={() => setFilterType("all")}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={filterType === "unread" ? "default" : "outline"}
                onClick={() => setFilterType("unread")}
                size="sm"
              >
                Unread
                {unreadCount > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white">{unreadCount}</Badge>
                )}
              </Button>
              <Button
                variant={filterType === "read" ? "default" : "outline"}
                onClick={() => setFilterType("read")}
                size="sm"
              >
                Read
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`transition-all hover:shadow-md ${
                !notification.read 
                  ? "bg-blue-50 dark:bg-blue-900/10 border-l-4 border-l-blue-500" 
                  : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-50">
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <Badge className="bg-blue-500 text-white text-xs">New</Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {notification.category}
                        </Badge>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-1 flex-shrink-0">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="h-8 w-8 p-0"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
                      <Calendar className="w-3 h-3" />
                      {getTimeAgo(notification.time)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <Bell className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-2">
                No notifications found
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {searchQuery || filterType !== "all" || filterCategory !== "all"
                  ? "Try adjusting your filters or search query"
                  : "You're all caught up! New notifications will appear here."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Notifications
