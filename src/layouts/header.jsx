import { Menu, Moon, Sun, LogOut, User, Bell, ChevronDown } from "lucide-react";
import { useTheme } from "../contexts/theme-context";
import { cn } from "../utils/cn";
import { useState, useRef, useEffect } from "react";

export const Header = ({ collapsed, setCollapsed }) => {
    const { theme, setTheme } = useTheme();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);

    const handleLogout = () => {
        // Clear user data from localStorage
        localStorage.removeItem('user');
        // Redirect to home page
        window.location.href = '/';
    };

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Get user display name (first name or email)
    const getUserDisplayName = () => {
        if (currentUser.displayName) return currentUser.displayName;
        if (currentUser.email) {
            return currentUser.email.split('@')[0];
        }
        return 'User';
    };

    return (
        <header className="flex h-[60px] items-center justify-between border-b border-slate-300 bg-white px-3 sm:px-6 transition-colors dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <Menu size={20} />
                </button>
                
                {/* Mobile: Show app title when sidebar is collapsed */}
                <div className="ml-3 md:hidden">
                    <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                        R-kive
                    </h1>
                </div>
            </div>
            
            <div className="flex items-center gap-x-1 sm:gap-x-3">
                {/* Theme Toggle - Hidden on very small screens */}
                <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="hidden xs:inline-flex rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
                    title="Toggle theme"
                >
                    {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                {/* Notification Bell */}
                <button
                    className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50 relative"
                    title="Notifications"
                >
                    <Bell size={18} />
                    {/* Notification dot */}
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* User Menu - Mobile Optimized */}
                <div className="relative" ref={userMenuRef}>
                    <button
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="flex items-center gap-x-1 sm:gap-x-2 rounded-lg bg-slate-100 px-2 sm:px-3 py-2 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
                    >
                        <div className="flex items-center gap-x-1 sm:gap-x-2">
                            {/* Avatar or User Icon */}
                            <div className="w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center">
                                <User size={14} className="text-slate-600 dark:text-slate-400" />
                            </div>
                            
                            {/* User Name - Hidden on mobile */}
                            <span className="hidden sm:inline text-sm font-medium text-slate-900 dark:text-slate-50 max-w-[120px] truncate">
                                {getUserDisplayName()}
                            </span>
                            
                            {/* Role Badge - Hidden on small screens */}
                            <span className={cn(
                                "hidden md:inline rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
                                currentUser.role === 'admin' 
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                    : currentUser.role === 'superadmin'
                                    ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                    : currentUser.role === 'adviser'
                                    ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                                    : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            )}>
                                {currentUser.role || 'Student'}
                            </span>
                        </div>
                        
                        <ChevronDown size={14} className={cn(
                            "text-slate-500 transition-transform duration-200",
                            isUserMenuOpen && "rotate-180"
                        )} />
                    </button>

                    {/* Dropdown Menu */}
                    {isUserMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-slate-200 bg-white py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800 z-50">
                            <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">
                                    {getUserDisplayName()}
                                </p>
                                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                                    {currentUser.email || 'No email'}
                                </p>
                                <span className={cn(
                                    "inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-medium",
                                    currentUser.role === 'admin' 
                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                        : currentUser.role === 'superadmin'
                                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                        : currentUser.role === 'adviser'
                                        ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                                        : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                )}>
                                    {currentUser.role || 'Student'}
                                </span>
                            </div>
                            
                            {/* Theme toggle in mobile menu */}
                            <button
                                onClick={() => {
                                    setTheme(theme === "dark" ? "light" : "dark");
                                    setIsUserMenuOpen(false);
                                }}
                                className="xs:hidden w-full flex items-center gap-x-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                                {theme === "dark" ? "Light Mode" : "Dark Mode"}
                            </button>
                            
                            <button
                                onClick={() => {
                                    handleLogout();
                                    setIsUserMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                            >
                                <LogOut size={16} />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
