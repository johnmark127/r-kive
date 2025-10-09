import { useEffect, useState } from "react"
import { exportAdminDashboardReport } from "@/utils/exportAdminDashboardReport"
import { supabase } from "@/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Users, Upload, Eye, Settings, UserCheck, FolderOpen, TrendingUp } from "lucide-react"
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const AdminDashboard = () => {
  const [researchPapersCount, setResearchPapersCount] = useState(0)
  const [totalViews, setTotalViews] = useState(0)
  const [studentsCount, setStudentsCount] = useState(0)
  const [pendingApprovals, setPendingApprovals] = useState(0)
  // Add additional states for other cards if needed

  useEffect(() => {
    const fetchStats = async () => {
      // Fetch total research papers count
      const { count, error } = await supabase
        .from('research_papers')
        .select('*', { count: 'exact', head: true })
      if (!error) setResearchPapersCount(count || 0)

      // Fetch total unique paper views from paper_views_log
      const { count: uniqueViewsCount, error: viewsError } = await supabase
        .from('paper_views_log')
        .select('paper_id,user_id', { count: 'exact', head: true })
      if (!viewsError) {
        setTotalViews(uniqueViewsCount || 0)
      }

      // Fetch registered students count
      const { count: studentCount, error: studentError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student')
      if (!studentError) setStudentsCount(studentCount || 0)

      // Fetch pending approvals (pending access requests)
      const { count: pendingCount, error: pendingError } = await supabase
        .from('research_paper_access_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
      if (!pendingError) setPendingApprovals(pendingCount || 0)
    }
    fetchStats()
  }, [])

  const stats = [
    {
      title: "Research Papers",
      value: researchPapersCount.toLocaleString(),
      icon: FileText,
      change: "+0%", // Optional: Calculate % change if needed
      changeType: "neutral",
    },
    {
      title: "Registered Students",
      value: studentsCount.toLocaleString(),
      icon: Users,
      change: "+0%",
      changeType: "neutral",
    },
    {
      title: "Total Paper Views",
      value: totalViews.toLocaleString(),
      icon: Eye,
      change: "+0%",
      changeType: "neutral",
    },
    {
      title: "Pending Approvals",
      value: pendingApprovals.toLocaleString(),
      icon: UserCheck,
      change: "+0%",
      changeType: "neutral",
    },
  ]

  // Realtime activities state
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    const fetchActivities = async () => {
      const { data } = await supabase
        .from("activities")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(10);
      setRecentActivities(data || []);
    };
    fetchActivities();

    const channel = supabase
      .channel("public:activities")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activities" },
        () => {
          fetchActivities();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Analytics graph state
  const [viewRange, setViewRange] = useState(7)
  const [analyticsData, setAnalyticsData] = useState([])
  const [analytics7, setAnalytics7] = useState([])
  const [analytics30, setAnalytics30] = useState([])
  const [analytics180, setAnalytics180] = useState([])

  // Fetch analytics for all three ranges for report export
  useEffect(() => {
    const fetchAnalytics = async (range, setter) => {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - (range - 1));
      const { data, error } = await supabase
        .from('paper_views_log')
        .select('viewed_at')
        .gte('viewed_at', fromDate.toISOString());
      if (!error && data) {
        if (range === 30) {
          // Group by week (4 weeks for 1 month)
          const today = new Date();
          const weekRanges = [];
          for (let i = 0; i < 4; i++) {
            const start = new Date(today);
            start.setDate(today.getDate() - (29 - i * 7));
            const end = new Date(today);
            end.setDate(today.getDate() - (29 - (i + 1) * 7) + 6);
            if (end > today) end.setTime(today.getTime());
            weekRanges.push({
              label: `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
              start,
              end,
              views: 0
            });
          }
          data.forEach(v => {
            const viewed = new Date(v.viewed_at);
            for (let i = 0; i < weekRanges.length; i++) {
              if (viewed >= weekRanges[i].start && viewed <= weekRanges[i].end) {
                weekRanges[i].views++;
                break;
              }
            }
          });
          setter(weekRanges.map(w => ({ week: w.label, views: w.views })));
        } else if (range === 180) {
          // Group by month (6 months)
          const months = [];
          const today = new Date();
          for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            months.push({
              month: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
              year: d.getFullYear(),
              monthNum: d.getMonth(),
              views: 0
            });
          }
          data.forEach(v => {
            const viewed = new Date(v.viewed_at);
            const idx = months.findIndex(m => viewed.getFullYear() === m.year && viewed.getMonth() === m.monthNum);
            if (idx !== -1) months[idx].views++;
          });
          setter(months);
        } else {
          // Group by day (7 days)
          const days = [];
          for (let i = 0; i < range; i++) {
            const d = new Date();
            d.setDate(d.getDate() - (range - 1 - i));
            days.push({
              day: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              date: d.toISOString().slice(0, 10),
              views: 0
            });
          }
          data.forEach(v => {
            const dateStr = v.viewed_at.slice(0, 10);
            const idx = days.findIndex(d => d.date === dateStr);
            if (idx !== -1) days[idx].views++;
          });
          setter(days);
        }
      }
    };
    fetchAnalytics(7, setAnalytics7);
    fetchAnalytics(30, setAnalytics30);
    fetchAnalytics(180, setAnalytics180);
  }, []);

  // Keep the current analyticsData for the chart
  useEffect(() => {
    if (viewRange === 7) setAnalyticsData(analytics7);
    else if (viewRange === 30) setAnalyticsData(analytics30);
    else if (viewRange === 180) setAnalyticsData(analytics180);
  }, [viewRange, analytics7, analytics30, analytics180]);

  const [mostViewedPapers, setMostViewedPapers] = useState([])

  useEffect(() => {
    // Fetch most viewed papers by unique student views from paper_views_log
    const fetchMostViewedPapers = async () => {
      // Get counts of unique user_id per paper_id
      const { data, error } = await supabase
        .from('paper_views_log')
        .select('paper_id, user_id')
      if (!error && data) {
        // Count unique user_id per paper_id
        const viewMap = {};
        data.forEach(row => {
          if (!viewMap[row.paper_id]) viewMap[row.paper_id] = new Set();
          viewMap[row.paper_id].add(row.user_id);
        });
        // Convert to array and sort by count desc
        const sorted = Object.entries(viewMap)
          .map(([paper_id, userSet]) => ({ paper_id, uniqueViews: userSet.size }))
          .sort((a, b) => b.uniqueViews - a.uniqueViews)
          .slice(0, 5);
        // Fetch paper details for top 5
        if (sorted.length > 0) {
          const ids = sorted.map(x => x.paper_id);
          const { data: papers } = await supabase
            .from('research_papers')
            .select('id, title, authors')
            .in('id', ids);
          // Merge view counts into paper objects
          const papersWithViews = papers.map(paper => ({
            ...paper,
            uniqueViews: sorted.find(x => x.paper_id == paper.id)?.uniqueViews || 0
          }));
          // Sort again to ensure order
          papersWithViews.sort((a, b) => b.uniqueViews - a.uniqueViews);
          setMostViewedPapers(papersWithViews);
        } else {
          setMostViewedPapers([]);
        }
      }
    };
    fetchMostViewedPapers();
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { variant: "default", className: "bg-green-100 text-green-800 hover:bg-green-100" },
      pending: { variant: "secondary", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
      under_review: { variant: "outline", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
    }

    return statusConfig[status] || statusConfig.pending
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back, Admin 👋</h1>
            <p className="text-gray-600">Here's an overview of today's activity</p>
          </div>
          <Button
            className="ml-4 px-5 py-2 rounded-lg border border-blue-600 text-blue-600 bg-transparent shadow-sm hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            onClick={() => exportAdminDashboardReport({
              stats,
              mostViewedPapers,
              recentActivities,
              analytics7,
              analytics30,
              analytics180
            })}
          >
            Generate Report
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          // Make Research Papers, Registered Students, and Pending Approvals cards clickable
          const isResearchPapers = stat.title === "Research Papers";
          const isRegisteredStudents = stat.title === "Registered Students";
          const isPendingApprovals = stat.title === "Pending Approvals";
          const cardContent = (
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
                    {stat.change} from last month
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          );
          if (isResearchPapers) {
            return (
              <Card key={index} className="hover:shadow-md transition-shadow duration-200 cursor-pointer">
                <Link to="/admin/archive" style={{ display: 'block', height: '100%' }}>
                  {cardContent}
                </Link>
              </Card>
            );
          } else if (isRegisteredStudents) {
            return (
              <Card key={index} className="hover:shadow-md transition-shadow duration-200 cursor-pointer">
                <Link to="/admin/users" style={{ display: 'block', height: '100%' }}>
                  {cardContent}
                </Link>
              </Card>
            );
          } else if (isPendingApprovals) {
            return (
              <Card key={index} className="hover:shadow-md transition-shadow duration-200 cursor-pointer">
                <Link to="/admin/access-requests" style={{ display: 'block', height: '100%' }}>
                  {cardContent}
                </Link>
              </Card>
            );
          } else {
            return (
              <Card key={index} className="hover:shadow-md transition-shadow duration-200">
                {cardContent}
              </Card>
            );
          }
        })}
      </div>

      {/* Analytics Trend Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Paper Views</CardTitle>
            <select
              className="ml-4 px-3 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={viewRange}
              onChange={e => setViewRange(Number(e.target.value))}
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 1 Month</option>
              <option value={180}>Last 6 Months</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey={viewRange === 30 ? 'week' : viewRange === 180 ? 'month' : 'day'}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button asChild className="h-12 justify-start bg-transparent" variant="outline">
              <Link to="/admin/upload">
                <Upload className="w-4 h-4 mr-2" />
                Upload Project
              </Link>
            </Button>
            <Button asChild className="h-12 justify-start bg-transparent" variant="outline">
              <Link to="/admin/users">
                <Users className="w-4 h-4 mr-2" />
                Manage Users
              </Link>
            </Button>
            <Button asChild className="h-12 justify-start bg-transparent" variant="outline">
              <Link to="/admin/archive">
                <FolderOpen className="w-4 h-4 mr-2" />
                View Archive
              </Link>
            </Button>
            <Button asChild className="h-12 justify-start bg-transparent" variant="outline">
              <Link to="/admin/settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Most Viewed Papers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Most Viewed Papers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Paper Title</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Authors</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Views</th>
                </tr>
              </thead>
              <tbody>
                {mostViewedPapers.map((paper, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900 max-w-xs truncate">{paper.title}</div>
                    </td>
                    <td className="py-4 px-4 text-gray-600 max-w-xs truncate">{paper.authors}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="font-medium text-gray-900">{paper.uniqueViews?.toLocaleString?.() ?? 0}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Table (Realtime) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-4 px-4 text-gray-500 text-center">No recent activity.</td>
                  </tr>
                )}
                  {recentActivities.slice(0, 5).map((activity) => (
                  <tr key={activity.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className={
                      `py-4 px-4 font-medium ${activity.type === 'delete' ? 'text-red-600' : 'text-blue-700'}`
                    }>
                      {activity.type}
                    </td>
                    <td className="py-4 px-4 text-gray-700">
                      {activity.type === 'upload' && (
                        <span><span className="font-medium">{activity.description}</span></span>
                      )}
                      {activity.type === 'delete' && (
                        <span><span className="font-medium">{activity.description}</span></span>
                      )}
                      {/* Add more types as needed */}
                      {activity.type !== 'upload' && activity.type !== 'delete' && (
                        <span>{activity.description}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-gray-500 text-xs">{new Date(activity.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminDashboard
