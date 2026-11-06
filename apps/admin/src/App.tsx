import { useState } from "react";
import { LanguageProvider } from "./context/LanguageContext";
import { AdminHeader } from "./components/layout/AdminHeader";
import { AdminSidebar } from "./components/layout/AdminSidebar";
import { DashboardView } from "./components/dashboard/DashboardView";
import { SettingsView } from "./components/settings/SettingsView";
import { LogoutModal } from "./components/modals/LogoutModal";
import { ApplicationDetailModal } from "./components/modals/ApplicationDetailModal";
import { AdminLogin } from "./components/auth/AdminLogin";
import { AdminForgotPassword } from "./components/auth/AdminForgotPassword";
import {
  AdminTab,
  AdminUser,
  DaycareApplication,
  PlatformSettings,
} from "./types/admin";

const MOCK_SUPER_ADMIN: AdminUser = {
  id: "super-admin-1",
  name: "Sarah Jenkins",
  email: "s.jenkins@toddler-governance.berlin",
  role: "super-admin",
  avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80",
  status: "online",
  permissions: ["*"],
};

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
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(MOCK_SUPER_ADMIN);
  const [authScreen, setAuthScreen] = useState<"login" | "forgot-password">("login");

  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<DaycareApplication | null>(null);

  const [applications, setApplications] =
    useState<DaycareApplication[]>(INITIAL_APPLICATIONS);
  const [settings, setSettings] = useState<PlatformSettings>(INITIAL_SETTINGS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    setLogoutModalOpen(false);
    setCurrentUser(null);
    setAuthScreen("login");
  };

  const pendingCount = applications.filter((a) => a.status === "pending").length;

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
          setToastMessage(`Signed in as ${user.name} (${user.role === "super-admin" ? "Super Admin" : "Standard Admin"}).`);
          setTimeout(() => setToastMessage(null), 4000);
        }}
        onNavigateToForgotPassword={() => setAuthScreen("forgot-password")}
      />
    );
  }

  // Authenticated Admin Console Flow
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1E1B18] flex flex-col font-sans antialiased overflow-x-clip">
      {/* Top Header - Rule 3 Desktop Sizing & Header Standards */}
      <AdminHeader
        user={currentUser}
        unreadNotificationsCount={pendingCount}
        onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
      />

      {/* Main Container - Responsive Flex Layout with min-w-0 (Rule 3) */}
      <div className="flex-1 w-full max-w-[1440px] mx-auto flex">
        {/* Left Side Sidebar */}
        <AdminSidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onLogoutClick={() => setLogoutModalOpen(true)}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          pendingCount={pendingCount}
        />

        {/* Main Work Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-5">
          {/* Action Feedback Toast */}
          {toastMessage && (
            <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] text-xs sm:text-sm font-semibold flex items-center justify-between shadow-2xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>{toastMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#15803D] hover:bg-[#DCFCE7] cursor-pointer"
                aria-label="Dismiss message"
              >
                ✕
              </button>
            </div>
          )}

          {/* Screen Switcher */}
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
              onSave={(updated) => setSettings(updated)}
              currentUserRole={currentUser.role}
            />
          )}
        </main>
      </div>

      {/* Application Inspection Modal */}
      <ApplicationDetailModal
        application={selectedApp}
        onClose={() => setSelectedApp(null)}
        onApprove={(id) => handleUpdateStatus(id, "approved")}
        onReject={(id) => handleUpdateStatus(id, "rejected")}
      />

      {/* Sign Out Confirmation Modal */}
      <LogoutModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={handleLogout}
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
