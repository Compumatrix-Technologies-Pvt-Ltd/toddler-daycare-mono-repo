import type { ComponentType } from "react";
import {
  DashboardIcon,
  SettingsIcon,
  LogoutIcon,
  CloseIcon,
  BrandSunIcon,
  ShieldCheckIcon,
} from "../icons/AdminIcons";
import { AdminTab } from "../../types/admin";
import { useLanguage } from "../../context/LanguageContext";

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onLogoutClick: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  pendingCount?: number;
}

export function AdminSidebar({
  activeTab,
  onSelectTab,
  onLogoutClick,
  mobileOpen,
  onCloseMobile,
  pendingCount = 3,
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
        badge: pendingCount > 0 ? pendingCount : undefined,
      },
      {
        id: "settings",
        label: t.admin.sidebar.settings,
        icon: SettingsIcon,
      },
    ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-[#E5DDD2] justify-between overflow-hidden">
      {/* Scrollable Top Section */}
      <div className="flex-1 overflow-y-auto">
        {/* Mobile Header in Drawer */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-[#E5DDD2] bg-[#FAF7F2]">
          <div className="flex items-center gap-2.5">
            <BrandSunIcon className="w-8 h-8 text-[#EAA000]" />
            <div>
              <span className="font-bold text-[#423223] text-sm leading-tight block">
                {t.brand.title}
              </span>
              <div className="text-[10px] text-[#8A775C]">{t.admin.badge} Control</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[#5C4C3E] hover:bg-[#EFE7DC] transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="p-3 sm:p-4 space-y-5">
          <div>
            <div className="px-3 pb-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#9E9080]">
              {t.admin.sidebar.mainMenu}
            </div>
            <nav className="space-y-1.5" aria-label="Admin Navigation">
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
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer min-h-[44px] ${isActive
                        ? "bg-[#A12D3A] text-white shadow-2xs"
                        : "text-[#5C4C3E] hover:text-[#1E1B18] hover:bg-[#FAF7F2]"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-[#8A775C]"
                          }`}
                      />
                      <span className="whitespace-nowrap">{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${isActive
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
          <div className="hidden lg:block p-3 rounded-xl bg-[#FAF7F2] border border-[#EBE3D7]">
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
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#DC2626] hover:bg-[#FEE2E2]/70 hover:text-[#B91C1C] transition-all cursor-pointer min-h-[44px]"
        >
          <LogoutIcon className="w-5 h-5 shrink-0 text-[#DC2626]" />
          <span>{t.admin.sidebar.logout}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar (Left Side) */}
      <aside className="hidden lg:block w-60 xl:w-64 shrink-0 h-[calc(100vh-4rem)] sticky top-16 z-20">
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
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
