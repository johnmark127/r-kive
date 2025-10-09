import React from "react"
import Index from "./pages/index"
import About from "./pages/about"
import DashboardLayout from "./layouts/DashboardLayout"
import AdminDashboard from "./pages/dashboard/admin/AdminDashboard"
// import Analytics from "./pages/dashboard/admin/Analytics"
import Reports from "./pages/dashboard/admin/Reports"
import Projects from "./pages/dashboard/admin/Projects"
import Upload from "./pages/dashboard/admin/Upload"
import Citations from "./pages/dashboard/admin/Citations"
import ManualCitations from "./pages/dashboard/admin/ManualCitations"
import CitationDebug from "./pages/dashboard/admin/CitationDebug"
import RetryExtraction from "./pages/dashboard/admin/RetryExtraction"
import Archive from "./pages/dashboard/admin/Archive"
import Users from "./pages/dashboard/admin/Users"
import AddUser from "./pages/dashboard/admin/AddUser"
import VerifiedUsers from "./pages/dashboard/admin/VerifiedUsers"
import Settings from "./pages/dashboard/admin/Settings"
import AnnouncementPage from "./pages/dashboard/admin/Announcement"
import AccessRequestPage from "./pages/dashboard/admin/AccessRequest"
import StudentDashboard from "./pages/dashboard/student/StudentDashboard"
import Bookmarks from "./pages/dashboard/student/bookmarks"
import Browse from "./pages/dashboard/student/browse"
import CitationTree from "./pages/dashboard/student/citationtree"
import Guidelines from "./pages/dashboard/student/guidelines"
import StudentSettings from "./pages/dashboard/student/studentsettings"
import StudentMessages from "./pages/dashboard/student/messages"
// Research Hub - consolidated research management
import ResearchHub from "./pages/dashboard/student/research/MyProjects"
// Superadmin pages
import SDashboard from "./pages/dashboard/superadmin/sdashboard";
import SUser from "./pages/dashboard/superadmin/sUser";
import SSettings from "./pages/dashboard/superadmin/sSettings";
import SGroup from "./pages/dashboard/superadmin/s.group";
import Repository from "./pages/dashboard/superadmin/Repository";
import AdviserMonitoring from "./pages/dashboard/superadmin/AdviserMonitoring";

// Adviser pages
import AdviserDashboard from "./pages/dashboard/adviser/adviserDashboard";
import AdviserProgress from "./pages/dashboard/adviser/progress";
import AdviserReports from "./pages/dashboard/adviser/reports";
import AdviserSettings from "./pages/dashboard/adviser/settings";
import AdviserResearchProposals from "./pages/dashboard/adviser/ResearchProposals";

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from "./contexts/theme-context"
import './dashboard.css'

function App() {
    return (
        <ThemeProvider storageKey="r-kive-theme">
            <BrowserRouter>
                <Routes>
                    {/* Public Routes */}
                    <Route path='/' element={<Index/>}/>
                    <Route path='/about' element={<About/>}/>
                    
                    {/* Dashboard Routes */}
                    <Route path="/admin" element={<DashboardLayout />}>
                        <Route index element={<AdminDashboard />} />
                        {/* <Route path="analytics" element={<Analytics />} /> */}
                        <Route path="reports" element={<Reports />} />
                        <Route path="projects" element={<Projects />} />
                        <Route path="upload" element={<Upload />} />
                        <Route path="citations" element={<Citations />} />
                        <Route path="manual-citations" element={<ManualCitations />} />
                        <Route path="citation-debug" element={<CitationDebug />} />
                        <Route path="retry-extraction" element={<RetryExtraction />} />
                        <Route path="archive" element={<Archive />} />
                        <Route path="users" element={<Users />} />
                        <Route path="add-user" element={<AddUser />} />
                        <Route path="verified-users" element={<VerifiedUsers />} />
                        <Route path="settings" element={<Settings />} />
                        <Route path="announcements" element={<AnnouncementPage />} />
                        <Route path="access-requests" element={<AccessRequestPage />} />
                    </Route>
                    
                    <Route path="/student" element={<DashboardLayout />}>
                        <Route index element={<StudentDashboard />} />
                        <Route path="bookmarks" element={<Bookmarks />} />
                        <Route path="browse" element={<Browse />} />
                        <Route path="citations" element={<CitationTree />} />
                        <Route path="guidelines" element={<Guidelines />} />
                        <Route path="messages" element={<StudentMessages />} />
                        <Route path="settings" element={<StudentSettings />} />
                        {/* Research Hub - All research functionality in one place */}
                        <Route path="research" element={<ResearchHub />} />
                        <Route path="research/projects" element={<ResearchHub />} />
                        <Route path="research/proposals" element={<ResearchHub />} />
                        <Route path="research/reports" element={<ResearchHub />} />
                        <Route path="research/submit" element={<ResearchHub />} />
                    </Route>
                    {/* Superadmin Dashboard Routes */}
                    <Route path="/superadmin" element={<DashboardLayout />}>
                        <Route index element={<SDashboard />} />
                        <Route path="users" element={<SUser />} />
                        <Route path="settings" element={<SSettings />} />
                        <Route path="groups" element={<SGroup />} />
                        <Route path="repository" element={<Repository />} />
                        <Route path="adviser-monitoring" element={<AdviserMonitoring />} />
                    </Route>
                    {/* Adviser Dashboard Routes */}
                    <Route path="/adviser" element={<DashboardLayout />}>
                        <Route index element={<AdviserDashboard />} />
                        <Route path="proposals" element={<AdviserResearchProposals />} />
                        <Route path="progress" element={<AdviserProgress />} />
                        <Route path="reports" element={<AdviserReports />} />
                        <Route path="settings" element={<AdviserSettings />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    )
}

export default App