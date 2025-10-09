import { Outlet, useNavigate } from "react-router-dom";
import { useMediaQuery } from "@uidotdev/usehooks";
import { useClickOutside } from "../hooks/use-click-outside";
import { Sidebar } from "../layouts/sidebar";
import { Header } from "../layouts/header";
import { cn } from "../utils/cn";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabase/client";
import PasswordChangeModal from "../components/PasswordChangeModal";


const DashboardLayout = () => {
    const navigate = useNavigate();
    const isDesktopDevice = useMediaQuery("(min-width: 768px)");
    // Use proper toggle state instead of hover, default to collapsed
    const [collapsed, setCollapsed] = useState(true);
    const sidebarRef = useRef(null);

    // Password change modal state
    const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isCheckingPasswordStatus, setIsCheckingPasswordStatus] = useState(true);

    // Check if user is logged in and needs password change
    useEffect(() => {
        const checkUserAndPasswordStatus = async () => {
            const userStr = localStorage.getItem('user');
            if (!userStr) {
                navigate('/');
                return;
            }

            const user = JSON.parse(userStr);
            setCurrentUser(user);

            // Check if user needs to change password
            try {
                const { data: userData, error } = await supabase
                    .from('users')
                    .select('needs_password_change')
                    .eq('id', user.uid)
                    .single();

                if (!error && userData?.needs_password_change) {
                    setShowPasswordChangeModal(true);
                }
            } catch (error) {
                console.error('Error checking password status:', error);
            } finally {
                setIsCheckingPasswordStatus(false);
            }
        };

        checkUserAndPasswordStatus();
    }, [navigate]);

    // Click outside logic for mobile: hide sidebar on click-outside
    useClickOutside([sidebarRef], () => {
        if (!isDesktopDevice && !collapsed) {
            setCollapsed(true);
        }
    });

    // Handle menu item click - collapse sidebar
    const handleMenuItemClick = () => {
        setCollapsed(true);
    };

    const handlePasswordChanged = () => {
        setShowPasswordChangeModal(false);
        // Optionally refresh user data in localStorage
        if (currentUser) {
            const updatedUser = { ...currentUser, needs_password_change: false };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setCurrentUser(updatedUser);
        }
    };

    // Show loading screen while checking password status
    if (isCheckingPasswordStatus) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 transition-colors dark:bg-slate-950">
            <div
                className={cn(
                    "pointer-events-none fixed inset-0 -z-10 bg-black opacity-0 transition-opacity",
                    !collapsed && "max-md:pointer-events-auto max-md:z-50 max-md:opacity-30",
                )}
            />
            <Sidebar
                ref={sidebarRef}
                collapsed={collapsed}
                onMenuItemClick={handleMenuItemClick}
            />
            <div className={cn("transition-[margin] duration-300", !collapsed ? "md:ml-[240px]" : "md:ml-[70px]")}> 
                <Header
                    collapsed={collapsed}
                    setCollapsed={setCollapsed}
                />
                <div className="h-[calc(100vh-60px)] overflow-y-auto overflow-x-hidden p-6">
                    <Outlet />
                </div>
            </div>

            {/* Password Change Modal */}
            <PasswordChangeModal
                isOpen={showPasswordChangeModal}
                onPasswordChanged={handlePasswordChanged}
                userEmail={currentUser?.email}
            />
        </div>
    );
};

export default DashboardLayout;
