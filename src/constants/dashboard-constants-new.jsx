import { 
  BookOpen, 
  FileText, 
  Users, 
  UserPlus, 
  UserCheck, 
  Upload,
  Settings, 
  BarChart3, 
  Archive,
  Home,
  ChartColumn,
  NotepadText,
  Database,
  BookMarked,
  GraduationCap,
  User,
  TrendingUp,
  MessageSquare,
  FlaskConical,
  Presentation,
  Lightbulb,
  Users as UsersIcon
} from "lucide-react";

// Adviser navigation links
export const adviserNavbarLinks = [
  {
    title: "Dashboard",
    links: [
      {
        label: "Dashboard",
        icon: Home,
        path: "/adviser",
      },
    ],
  },
  {
    title: "Groups",
    links: [
      {
        label: "My Groups",
        icon: Users,
        path: "/adviser/mygroup",
      },
      {
        label: "Progress",
        icon: BarChart3,
        path: "/adviser/progress",
      },
    ],
  },
  {
    title: "Reports",
    links: [
      {
        label: "Reports",
        icon: FileText,
        path: "/adviser/reports",
      },
    ],
  },
  {
    title: "Settings",
    links: [
      {
        label: "Settings",
        icon: Settings,
        path: "/adviser/settings",
      },
    ],
  },
];

// Superadmin navigation links
export const superadminNavbarLinks = [
  {
    title: "Dashboard",
    links: [
      {
        label: "Dashboard",
        icon: Home,
        path: "/superadmin",
      },
    ],
  },
  {
    title: "User Management",
    links: [
      {
        label: "All Users",
        icon: Users,
        path: "/superadmin/users",
      },
      {
        label: "Groups",
        icon: UsersIcon,
        path: "/superadmin/groups",
      },
      {
        label: "Adviser Monitoring",
        icon: GraduationCap,
        path: "/superadmin/adviser-monitoring",
      },
    ],
  },
  {
    title: "Repository",
    links: [
      {
        label: "Repository",
        icon: Database,
        path: "/superadmin/repository",
      },
    ],
  },
  {
    title: "Settings",
    links: [
      {
        label: "Settings",
        icon: Settings,
        path: "/superadmin/settings",
      },
    ],
  },
];

// Admin navigation links
export const adminNavbarLinks = [
  {
    title: "Dashboard",
    links: [
      {
        label: "Dashboard",
        icon: Home,
        path: "/admin",
      },
    ],
  },
  {
    title: "Research Management",
    links: [
      {
        label: "Upload Project",
        icon: Upload,
        path: "/admin/upload",
      },
      {
        label: "Archive",
        icon: Archive,
        path: "/admin/archive",
      },
    ],
  },
  {
    title: "User Management",
    links: [
      {
        label: "All Users",
        icon: Users,
        path: "/admin/users",
      },
      {
        label: "Access Requests",
        icon: UserCheck,
        path: "/admin/access-requests",
      },
    ],
  },
  {
    title: "Announcements",
    links: [
      {
        label: "Announcements",
        icon: NotepadText,
        path: "/admin/announcements",
      },
    ],
  },
  {
    title: "Settings",
    links: [
      {
        label: "Settings",
        icon: Settings,
        path: "/admin/settings",
      },
    ],
  },
];

// Student navigation links
export const studentNavbarLinks = [
  {
    title: "Dashboard",
    links: [
      {
        label: "Dashboard",
        icon: Home,
        path: "/student",
      },
    ],
  },
  {
    title: "Research Library",
    links: [
      {
        label: "Browse Projects",
        icon: BookOpen,
        path: "/student/browse",
      },
      {
        label: "Bookmarks",
        icon: BookMarked,
        path: "/student/bookmarks",
      },
    ],
  },
  {
    title: "Academic",
    links: [
      {
        label: "Citation Tree",
        icon: Database,
        path: "/student/citations",
      },
      {
        label: "Research Guidelines",
        icon: BookOpen,
        path: "/student/guidelines",
      },
      {
        label: "Settings",
        icon: Settings,
        path: "/student/settings",
      },
    ],
  },
];

// Research proponent additional navigation links
export const researchProponentNavbarLinks = [
  {
    title: "Research Hub",
    links: [
      {
        label: "Research Hub",
        icon: FlaskConical,
        path: "/student/research",
      },
    ],
  },
];

// Function to get navigation links based on user status
export const getStudentNavbarLinks = (isResearchProponent = false) => {
  if (isResearchProponent) {
    return [...studentNavbarLinks, ...researchProponentNavbarLinks];
  }
  return studentNavbarLinks;
};

