"use client"

import { forwardRef, useState, useEffect, useMemo } from "react"
import { NavLink } from "react-router-dom"
import { adminNavbarLinks, studentNavbarLinks, superadminNavbarLinks, adviserNavbarLinks, getStudentNavbarLinks } from "../constants/dashboard-constants"
import logoLight from "../assets/logo-light.svg"
import logoDark from "../assets/logo-dark.svg"
import { cn } from "../utils/cn"
import { Search, X, Command } from "lucide-react"



export const Sidebar = forwardRef(({ collapsed, onMenuItemClick }, ref) => {
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}")
  const isAdmin = currentUser.role === "admin"
  const isSuperadmin = currentUser.role === "superadmin"
  const isAdviser = currentUser.role === "adviser"
  const isStudent = currentUser.role === "student"
  const isResearchProponent = currentUser.is_research_proponent || false
  
  // Memoize navbarLinks to prevent infinite re-renders
  const navbarLinks = useMemo(() => {
    if (isSuperadmin) {
      return superadminNavbarLinks
    } else if (isAdmin) {
      return adminNavbarLinks
    } else if (isAdviser) {
      return adviserNavbarLinks
    } else if (isStudent) {
      return getStudentNavbarLinks(isResearchProponent)
    }
    return studentNavbarLinks
  }, [isSuperadmin, isAdmin, isAdviser, isStudent, isResearchProponent])

  const [searchQuery, setSearchQuery] = useState("")
  const [filteredLinks, setFilteredLinks] = useState(navbarLinks)

  // Sidebar expanded if not collapsed
  const isSidebarExpanded = !collapsed;

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLinks(navbarLinks)
      return
    }
    const filtered = navbarLinks
      .map((group) => ({
        ...group,
        links: group.links.filter((link) => link.label.toLowerCase().includes(searchQuery.toLowerCase())),
      }))
      .filter((group) => group.links.length > 0)
    setFilteredLinks(filtered)
  }, [searchQuery, navbarLinks])

  const getNotificationCount = (path) => {
    const notifications = {
      "/access-requests": 12,
      "/users": 3,
      "/announcements": 5,
    }
    return notifications[path] || 0
  }

  return (
    <aside
      ref={ref}
      className={cn(
        "fixed z-[100] flex h-full flex-col overflow-x-hidden border-r border-gray-200 bg-white shadow-sm transition-all duration-300",
        isSidebarExpanded ? "w-[240px] md:w-[240px]" : "w-[70px] md:w-[70px] md:items-center",
        !isSidebarExpanded ? "max-md:-left-full" : "max-md:left-0",
      )}
    >
      <div className={cn("p-6 border-b border-gray-200", isSidebarExpanded ? "flex items-center gap-x-3" : "justify-center")}> 
        <img
          src={logoLight || "/placeholder.svg"}
          alt="R-kive Logo"
          className={cn(isSidebarExpanded ? "w-10 h-10" : "w-[22px] h-[22px] mx-auto", "dark:hidden")}
        />
        <img
          src={logoDark || "/placeholder.svg"}
          alt="R-kive Logo"
          className={cn(isSidebarExpanded ? "w-10 h-10" : "w-[22px] h-[22px] mx-auto", "hidden dark:block")}
        />
        {isSidebarExpanded && (
          <div>
            <p className="text-lg font-bold text-gray-900">R-kive</p>
            <p className="text-sm text-gray-600 font-medium">
              {isSuperadmin ? "Superadmin Panel" : 
               isAdmin ? "Admin Panel" : 
               isAdviser ? "Adviser Panel" :
               isResearchProponent ? "Research Portal" : "Student Portal"}
            </p>
          </div>
        )}
      </div>

      <div className="h-px w-full bg-gray-200 mb-2" />

      {isSidebarExpanded && (
        <div className="px-6 pb-4">
        </div>
      )}

      <div className="flex w-full flex-col gap-y-6 overflow-y-auto overflow-x-hidden px-4 pb-4 hide-scrollbar">
        {filteredLinks.map((navbarLink) => (
          <nav key={navbarLink.title} className={cn("sidebar-group", !isSidebarExpanded && "md:items-center")}> 
            {isSidebarExpanded && (
              <p
                className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-3 px-2"
              >
                {navbarLink.title}
              </p>
            )}
            <div className="space-y-1">
              {navbarLink.links.map((link) => {
                const notificationCount = getNotificationCount(link.path)
                // Use 'end' prop for dashboard root links to avoid partial matching
                const isDashboardRoot = link.path === "/admin" || link.path === "/student" || link.path === "/superadmin" || link.path === "/adviser";
                return (
                  <NavLink
                    key={link.label}
                    to={link.path}
                    onClick={() => onMenuItemClick && onMenuItemClick()}
                    {...(isDashboardRoot ? { end: true } : {})}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 relative group",
                        !isSidebarExpanded && "md:w-[45px] md:justify-center px-2 py-2.5",
                        isActive && "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm font-medium",
                      )
                    }
                    title={!isSidebarExpanded ? link.label : ""}
                  >
                    {({ isActive }) => (
                      <>
                        <link.icon size={20} className={cn("flex-shrink-0", isActive && "text-blue-700")} />
                        {isSidebarExpanded && (
                          <p
                            className={cn(
                              "whitespace-nowrap font-medium text-sm transition-colors flex-1",
                              isActive ? "text-blue-700" : "text-gray-700",
                            )}
                          >
                            {link.label}
                          </p>
                        )}
                        {notificationCount > 0 && (
                          <span
                            className={cn(
                              "flex items-center justify-center min-w-[20px] h-5 text-xs font-bold rounded-full",
                              !isSidebarExpanded ? "absolute -top-1 -right-1" : "",
                              isActive ? "bg-blue-600 text-white" : "bg-red-500 text-white",
                            )}
                          >
                            {notificationCount > 99 ? "99+" : notificationCount}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </nav>
        ))}

        {searchQuery && filteredLinks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No pages found</p>
            <p className="text-xs">Try a different search term</p>
          </div>
        )}
      </div>
    </aside>
  )
})

Sidebar.displayName = "Sidebar"
