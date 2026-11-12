import type { ComponentType } from "react";
import {
  DashboardIcon,
  SettingsIcon,
  LogoutIcon,
  CloseIcon,
  BrandSunIcon,
  BuildingIcon,
  ShieldCheckIcon,
  MailIcon,
} from "../icons/AdminIcons";
import { AdminTab, AdminUser } from "../../types/admin";
import { useLanguage } from "../../context/LanguageContext";

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onLogoutClick: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  pendingCount?: number;
  user?: AdminUser | null;
}

export function AdminSidebar({
  activeTab,
  onSelectTab,
  onLogoutClick,
  mobileOpen,
  onCloseMobile,
  pendingCount = 0,
  user,
}: AdminSidebarProps) {
  const { t } = useLanguage();

  const navItems: Array<{
    id: AdminTab;
    label: string;
    icon: ComponentType<{ className?: string }>;
    badge?: number | undefined;
  }> = [
    {
      id: "dashboard",
      label: t.admin.sidebar.dashboard,
      icon: DashboardIcon,
    },
    {
      id: "daycares",
      label: t.admin.sidebar.daycares,
      icon: BuildingIcon,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      id: "inquiries",
      label: t.admin.sidebar.inquiries,
      icon: MailIcon,
    },
    {
      id: "settings",
      label: t.admin.sidebar.settings,
      icon: SettingsIcon,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full w-full bg-white border-r border-[#E5DDD2] justify-between overflow-hidden">
      {/* Scrollable Top & Nav Section */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Mobile Header in Drawer */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-[#E5DDD2] bg-[#FAF7F2]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
              <BrandSunIcon className="w-8 h-8 text-[#EAA000]" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-[#423223] text-sm leading-tight block truncate">
                {t.brand.title}
              </span>
              <div className="text-[10px] text-[#8A775C] font-semibold uppercase tracking-wider">
                {t.admin.badge} Control
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[#5C4C3E] hover:bg-[#EFE7DC] transition-colors cursor-pointer shrink-0"
            aria-label="Close sidebar"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile User Profile Card (Visible in Mobile Drawer) */}
        {user && (
          <div className="lg:hidden p-3.5 mx-3 mt-3 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2] flex items-center gap-3">
            <div className="relative shrink-0">
              <img
                src={user.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover border border-[#E5DDD2]"
              />
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                  user.status === "online"
                    ? "bg-[#16A34A]"
                    : user.status === "away"
                      ? "bg-[#D97706]"
                      : "bg-[#94A3B8]"
                }`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-[#1E1B18] text-xs truncate">
                {user.name}
              </div>
              <div className="text-[10px] text-[#7A6E62] truncate">
                {user.email}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#A12D3A] mt-0.5">
                {user.role === "super-admin"
                  ? t.admin.auth.roles.superAdmin
                  : t.admin.auth.roles.admin}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Section */}
        <div className="p-3 sm:p-4 space-y-4">
          <div>
            <div className="px-3 pb-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#9E9080]">
              {t.admin.sidebar.mainMenu}
            </div>
            <nav className="space-y-1" aria-label="Admin Navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer min-h-[42px] ${
                      isActive
                        ? "bg-[#A12D3A] text-white shadow-2xs"
                        : "text-[#5C4C3E] hover:text-[#1E1B18] hover:bg-[#FAF7F2]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-5 h-5 shrink-0 ${
                          isActive ? "text-white" : "text-[#8A775C]"
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold shrink-0 ml-2 ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-[#FEF3C7] text-[#92400E]"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* System Security Badge */}
          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EBE3D7] shrink-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#423223]">
              <ShieldCheckIcon className="w-4 h-4 text-[#16A34A] shrink-0" />
              <span className="truncate">{t.admin.sidebar.systemActive}</span>
            </div>
            <p className="text-[11px] text-[#8A775C] mt-1 leading-snug">
              {t.admin.sidebar.systemDesc}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Section: Logout Button */}
      <div className="p-3 sm:p-4 border-t border-[#E5DDD2] bg-[#FAF7F2]/60 shrink-0">
        <button
          type="button"
          onClick={() => {
            onCloseMobile();
            onLogoutClick();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#DC2626] hover:bg-[#FEE2E2]/70 hover:text-[#B91C1C] transition-all cursor-pointer min-h-[42px]"
        >
          <LogoutIcon className="w-5 h-5 shrink-0 text-[#DC2626]" />
          <span className="truncate">{t.admin.sidebar.logout}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (Left Side) */}
      <aside className="hidden lg:flex flex-col w-60 xl:w-64 shrink-0 h-full border-r border-[#E5DDD2] bg-white">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer with Backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200 flex flex-col">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
