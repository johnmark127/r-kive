"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  MessageSquare, 
  Send, 
  Search, 
  Plus, 
  X, 
  Loader2, 
  Bell, 
  User, 
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  Eye,
  EyeOff,
  Trash2,
  Reply,
  Forward,
  Star,
  Archive
} from "lucide-react"
import { supabase } from "../../../supabase/client"

const StudentMessages = () => {
  const [currentUser, setCurrentUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showComposeModal, setShowComposeModal] = useState(false)
  const [composeRecipient, setComposeRecipient] = useState("")
  const [composeSubject, setComposeSubject] = useState("")
  const [composeMessage, setComposeMessage] = useState("")
  const [advisers, setAdvisers] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [notifications, setNotifications] = useState([])
  const [activeTab, setActiveTab] = useState("messages")
  const [sendingMessage, setSendingMessage] = useState(false)

  // Get current user
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
          } else {
            setCurrentUser({
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

  // Fetch all data when user is available
  useEffect(() => {
    if (currentUser) {
      fetchData()
    }
  }, [currentUser])

  const fetchData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchMessages(),
        fetchAnnouncements(),
        fetchNotifications(),
        fetchAdvisers()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    try {
      if (!currentUser) return

      // Mock data for messages - replace with real data later
      const mockConversations = [
        {
          id: 1,
          adviser_id: 'adviser1',
          adviser_name: 'Dr. Maria Santos',
          last_message: 'I\'ve reviewed your research proposal. Please check my feedback and make the necessary revisions.',
          last_message_at: '2024-03-18T14:30:00Z',
          unread_count: 2,
          messages: [
            {
              id: 1,
              sender: 'adviser1',
              sender_name: 'Dr. Maria Santos',
              message: 'Good afternoon! I wanted to discuss your research proposal with you.',
              sent_at: '2024-03-18T10:15:00Z',
              read: true,
              type: 'message'
            },
            {
              id: 2,
              sender: currentUser.uid,
              sender_name: 'You',
              message: 'Thank you, Dr. Santos. I\'m ready to discuss any concerns or suggestions you might have.',
              sent_at: '2024-03-18T10:45:00Z',
              read: true,
              type: 'message'
            },
            {
              id: 3,
              sender: 'adviser1',
              sender_name: 'Dr. Maria Santos',
              message: 'I\'ve reviewed your research proposal. Please check my feedback and make the necessary revisions.',
              sent_at: '2024-03-18T14:30:00Z',
              read: false,
              type: 'message'
            }
          ]
        },
        {
          id: 2,
          adviser_id: 'adviser2',
          adviser_name: 'Prof. John Rodriguez',
          last_message: 'Your progress report looks good. Keep up the excellent work!',
          last_message_at: '2024-03-17T16:20:00Z',
          unread_count: 0,
          messages: [
            {
              id: 4,
              sender: currentUser.uid,
              sender_name: 'You',
              message: 'Hello Prof. Rodriguez, I\'ve submitted my latest progress report. Could you please review it?',
              sent_at: '2024-03-17T14:00:00Z',
              read: true,
              type: 'message'
            },
            {
              id: 5,
              sender: 'adviser2',
              sender_name: 'Prof. John Rodriguez',
              message: 'Your progress report looks good. Keep up the excellent work!',
              sent_at: '2024-03-17T16:20:00Z',
              read: true,
              type: 'message'
            }
          ]
        }
      ]

      setConversations(mockConversations)
      
      // Flatten all messages
      const allMessages = mockConversations.flatMap(conv => 
        conv.messages.map(msg => ({
          ...msg,
          conversation_id: conv.id,
          adviser_name: conv.adviser_name
        }))
      )
      setMessages(allMessages)

    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const fetchAnnouncements = async () => {
    try {
      // Mock announcements data
      const mockAnnouncements = [
        {
          id: 1,
          title: 'Research Proposal Deadline Extended',
          content: 'The deadline for research proposal submissions has been extended to March 25, 2024. Please ensure all required documents are submitted before the new deadline.',
          created_by: 'admin',
          created_by_name: 'Research Coordinator',
          created_at: '2024-03-16T09:00:00Z',
          priority: 'high',
          read: false
        },
        {
          id: 2,
          title: 'Research Ethics Workshop',
          content: 'Join us for a comprehensive workshop on research ethics and methodology. This session will cover important guidelines for conducting ethical research.',
          created_by: 'admin',
          created_by_name: 'Academic Affairs',
          created_at: '2024-03-15T11:30:00Z',
          priority: 'medium',
          read: true
        },
        {
          id: 3,
          title: 'New Research Guidelines Available',
          content: 'Updated research guidelines and formatting requirements are now available in the Guidelines section. Please review the new standards.',
          created_by: 'admin',
          created_by_name: 'Research Department',
          created_at: '2024-03-14T15:45:00Z',
          priority: 'medium',
          read: true
        }
      ]

      setAnnouncements(mockAnnouncements)
    } catch (error) {
      console.error('Error fetching announcements:', error)
    }
  }

  const fetchNotifications = async () => {
    try {
      // Mock notifications data
      const mockNotifications = [
        {
          id: 1,
          type: 'proposal_feedback',
          title: 'Research Proposal Feedback',
          message: 'Dr. Maria Santos has provided feedback on your research proposal "AI-Powered Learning System"',
          created_at: '2024-03-18T14:30:00Z',
          read: false,
          action_url: '/student/research'
        },
        {
          id: 2,
          type: 'deadline_reminder',
          title: 'Progress Report Due Soon',
          message: 'Your monthly progress report is due in 3 days. Please submit it before the deadline.',
          created_at: '2024-03-17T09:00:00Z',
          read: false,
          action_url: '/student/research'
        },
        {
          id: 3,
          type: 'approval',
          title: 'Research Proposal Approved',
          message: 'Congratulations! Your research proposal has been approved by the review committee.',
          created_at: '2024-03-15T13:20:00Z',
          read: true,
          action_url: '/student/research'
        }
      ]

      setNotifications(mockNotifications)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const fetchAdvisers = async () => {
    try {
      // Mock advisers data - in real implementation, get from assigned groups
      const mockAdvisers = [
        {
          id: 'adviser1',
          name: 'Dr. Maria Santos',
          email: 'maria.santos@university.edu',
          department: 'Computer Science'
        },
        {
          id: 'adviser2', 
          name: 'Prof. John Rodriguez',
          email: 'john.rodriguez@university.edu',
          department: 'Information Technology'
        }
      ]

      setAdvisers(mockAdvisers)
    } catch (error) {
      console.error('Error fetching advisers:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    setSendingMessage(true)
    try {
      // Mock sending - replace with real implementation
      const messageData = {
        id: Date.now(),
        sender: currentUser.uid,
        sender_name: 'You',
        message: newMessage.trim(),
        sent_at: new Date().toISOString(),
        read: true,
        type: 'message'
      }

      // Update the conversation
      setConversations(prev => prev.map(conv => {
        if (conv.id === selectedConversation.id) {
          return {
            ...conv,
            messages: [...conv.messages, messageData],
            last_message: newMessage.trim(),
            last_message_at: new Date().toISOString()
          }
        }
        return conv
      }))

      // Update selected conversation
      setSelectedConversation(prev => ({
        ...prev,
        messages: [...prev.messages, messageData]
      }))

      setNewMessage("")
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  const composeNewMessage = async () => {
    if (!composeMessage.trim() || !composeRecipient) return

    try {
      // Mock compose functionality
      console.log('Composing message:', {
        recipient: composeRecipient,
        subject: composeSubject,
        message: composeMessage
      })

      setShowComposeModal(false)
      setComposeRecipient("")
      setComposeSubject("")
      setComposeMessage("")
      
      // Refresh messages after sending
      await fetchMessages()
    } catch (error) {
      console.error('Error composing message:', error)
    }
  }

  const markNotificationAsRead = async (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    )
  }

  const markAnnouncementAsRead = async (announcementId) => {
    setAnnouncements(prev => 
      prev.map(ann => 
        ann.id === announcementId ? { ...ann, read: true } : ann
      )
    )
  }

  const filteredConversations = conversations.filter(conv =>
    conv.adviser_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.last_message.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const unreadMessagesCount = conversations.reduce((total, conv) => total + conv.unread_count, 0)
  const unreadAnnouncementsCount = announcements.filter(a => !a.read).length
  const unreadNotificationsCount = notifications.filter(n => !n.read).length

  if (!currentUser) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg">
          Please log in to view your messages.
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-blue-600" />
              Messages & Communications
            </h1>
            <p className="text-gray-600">Stay connected with your advisers and receive important updates</p>
          </div>
          <Button 
            onClick={() => setShowComposeModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Compose Message
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Unread Messages</p>
                <p className="text-3xl font-bold text-gray-900">{unreadMessagesCount}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                <MessageSquare className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">New Announcements</p>
                <p className="text-3xl font-bold text-gray-900">{unreadAnnouncementsCount}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 text-green-600">
                <Bell className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Notifications</p>
                <p className="text-3xl font-bold text-gray-900">{unreadNotificationsCount}</p>
              </div>
              <div className="p-3 rounded-lg bg-orange-50 text-orange-600">
                <AlertCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-t-lg border-b">
        <div className="flex">
          <button
            onClick={() => setActiveTab("messages")}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "messages"
                ? "border-blue-500 text-blue-600 bg-blue-50"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <MessageSquare className="h-4 w-4 inline mr-2" />
            Messages
            {unreadMessagesCount > 0 && (
              <Badge className="ml-2 bg-red-500 text-white text-xs">
                {unreadMessagesCount}
              </Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab("announcements")}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "announcements"
                ? "border-blue-500 text-blue-600 bg-blue-50"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Bell className="h-4 w-4 inline mr-2" />
            Announcements
            {unreadAnnouncementsCount > 0 && (
              <Badge className="ml-2 bg-red-500 text-white text-xs">
                {unreadAnnouncementsCount}
              </Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "notifications"
                ? "border-blue-500 text-blue-600 bg-blue-50"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <AlertCircle className="h-4 w-4 inline mr-2" />
            Notifications
            {unreadNotificationsCount > 0 && (
              <Badge className="ml-2 bg-red-500 text-white text-xs">
                {unreadNotificationsCount}
              </Badge>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-b-lg shadow-sm border-t-0">
        {/* Messages Tab */}
        {activeTab === "messages" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 h-[600px]">
            {/* Conversations List */}
            <div className="border-r border-gray-200 p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="space-y-2 overflow-y-auto max-h-[500px]">
                {loading ? (
                  [1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse p-3 border rounded-lg">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                    </div>
                  ))
                ) : filteredConversations.length > 0 ? (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedConversation?.id === conversation.id
                          ? "bg-blue-50 border-blue-200"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 text-sm">
                          {conversation.adviser_name}
                        </h4>
                        {conversation.unread_count > 0 && (
                          <Badge className="bg-red-500 text-white text-xs">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-1">
                        {conversation.last_message}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(conversation.last_message_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No conversations found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Message View */}
            <div className="lg:col-span-2 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Conversation Header */}
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">
                      {selectedConversation.adviser_name}
                    </h3>
                    <p className="text-sm text-gray-600">Adviser</p>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 p-4 overflow-y-auto max-h-[400px]">
                    <div className="space-y-4">
                      {selectedConversation.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender === currentUser.uid ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.sender === currentUser.uid
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            <p className={`text-sm ${
                              message.sender === currentUser.uid
                                ? "text-white"
                                : "text-gray-900"
                            }`}>{message.message}</p>
                            <p
                              className={`text-xs mt-1 ${
                                message.sender === currentUser.uid
                                  ? "text-blue-100"
                                  : "text-gray-500"
                              }`}
                            >
                              {new Date(message.sent_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                        className="flex-1"
                      />
                      <Button 
                        onClick={sendMessage} 
                        disabled={!newMessage.trim() || sendingMessage}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {sendingMessage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p>Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === "announcements" && (
          <div className="p-6">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="animate-pulse mb-4 p-4 border rounded-lg">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))
            ) : announcements.length > 0 ? (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className={`p-4 border rounded-lg ${
                      !announcement.read ? "bg-blue-50 border-blue-200" : "bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">
                            {announcement.title}
                          </h4>
                          {!announcement.read && (
                            <Badge className="bg-blue-500 text-white text-xs">New</Badge>
                          )}
                          <Badge
                            className={
                              announcement.priority === "high"
                                ? "bg-red-100 text-red-800"
                                : announcement.priority === "medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                            }
                          >
                            {announcement.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {announcement.content}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>From: {announcement.created_by_name}</span>
                          <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {!announcement.read && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAnnouncementAsRead(announcement.id)}
                        >
                          Mark as Read
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements</h3>
                <p className="text-gray-600">You'll see important announcements here when they're posted</p>
              </div>
            )}
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="p-6">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="animate-pulse mb-4 p-4 border rounded-lg">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))
            ) : notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border rounded-lg ${
                      !notification.read ? "bg-orange-50 border-orange-200" : "bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <Badge className="bg-orange-500 text-white text-xs">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!notification.read && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markNotificationAsRead(notification.id)}
                          >
                            Mark as Read
                          </Button>
                        )}
                        {notification.action_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.href = notification.action_url}
                          >
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                <p className="text-gray-600">You'll see important notifications about your research here</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Compose Message Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Compose Message</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowComposeModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To (Adviser)
                  </label>
                  <select
                    value={composeRecipient}
                    onChange={(e) => setComposeRecipient(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select an adviser</option>
                    {advisers.map(adviser => (
                      <option key={adviser.id} value={adviser.id}>
                        {adviser.name} - {adviser.department}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <Input
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    placeholder="Enter subject..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={composeMessage}
                    onChange={(e) => setComposeMessage(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type your message..."
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowComposeModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={composeNewMessage}
                disabled={!composeMessage.trim() || !composeRecipient}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentMessages
