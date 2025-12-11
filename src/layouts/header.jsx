import { Menu, Moon, Sun, LogOut, User, Bell, ChevronDown } from "lucide-react";
import { useTheme } from "../contexts/theme-context";
import { cn } from "../utils/cn";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/supabase/client";
import { useNavigate } from "react-router-dom";

export const Header = ({ collapsed, setCollapsed }) => {
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const userMenuRef = useRef(null);
    const notificationRef = useRef(null);

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
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationOpen(false);
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

    // Fetch notifications for the logged-in user from Supabase
    const [notifications, setNotifications] = useState([]);
    const [loadingNotifications, setLoadingNotifications] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            setLoadingNotifications(true);
            
            // Get user ID from localStorage
            const localUser = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = localUser.uid;
            
            if (!userId) {
                setNotifications([]);
                setLoadingNotifications(false);
                return;
            }
            
            // Fetch notifications for this user
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('Error fetching notifications:', error);
                setNotifications([]);
            } else {
                setNotifications(data || []);
            }
            setLoadingNotifications(false);
        };
        
        fetchNotifications();
        
        // Set up real-time subscription for new notifications
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (localUser.uid) {
            const channel = supabase
                .channel('notifications-channel')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${localUser.uid}`
                    },
                    () => {
                        fetchNotifications();
                    }
                )
                .subscribe();
            
            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    // Format time ago
    const formatTimeAgo = (timestamp) => {
        if (!timestamp) return '';
        const now = new Date();
        const past = new Date(timestamp);
        const diffInSeconds = Math.floor((now - past) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return past.toLocaleDateString();
    };

    // Mark notification as read and navigate
    const handleNotificationClick = async (notification) => {
        // Mark as read
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notification.id);
        
        if (!error) {
            setNotifications(prev => 
                prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
            );
        }

        // Navigate if link exists
        if (notification.link) {
            setIsNotificationOpen(false);
            navigate(notification.link);
        }
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
                    onClick={() => setTheme(theme === "inverted" ? "light" : "inverted")}
                    className="hidden xs:inline-flex rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                    title="Invert colors"
                >
                    {theme === "inverted" ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                {/* Notification Bell */}
                <div className="relative" ref={notificationRef}>
                    <button
                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                        className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50 relative"
                        title="Notifications"
                    >
                        <Bell size={18} />
                        {/* Notification badge */}
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {isNotificationOpen && (
                        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800 z-50 max-h-[480px] flex flex-col">
                            {/* Header */}
                            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                                        Notifications
                                    </h3>
                                    {unreadCount > 0 && (
                                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                            {unreadCount} new
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Notification List */}
                            <div className="overflow-y-auto flex-1">
                                {notifications.length > 0 ? (
                                    notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            onClick={() => handleNotificationClick(notification)}
                                            className={cn(
                                                "px-4 py-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors",
                                                !notification.read && "bg-blue-50 dark:bg-blue-900/10",
                                                notification.link && "hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                            )}
                                        >
                                            <div className="flex items-start gap-3">
                                                {/* Icon based on type */}
                                                <div className={cn(
                                                    "mt-1 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                                    notification.type === "success" && "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
                                                    notification.type === "message" && "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
                                                    notification.type === "reminder" && "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
                                                    notification.type === "info" && "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                                                )}>
                                                    <Bell size={14} />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                                                            {notification.title}
                                                        </p>
                                                        {!notification.read && (
                                                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                                        {formatTimeAgo(notification.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-8 text-center">
                                        <Bell size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            No notifications
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {notifications.length > 0 && (
                                <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700">
                                    <button 
                                        onClick={() => {
                                            const basePath = currentUser.role === 'admin' ? '/admin' : 
                                                           currentUser.role === 'superadmin' ? '/superadmin' :
                                                           currentUser.role === 'adviser' ? '/adviser' : '/student';
                                            navigate(`${basePath}/notifications`);
                                            setIsNotificationOpen(false);
                                        }}
                                        className="w-full text-center text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 py-1"
                                    >
                                        View all notifications
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

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
                                    setTheme(theme === "inverted" ? "light" : "inverted");
                                    setIsUserMenuOpen(false);
                                }}
                                className="xs:hidden w-full flex items-center gap-x-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                            >
                                {theme === "inverted" ? <Sun size={16} /> : <Moon size={16} />}
                                {theme === "inverted" ? "Light Mode" : "Invert Colors"}
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
