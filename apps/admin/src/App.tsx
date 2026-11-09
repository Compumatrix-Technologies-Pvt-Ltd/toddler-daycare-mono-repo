import { useEffect, useState } from "react";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { AdminHeader } from "./components/layout/AdminHeader";
import { AdminSidebar } from "./components/layout/AdminSidebar";
import { DashboardView } from "./components/dashboard/DashboardView";
import { SettingsView } from "./components/settings/SettingsView";
import { LogoutModal } from "./components/modals/LogoutModal";
import { ApplicationDetailModal } from "./components/modals/ApplicationDetailModal";
import { AdminLogin } from "./components/auth/AdminLogin";
import { AdminForgotPassword } from "./components/auth/AdminForgotPassword";
import { adminAuthService } from "./services/adminAuthService";
import {
  AdminTab,
  AdminUser,
  DaycareApplication,
  PlatformSettings,
} from "./types/admin";

const INITIAL_APPLICATIONS: DaycareApplication[] = [
  {
    id: "app-1",
    caretakerName: "Maria Weber",
    daycareName: "Kita Sonnenschein",
    location: "Stargarder Straße 14, 10437 Berlin",
    district: "Prenzlauer Berg",
    permitNumber: "DE-84920-BER",
    submittedDate: "Oct 20, 2026",
    status: "approved",
    capacity: 5,
    phone: "+49 30 4482910",
    email: "m.weber@kita-sonnenschein.de",
    documentsCount: 4,
  },
  {
    id: "app-2",
    caretakerName: "Hannah Müller",
    daycareName: "Kleine Entdecker",
    location: "Kollwitzstraße 42, 10405 Berlin",
    district: "Prenzlauer Berg",
    permitNumber: "DE-91024-BER",
    submittedDate: "Oct 21, 2026",
    status: "pending",
    capacity: 4,
    phone: "+49 30 8829104",
    email: "hannah@kleine-entdecker-berlin.de",
    documentsCount: 3,
  },
  {
    id: "app-3",
    caretakerName: "Lucas Fischer",
    daycareName: "Waldkinder Prenzlau",
    location: "Dunckerstraße 8, 10437 Berlin",
    district: "Pankow",
    permitNumber: "DE-77319-BER",
    submittedDate: "Oct 22, 2026",
    status: "pending",
    capacity: 5,
    phone: "+49 30 7731920",
    email: "lucas@waldkinder-prenzlau.de",
    documentsCount: 5,
  },
  {
    id: "app-4",
    caretakerName: "Elena Rostova",
    daycareName: "Bilingual Nest Berlin",
    location: "Torstraße 118, 10119 Berlin",
    district: "Mitte",
    permitNumber: "DE-66281-BER",
    submittedDate: "Oct 24, 2026",
    status: "pending",
    capacity: 5,
    phone: "+49 30 6628190",
    email: "elena@bilingualnest.de",
    documentsCount: 4,
  },
];

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

  const [applications, setApplications] =
    useState<DaycareApplication[]>(INITIAL_APPLICATIONS);
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

  const handleUpdateStatus = (id: string, newStatus: "approved" | "rejected") => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
    );
    const target = applications.find((a) => a.id === id);
    if (target) {
      setToastMessage(
        `Application for ${target.caretakerName} (${target.daycareName}) has been ${newStatus}.`
      );
      setTimeout(() => setToastMessage(null), 3500);
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
    <div className="min-h-screen bg-[#FAF7F2] text-[#1E1B18] flex flex-col antialiased selection:bg-[#FDE8E8] selection:text-[#A12D3A]">
      {/* Top Navbar */}
      <AdminHeader
        user={currentUser}
        unreadNotificationsCount={pendingCount}
        onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
      />

      {/* Main Container */}
      <div className="flex-1 w-full max-w-[1440px] mx-auto flex overflow-hidden">
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
        />

        {/* Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="mb-4 sm:mb-6 p-4 rounded-xl bg-[#DCFCE7] border border-[#86EFAC] text-[#166534] text-xs sm:text-sm font-semibold flex items-center justify-between shadow-2xs animate-in fade-in slide-in-from-top-2">
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
              onUpdateStatus={handleUpdateStatus}
              onOpenDetails={(app) => setSelectedApp(app)}
            />
          )}

          {activeTab === "settings" && (
            <SettingsView
              initialSettings={settings}
              onSave={(newSettings) => setSettings(newSettings)}
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
        onApprove={(id) => {
          handleUpdateStatus(id, "approved");
          setSelectedApp(null);
        }}
        onReject={(id) => {
          handleUpdateStatus(id, "rejected");
          setSelectedApp(null);
        }}
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
