import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { AdminHeader } from "./components/layout/AdminHeader";
import { AdminSidebar } from "./components/layout/AdminSidebar";
import { DashboardView } from "./components/dashboard/DashboardView";
import { DaycaresTableSection } from "./components/dashboard/DaycaresTableSection";
import { InquiriesView } from "./components/inquiries/InquiriesView";
import { ContactMessagesView } from "./components/contact/ContactMessagesView";
import { SettingsView } from "./components/settings/SettingsView";
import { LogoutModal } from "./components/modals/LogoutModal";
import { ApplicationDetailModal } from "./components/modals/ApplicationDetailModal";
import { WorkPermitApproveModal } from "./components/modals/WorkPermitApproveModal";
import { RejectModal } from "./components/modals/RejectModal";
import { AdminLogin } from "./components/auth/AdminLogin";
import { AdminForgotPassword } from "./components/auth/AdminForgotPassword";
import { adminAuthService } from "./services/adminAuthService";
import { adminDaycareService, AdminDashboardStats } from "./services/adminDaycareService";
import { adminContactService } from "./services/adminContactService";
import { adminSettingsService } from "./services/adminSettingsService";
import { getAdminSocket } from "./utils/socket";
import {
  AdminTab,
  AdminUser,
  DaycareApplication,
  PlatformSettings,
  WorkPermitDetails,
} from "./types/admin";

const INITIAL_SETTINGS: PlatformSettings = {
  siteName: "Find Toddler Daycare",
  contactEmail: "admin@toddler-care.de",
  defaultCatchmentRadiusKm: 3.0,
  urbanCatchmentRadiusKm: 3.0,
  ruralCatchmentRadiusKm: 10.0,
  autoValidatePermits: true,
  emailNotificationOnInquiry: true,
  dailyDigestEnabled: true,
  allowPublicInquiries: true,
  maintenanceMode: false,
  sessionTimeoutMinutes: 60,
};

