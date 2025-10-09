import { Menu, Moon, Sun, LogOut, User, Bell } from "lucide-react";
import { useTheme } from "../contexts/theme-context";
import { cn } from "../utils/cn";

export const Header = ({ collapsed, setCollapsed }) => {
    const { theme, setTheme } = useTheme();

    const handleLogout = () => {
        // Clear user data from localStorage
        localStorage.removeItem('user');
        // Redirect to home page
        window.location.href = '/';
    };

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    return (
        <header className="flex h-[60px] items-center justify-between border-b border-slate-300 bg-white px-6 transition-colors dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <Menu size={20} />
                </button>
            </div>
            <div className="flex items-center gap-x-4">
                {/* Theme Toggle */}
                <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
                >
                    {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                {/* Notification Bell */}
                <button
                    className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
                    title="Notifications"
                >
                    <Bell size={20} />
                </button>

                {/* User Menu */}
                <div className="flex items-center gap-x-3">
                    <div className="flex items-center gap-x-2 rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800">
                        <User size={16} className="text-slate-600 dark:text-slate-400" />
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-50">
                            {currentUser.displayName || currentUser.email || 'User'}
                        </span>
                        <span className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            currentUser.role === 'admin' 
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        )}>
                            {currentUser.role || 'Student'}
                        </span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-red-100 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </header>
    );
};
