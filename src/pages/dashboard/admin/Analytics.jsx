import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Eye, Download, Calendar, Clock } from "lucide-react"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  AreaChart,
  Area,
} from "recharts"

const AnalyticsPage = () => {
  // Overview stats
  const overviewStats = [
    {
      title: "Total Page Views",
      value: "45,231",
      icon: Eye,
      change: "+12.5%",
      changeType: "positive",
      period: "vs last month",
    },
    {
      title: "Active Users",
      value: "2,847",
      icon: Users,
      change: "+8.2%",
      changeType: "positive",
      period: "vs last month",
    },
    {
      title: "Papers Downloaded",
      value: "1,429",
      icon: Download,
      change: "+23.1%",
      changeType: "positive",
      period: "vs last month",
    },
    {
      title: "Avg. Session Duration",
      value: "4m 32s",
      icon: Clock,
      change: "-2.3%",
      changeType: "negative",
      period: "vs last month",
    },
  ]

  // Traffic data for the last 30 days
  const trafficData = [
    { date: "Jan 1", views: 1200, users: 450, downloads: 89 },
    { date: "Jan 2", views: 1350, users: 520, downloads: 95 },
    { date: "Jan 3", views: 1180, users: 480, downloads: 78 },
    { date: "Jan 4", views: 1420, users: 580, downloads: 112 },
    { date: "Jan 5", views: 1680, users: 650, downloads: 134 },
    { date: "Jan 6", views: 1520, users: 590, downloads: 98 },
    { date: "Jan 7", views: 1380, users: 540, downloads: 87 },
    { date: "Jan 8", views: 1750, users: 720, downloads: 156 },
    { date: "Jan 9", views: 1620, users: 680, downloads: 143 },
    { date: "Jan 10", views: 1480, users: 610, downloads: 121 },
    { date: "Jan 11", views: 1890, users: 780, downloads: 167 },
    { date: "Jan 12", views: 1720, users: 690, downloads: 145 },
    { date: "Jan 13", views: 1580, users: 640, downloads: 128 },
    { date: "Jan 14", views: 1920, users: 820, downloads: 189 },
  ]

  // User activity by hour
  const hourlyActivity = [
    { hour: "00", users: 45 },
    { hour: "01", users: 32 },
    { hour: "02", users: 28 },
    { hour: "03", users: 25 },
    { hour: "04", users: 30 },
    { hour: "05", users: 42 },
    { hour: "06", users: 68 },
    { hour: "07", users: 95 },
    { hour: "08", users: 145 },
    { hour: "09", users: 180 },
    { hour: "10", users: 220 },
    { hour: "11", users: 195 },
    { hour: "12", users: 165 },
    { hour: "13", users: 185 },
    { hour: "14", users: 210 },
    { hour: "15", users: 235 },
    { hour: "16", users: 198 },
    { hour: "17", users: 156 },
    { hour: "18", users: 132 },
    { hour: "19", users: 108 },
    { hour: "20", users: 89 },
    { hour: "21", users: 76 },
    { hour: "22", users: 65 },
    { hour: "23", users: 52 },
  ]

  // Device breakdown
  const deviceData = [
    { name: "Desktop", value: 1847, color: "#3b82f6" },
    { name: "Mobile", value: 892, color: "#10b981" },
    { name: "Tablet", value: 108, color: "#f59e0b" },
  ]

  // Top research categories
  const categoryData = [
    { category: "Computer Science", papers: 89, views: 12450 },
    { category: "Engineering", papers: 67, views: 9870 },
    { category: "Medicine", papers: 45, views: 8920 },
    { category: "Physics", papers: 34, views: 6780 },
    { category: "Biology", papers: 28, views: 5640 },
    { category: "Chemistry", papers: 23, views: 4560 },
  ]

  // Recent system events
  const systemEvents = [
    {
      event: "Database backup completed",
      time: "2 hours ago",
      type: "success",
      details: "Automated daily backup successful",
    },
    {
      event: "High traffic detected",
      time: "4 hours ago",
      type: "warning",
      details: "Traffic spike of 150% above normal",
    },
    {
      event: "New user registration peak",
      time: "6 hours ago",
      type: "info",
      details: "45 new registrations in the last hour",
    },
    {
      event: "Server maintenance scheduled",
      time: "1 day ago",
      type: "info",
      details: "Maintenance window: Jan 20, 2:00 AM - 4:00 AM",
    },
  ]

  const getEventBadge = (type) => {
    const config = {
      success: { className: "bg-green-100 text-green-800" },
      warning: { className: "bg-yellow-100 text-yellow-800" },
      info: { className: "bg-blue-100 text-blue-800" },
      error: { className: "bg-red-100 text-red-800" },
    }
    return config[type] || config.info
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Analytics Dashboard</h1>
            <p className="text-gray-600">Comprehensive insights into your platform's performance</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Date Range
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p
                      className={`text-sm mt-1 ${
                        stat.changeType === "positive"
                          ? "text-green-600"
                          : stat.changeType === "negative"
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {stat.change} {stat.period}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Traffic Overview Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Traffic Overview (Last 14 Days)</CardTitle>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-gray-600">Page Views</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-gray-600">Users</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                <span className="text-gray-600">Downloads</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Area type="monotone" dataKey="views" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                <Area type="monotone" dataKey="users" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                <Area
                  type="monotone"
                  dataKey="downloads"
                  stackId="3"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">User Activity by Hour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Device Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center">
              <div className="w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <RechartsPieChart data={deviceData} cx="50%" cy="50%" innerRadius={40} outerRadius={80}>
                      {deviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </RechartsPieChart>
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-4">
                {deviceData.map((device, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: device.color }}></div>
                      <span className="text-sm text-gray-600">{device.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{device.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Research Categories Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Research Categories Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Papers</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Total Views</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Avg. Views per Paper</th>
                </tr>
              </thead>
              <tbody>
                {categoryData.map((category, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900">{category.category}</div>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{category.papers}</td>
                    <td className="py-4 px-4 text-gray-600">{category.views.toLocaleString()}</td>
                    <td className="py-4 px-4 text-gray-600">
                      {Math.round(category.views / category.papers).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* System Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent System Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemEvents.map((event, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{event.event}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge className={getEventBadge(event.type).className}>{event.type}</Badge>
                      <span className="text-sm text-gray-500">{event.time}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{event.details}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AnalyticsPage
