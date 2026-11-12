import { BrandSunIcon, MenuIcon, BellIcon } from "../icons/AdminIcons";
import { AdminUser } from "../../types/admin";
import { useLanguage } from "../../context/LanguageContext";

interface AdminHeaderProps {
  user: AdminUser;
  unreadNotificationsCount?: number;
  onToggleMobileSidebar: () => void;
}

export function AdminHeader({
  user,
  unreadNotificationsCount = 0,
  onToggleMobileSidebar,
}: AdminHeaderProps) {
  const { t, language, toggleLanguage } = useLanguage();

  return (
    <header className="sticky top-0 z-30 min-h-14 sm:min-h-16 pt-[env(safe-area-inset-top)] w-full bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E5DDD2] px-3 sm:px-6 lg:px-8 transition-colors flex items-center shrink-0">
      <div className="w-full max-w-[1440px] mx-auto flex items-center justify-between gap-2 sm:gap-4 min-w-0">
        {/* Left Side: Mobile Hamburger & Website Logo */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 sm:flex-initial min-w-0">
          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="lg:hidden w-10 h-10 -ml-1 rounded-xl flex items-center justify-center text-[#423223] hover:bg-[#EFE7DC] active:scale-95 transition-all cursor-pointer shrink-0"
            aria-label="Toggle navigation menu"
          >
            <MenuIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Website Logo & Brand Text */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center relative shrink-0 shadow-2xs">
              <BrandSunIcon className="w-8 h-8 sm:w-9 sm:h-9 text-[#EAA000]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span className="font-bold text-[#423223] text-sm sm:text-base leading-tight tracking-tight truncate sm:whitespace-nowrap">
                  {t.brand.title}
                </span>
                <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-[#A12D3A] text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shrink-0 shadow-2xs">
                  {t.admin.badge}
                </span>
              </div>
              <div className="text-[10px] sm:text-xs text-[#8A775C] tracking-wide whitespace-nowrap hidden md:block">
                {t.admin.portalSubtitle}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Language Toggle + Notifications + Profile */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Multi-language Toggle (DE | EN) - Mandatory Rule 5 */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2.5 sm:px-3 h-9 sm:h-10 rounded-xl bg-white border border-[#E5DDD2] hover:bg-[#F3ECE2] text-xs font-bold text-[#423223] shadow-2xs transition-all cursor-pointer shrink-0"
            aria-label="Toggle language between German and English"
          >
            <span>{language === "de" ? "🇩🇪 DE" : "🇬🇧 EN"}</span>
          </button>

          {/* Notifications Bell */}
          <button
            type="button"
            className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-[#5C4C3E] hover:text-[#1E1B18] hover:bg-[#EFE7DC] transition-colors cursor-pointer shrink-0"
            aria-label={`${unreadNotificationsCount} unread notifications`}
          >
            <BellIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#A12D3A] ring-2 ring-[#FAF7F2]" />
            )}
          </button>

          {/* Vertical Divider */}
          <div className="h-5 sm:h-6 w-px bg-[#E5DDD2] hidden sm:block shrink-0" />

          {/* Profile Name & Avatar (Right Side) */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 pl-0.5 sm:pl-0">
            {/* Avatar with Status Dot */}
            <div className="relative shrink-0">
              <img
                src={user.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                alt={user.name}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-white shadow-2xs bg-[#FAF7F2]"
              />
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                  user.status === "online"
                    ? "bg-[#16A34A]"
                    : user.status === "away"
                      ? "bg-[#D97706]"
                      : "bg-[#94A3B8]"
                }`}
                title={`Status: ${user.status}`}
              />
            </div>

            {/* Profile Info (Name & Role) */}
            <div className="hidden sm:block text-left leading-tight min-w-0">
              <div className="font-bold text-[#1E1B18] text-xs sm:text-sm tracking-tight truncate max-w-[120px] xl:max-w-[160px] whitespace-nowrap">
                {user.name}
              </div>
              <div className="text-[10px] sm:text-[11px] font-medium text-[#7A6E62] truncate whitespace-nowrap">
                {user.role === "super-admin"
                  ? t.admin.auth.roles.superAdmin
                  : t.admin.auth.roles.admin}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