function AdminPortalInner() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authScreen, setAuthScreen] = useState<"login" | "forgot-password">("login");

  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<DaycareApplication | null>(null);
  const [approveTargetApp, setApproveTargetApp] = useState<DaycareApplication | null>(null);
  const [rejectTargetApp, setRejectTargetApp] = useState<DaycareApplication | null>(null);

  // Real Daycare Applications from MongoDB (zero mock data)
  const [applications, setApplications] = useState<DaycareApplication[]>([]);
  const [dashboardStats, setDashboardStats] = useState<AdminDashboardStats | null>(null);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [inquiriesCount, setInquiriesCount] = useState<number>(0);
  const [unreadContactCount, setUnreadContactCount] = useState<number>(0);
  const [settings, setSettings] = useState<PlatformSettings>(INITIAL_SETTINGS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Synchronize activeTab with URL path
  useEffect(() => {
    const rawPath = location.pathname.toLowerCase().replace(/^\//, "");
    if (rawPath === "daycares") {
      setActiveTab("daycares");
    } else if (rawPath === "inquiries") {
      setActiveTab("inquiries");
    } else if (rawPath === "contact" || rawPath === "messages") {
      setActiveTab("contact");
    } else if (rawPath === "settings") {
      setActiveTab("settings");
    } else if (rawPath === "dashboard" || rawPath === "") {
      setActiveTab("dashboard");
    }
  }, [location.pathname]);

  // When authenticated user is on / or /login, redirect URL to /dashboard
  useEffect(() => {
    if (currentUser && (location.pathname === "/login" || location.pathname === "/" || location.pathname === "")) {
      navigate("/dashboard", { replace: true });
    }
  }, [currentUser, location.pathname, navigate]);

  const handleSelectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    navigate(`/${tab}`);
    setMobileSidebarOpen(false);
  };

  // Restore authenticated session on page load
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      setIsCheckingAuth(false);
      return;
    }

    adminAuthService
      .getProfile()
      .then((user) => setCurrentUser(user))
      .catch(() => {
        adminAuthService.logout();
        setCurrentUser(null);
      })
      .finally(() => setIsCheckingAuth(false));
  }, []);

  // Fetch real registered daycares & dashboard stats when authenticated
  useEffect(() => {
    if (!currentUser) {
      setApplications([]);
      setDashboardStats(null);
      return;
    }

    setIsLoadingApplications(true);
    // Fetch live dashboard stats from API (totalDaycares, pendingPermits, verifiedCaretakers, demandInquiries, totalCapacity, applications)
    adminDaycareService
      .getDashboardStats()
      .then((stats) => {
        if (stats) {
          setDashboardStats(stats);
          setApplications(stats.applications);
          setInquiriesCount(stats.demandInquiries);
        } else {
          // Fallback to getDaycares
          return adminDaycareService.getDaycares().then((data) => setApplications(data));
        }
      })
      .catch((err) => {
        console.error("Error loading dashboard data from API:", err);
        return adminDaycareService.getDaycares().then((data) => setApplications(data)).catch(() => {});
      })
      .finally(() => {
        setIsLoadingApplications(false);
      });

    // Also fetch platform settings (including defaultCatchmentRadiusKm)
    adminSettingsService
      .getSettings()
      .then((data) => {
        if (data) setSettings(data);
      })
      .catch((err) => {
        console.warn("Could not load platform settings:", err);
      });

    // Fetch contact messages stats & unread count
    adminContactService
      .getAllMessages()
      .then((res) => {
        setUnreadContactCount(res.unread);
      })
      .catch((err) => {
        console.warn("Could not load contact messages count:", err);
      });

    const socket = getAdminSocket();
    if (!socket) return;

    socket.emit("join:admin");

    const handleDaycareUpdated = () => {
      adminDaycareService
        .getDashboardStats()
        .then((stats) => {
          if (stats) {
            setDashboardStats(stats);
            setApplications(stats.applications);
            setInquiriesCount(stats.demandInquiries);
          } else {
            return adminDaycareService.getDaycares().then((data) => setApplications(data));
          }
        })
        .catch(() => {});
    };

    const handleContactNew = () => {
      setUnreadContactCount((prev) => prev + 1);
    };

    socket.on("daycare:updated", handleDaycareUpdated);
    socket.on("contact:new", handleContactNew);

    return () => {
      socket.off("daycare:updated", handleDaycareUpdated);
      socket.off("contact:new", handleContactNew);
    };
  }, [currentUser]);

  const handleSaveSettings = async (newSettings: PlatformSettings) => {
    try {
      const updated = await adminSettingsService.updateSettings(newSettings);
      setSettings(updated);
      try {
        const refreshed = await adminDaycareService.getDaycares();
        if (Array.isArray(refreshed) && refreshed.length > 0) {
          setApplications(refreshed);
        }
      } catch {
        setApplications((prev) =>
          prev.map((app) => ({
            ...app,
            catchmentRadiusKm:
              app.areaType === "rural"
                ? updated.ruralCatchmentRadiusKm
                : updated.urbanCatchmentRadiusKm,
          }))
        );
      }
      setToastMessage(t.admin.settings.savedToast || "Settings saved successfully.");
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: any) {
      setToastMessage(`Failed to save settings: ${err.message || "Server error"}`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleUpdateStatus = async (
    id: string,
    newStatus: "approved" | "rejected",
    workPermitDetails?: WorkPermitDetails
  ) => {
    try {
      const updatedApp = await adminDaycareService.updateStatus(id, newStatus, workPermitDetails);
      setApplications((prev) =>
        prev.map((app) =>
          app.id === id
            ? updatedApp || {
                ...app,
                status: newStatus,
                ...(workPermitDetails
                  ? {
                      permitId: workPermitDetails.permitId,
                      permitNumber: workPermitDetails.permitId,
                      registrationDate: workPermitDetails.registrationDate,
                      expirationDate: workPermitDetails.expirationDate,
                      issuingAuthority: workPermitDetails.issuingAuthority,
                      authorizedCapacity: workPermitDetails.authorizedCapacity,
                      capacity: workPermitDetails.authorizedCapacity ?? app.capacity,
                      adminNotes: workPermitDetails.adminNotes,
                    }
                  : {}),
              }
            : app
        )
      );
      const target = applications.find((a) => a.id === id);
      if (target) {
        setToastMessage(
          `Application for ${target.caretakerName} (${target.daycareName}) has been ${newStatus}.`
        );
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (err: any) {
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.permitId?.[0] ||
        err?.message ||
        "Server error";
      setToastMessage(`Failed to update status: ${serverMsg}`);
      setTimeout(() => setToastMessage(null), 4000);
      throw err;
    }
  };

  const handleLogout = () => {
    adminAuthService.logout();
    setLogoutModalOpen(false);
    setCurrentUser(null);
    setDashboardStats(null);
    setAuthScreen("login");
    navigate("/login");
  };

  const pendingCount = applications.filter((a) => a.status === "pending").length;

  // Initial Auth Check Spinner
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <div className="w-9 h-9 border-3 border-[#A12D3A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Unauthenticated Flow: Login & Forgot Password
  if (!currentUser) {
    if (authScreen === "forgot-password" || location.pathname === "/forgot-password") {
      return (
        <AdminForgotPassword
          onBackToLogin={() => {
            setAuthScreen("login");
            navigate("/login");
          }}
        />
      );
    }
    return (
      <AdminLogin
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setAuthScreen("login");
          navigate("/dashboard");
        }}
        onNavigateToForgotPassword={() => {
          setAuthScreen("forgot-password");
          navigate("/forgot-password");
        }}
      />
    );
  }

  // Authenticated Dashboard Layout
  return (
    <div className="min-h-screen lg:h-screen bg-[#FAF7F2] text-[#1E1B18] flex flex-col antialiased selection:bg-[#FDE8E8] selection:text-[#A12D3A] overflow-x-hidden">
      {/* Top Navbar */}
      <AdminHeader
        user={currentUser}
        unreadNotificationsCount={pendingCount}
        onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
      />

      {/* Main Container */}
      <div className="flex-1 w-full max-w-[1440px] mx-auto flex min-h-0 min-w-0 overflow-hidden">
        {/* Sidebar */}
        <AdminSidebar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          onLogoutClick={() => setLogoutModalOpen(true)}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          pendingCount={pendingCount}
          unreadContactCount={unreadContactCount}
          user={currentUser}
        />

        {/* Content Area */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto p-4 sm:p-5 lg:p-6 xl:p-8">
          {/* Toast Notification (Fixed Floating on Top) */}
          {toastMessage && (
            <div
              className={`fixed top-20 left-1/2 -translate-x-1/2 z-60 max-w-lg w-[calc(100%-2rem)] p-3.5 sm:p-4 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-top-4 transition-all duration-300 ${
                toastMessage.toLowerCase().includes("fail") || toastMessage.toLowerCase().includes("error")
                  ? "bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]"
                  : "bg-[#DCFCE7] border-[#86EFAC] text-[#166534]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {toastMessage.toLowerCase().includes("fail") || toastMessage.toLowerCase().includes("error") ? (
                  <svg className="w-5 h-5 text-[#DC2626] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-[#16A34A] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                <span>{toastMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="hover:opacity-75 text-xs font-bold uppercase tracking-wider ml-4 cursor-pointer shrink-0"
              >
                {t.admin.dashboard.detailModal.close}
              </button>
            </div>
          )}

          {activeTab === "dashboard" && (
            <DashboardView
              applications={applications}
              inquiriesCount={inquiriesCount}
              stats={dashboardStats}
              isLoading={isLoadingApplications}
              onViewAllDaycares={() => handleSelectTab("daycares")}
              onRequestApprove={(app) => setApproveTargetApp(app)}
              onRequestReject={(app) => setRejectTargetApp(app)}
              onReject={(id) => handleUpdateStatus(id, "rejected")}
              onOpenDetails={(app) => setSelectedApp(app)}
            />
          )}

          {activeTab === "daycares" && (
            <div className="animate-in fade-in duration-200">
              <DaycaresTableSection
                applications={applications}
                isLoading={isLoadingApplications}
                mode="full"
                onRequestApprove={(app) => setApproveTargetApp(app)}
                onRequestReject={(app) => setRejectTargetApp(app)}
                onReject={(id) => handleUpdateStatus(id, "rejected")}
                onOpenDetails={(app) => setSelectedApp(app)}
              />
            </div>
          )}

          {activeTab === "inquiries" && <InquiriesView />}

          {activeTab === "contact" && (
            <ContactMessagesView onUnreadCountChange={setUnreadContactCount} />
          )}

          {activeTab === "settings" && (
            <SettingsView
              initialSettings={settings}
              onSave={handleSaveSettings}
              currentUserRole={currentUser.role}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <LogoutModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={handleLogout}
      />

      <ApplicationDetailModal
        application={selectedApp}
        onClose={() => setSelectedApp(null)}
        onApprove={(app) => {
          setSelectedApp(null);
          setApproveTargetApp(app);
        }}
        onRequestReject={(app) => {
          setSelectedApp(null);
          setRejectTargetApp(app);
        }}
        onReject={(id) => {
          handleUpdateStatus(id, "rejected");
          setSelectedApp(null);
        }}
      />

      {approveTargetApp && (
        <WorkPermitApproveModal
          application={approveTargetApp}
          applications={applications}
          onClose={() => setApproveTargetApp(null)}
          onConfirmApprove={(id, details) => handleUpdateStatus(id, "approved", details)}
        />
      )}

      <RejectModal
        application={rejectTargetApp}
        isOpen={Boolean(rejectTargetApp)}
        onClose={() => setRejectTargetApp(null)}
        onConfirmReject={(id, adminNotes) =>
          handleUpdateStatus(id, "rejected", adminNotes ? ({ adminNotes } as any) : undefined)
        }
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AdminPortalInner />
    </LanguageProvider>
  );
}
