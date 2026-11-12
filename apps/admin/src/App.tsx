import { useEffect, useState } from "react";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { AdminHeader } from "./components/layout/AdminHeader";
import { AdminSidebar } from "./components/layout/AdminSidebar";
import { DashboardView } from "./components/dashboard/DashboardView";
import { DaycaresTableSection } from "./components/dashboard/DaycaresTableSection";
import { InquiriesView } from "./components/inquiries/InquiriesView";
import { SettingsView } from "./components/settings/SettingsView";
import { LogoutModal } from "./components/modals/LogoutModal";
import { ApplicationDetailModal } from "./components/modals/ApplicationDetailModal";
import { WorkPermitApproveModal } from "./components/modals/WorkPermitApproveModal";
import { AdminLogin } from "./components/auth/AdminLogin";
import { AdminForgotPassword } from "./components/auth/AdminForgotPassword";
import { adminAuthService } from "./services/adminAuthService";
import { adminDaycareService } from "./services/adminDaycareService";
import { adminSettingsService } from "./services/adminSettingsService";
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
  autoValidatePermits: true,
  emailNotificationOnInquiry: true,
  dailyDigestEnabled: true,
  allowPublicInquiries: true,
  maintenanceMode: false,
  sessionTimeoutMinutes: 60,
};

function AdminPortalInner() {
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authScreen, setAuthScreen] = useState<"login" | "forgot-password">("login");

  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<DaycareApplication | null>(null);
  const [approveTargetApp, setApproveTargetApp] = useState<DaycareApplication | null>(null);

  // Real Daycare Applications from MongoDB (zero mock data)
  const [applications, setApplications] = useState<DaycareApplication[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [settings, setSettings] = useState<PlatformSettings>(INITIAL_SETTINGS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Fetch real registered daycares when authenticated
  useEffect(() => {
    if (!currentUser) {
      setApplications([]);
      return;
    }

    setIsLoadingApplications(true);
    adminDaycareService
      .getDaycares()
      .then((data) => {
        setApplications(data);
      })
      .catch((err) => {
        console.error("Error loading daycares from API:", err);
      })
      .finally(() => {
        setIsLoadingApplications(false);
      });

    // Also fetch live platform settings (including defaultCatchmentRadiusKm)
    adminSettingsService
      .getSettings()
      .then((data) => {
        if (data) setSettings(data);
      })
      .catch((err) => {
        console.warn("Could not load platform settings:", err);
      });
  }, [currentUser]);

  const handleSaveSettings = async (newSettings: PlatformSettings) => {
    try {
      const updated = await adminSettingsService.updateSettings(newSettings);
      setSettings(updated);
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
      setToastMessage(`Failed to update status: ${err.message || "Server error"}`);
      setTimeout(() => setToastMessage(null), 4000);
      throw err;
    }
  };

  const handleLogout = () => {
    adminAuthService.logout();
    setLogoutModalOpen(false);
    setCurrentUser(null);
    setAuthScreen("login");
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
    if (authScreen === "forgot-password") {
      return (
        <AdminForgotPassword
          onBackToLogin={() => setAuthScreen("login")}
        />
      );
    }
    return (
      <AdminLogin
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setAuthScreen("login");
        }}
        onNavigateToForgotPassword={() => setAuthScreen("forgot-password")}
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
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setMobileSidebarOpen(false);
          }}
          onLogoutClick={() => setLogoutModalOpen(true)}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          pendingCount={pendingCount}
          user={currentUser}
        />

        {/* Content Area */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto p-4 sm:p-5 lg:p-6 xl:p-8">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="mb-4 sm:mb-5 p-3.5 sm:p-4 rounded-xl bg-[#DCFCE7] border border-[#86EFAC] text-[#166534] text-xs sm:text-sm font-semibold flex items-center justify-between shadow-2xs animate-in fade-in slide-in-from-top-2">
              <span>{toastMessage}</span>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-[#166534] hover:text-[#14532D] text-xs font-bold uppercase tracking-wider ml-4 cursor-pointer"
              >
                {t.admin.dashboard.detailModal.close}
              </button>
            </div>
          )}

          {activeTab === "dashboard" && (
            <DashboardView
              applications={applications}
              isLoading={isLoadingApplications}
              onViewAllDaycares={() => setActiveTab("daycares")}
              onRequestApprove={(app) => setApproveTargetApp(app)}
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
                onReject={(id) => handleUpdateStatus(id, "rejected")}
                onOpenDetails={(app) => setSelectedApp(app)}
              />
            </div>
          )}

          {activeTab === "inquiries" && <InquiriesView />}

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
        onReject={(id) => {
          handleUpdateStatus(id, "rejected");
          setSelectedApp(null);
        }}
      />

      <WorkPermitApproveModal
        application={approveTargetApp}
        onClose={() => setApproveTargetApp(null)}
        onConfirmApprove={(id, details) => handleUpdateStatus(id, "approved", details)}
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