// Sample data for admin dashboard
export const researchOverviewData = [
  { name: "Jan", total: 45 },
  { name: "Feb", total: 52 },
  { name: "Mar", total: 38 },
  { name: "Apr", total: 67 },
  { name: "May", total: 49 },
  { name: "Jun", total: 78 },
  { name: "Jul", total: 56 },
  { name: "Aug", total: 84 },
  { name: "Sep", total: 72 },
  { name: "Oct", total: 91 },
  { name: "Nov", total: 67 },
  { name: "Dec", total: 88 },
];

export const recentSubmissions = [
  {
    id: 1,
    title: "AI-Powered Student Management System",
    author: "John Doe",
    email: "john.doe@omsc.edu.ph",
    submittedAt: "2025-08-15",
    status: "Under Review"
  },
  {
    id: 2,
    title: "Smart Campus Navigation App",
    author: "Jane Smith",
    email: "jane.smith@omsc.edu.ph",
    submittedAt: "2025-08-14",
    status: "Approved"
  },
  {
    id: 3,
    title: "Library Management System",
    author: "Mike Johnson",
    email: "mike.johnson@omsc.edu.ph",
    submittedAt: "2025-08-13",
    status: "Approved"
  },
  {
    id: 4,
    title: "Online Learning Platform",
    author: "Sarah Wilson",
    email: "sarah.wilson@omsc.edu.ph",
    submittedAt: "2025-08-12",
    status: "Under Review"
  },
  {
    id: 5,
    title: "IoT Weather Monitoring System",
    author: "David Brown",
    email: "david.brown@omsc.edu.ph",
    submittedAt: "2025-08-11",
    status: "Approved"
  },
];

export const topResearchProjects = [
  {
    id: 1,
    title: "Machine Learning in Healthcare",
    author: "Alice Johnson",
    year: "2024",
    downloads: 1250,
    views: 3450,
    category: "Artificial Intelligence",
    rating: 4.8,
    status: "Published"
  },
  {
    id: 2,
    title: "Blockchain-based Voting System",
    author: "Bob Smith",
    year: "2024",
    downloads: 980,
    views: 2890,
    category: "Cybersecurity",
    rating: 4.7,
    status: "Published"
  },
  {
    id: 3,
    title: "Smart Agriculture Monitoring",
    author: "Carol Davis",
    year: "2023",
    downloads: 876,
    views: 2345,
    category: "IoT",
    rating: 4.6,
    status: "Published"
  },
  {
    id: 4,
    title: "Mobile Learning Application",
    author: "David Wilson",
    year: "2024",
    downloads: 745,
    views: 1987,
    category: "Education Technology",
    rating: 4.5,
    status: "Published"
  },
  {
    id: 5,
    title: "E-commerce Recommendation Engine",
    author: "Emma Thompson",
    year: "2023",
    downloads: 632,
    views: 1756,
    category: "Data Science",
    rating: 4.4,
    status: "Published"
  },
];

// Student dashboard data
export const studentOverviewData = [
  { name: "Jan", bookmarks: 12, downloads: 8 },
  { name: "Feb", bookmarks: 15, downloads: 11 },
  { name: "Mar", bookmarks: 9, downloads: 6 },
  { name: "Apr", bookmarks: 18, downloads: 14 },
  { name: "May", bookmarks: 22, downloads: 17 },
  { name: "Jun", bookmarks: 25, downloads: 19 },
];

export const recentBookmarks = [
  {
    id: 1,
    title: "Deep Learning Fundamentals",
    author: "Dr. Smith",
    bookmarkedAt: "2025-08-15",
    category: "AI/ML"
  },
  {
    id: 2,
    title: "Web Development Best Practices",
    author: "Prof. Johnson",
    bookmarkedAt: "2025-08-14",
    category: "Web Development"
  },
  {
    id: 3,
    title: "Database Design Principles",
    author: "Dr. Brown",
    bookmarkedAt: "2025-08-13",
    category: "Database"
  },
];

export const recommendedProjects = [
  {
    id: 1,
    title: "React Native Mobile App Development",
    author: "Sarah Wilson",
    category: "Mobile Development",
    rating: 4.7,
    views: 1234
  },
  {
    id: 2,
    title: "Cloud Computing Architecture",
    author: "Mike Davis",
    category: "Cloud Computing",
    rating: 4.6,
    views: 987
  },
  {
    id: 3,
    title: "Cybersecurity Framework Implementation",
    author: "Lisa Anderson",
    category: "Cybersecurity",
    rating: 4.8,
    views: 1567
  },
];
