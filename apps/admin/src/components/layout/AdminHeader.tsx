import { BrandSunIcon, MenuIcon, BellIcon, GermanFlagIcon, UkFlagIcon } from "../icons/AdminIcons";
import { AdminUser } from "../../types/admin";
import { useLanguage } from "../../context/LanguageContext";

interface AdminHeaderProps {
  user?: AdminUser | null;
  unreadNotificationsCount?: number;
  onToggleMobileSidebar: () => void;
}

export function AdminHeader({
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

        {/* Right Side: Language Toggle + Notifications + Logout */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Multi-language Toggle (DE | EN) - Mandatory Rule 5 */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 h-9 sm:h-10 rounded-xl bg-white border border-[#E5DDD2] hover:bg-[#F3ECE2] text-xs font-bold text-[#423223] shadow-2xs transition-all cursor-pointer shrink-0"
            aria-label="Toggle language between German and English"
          >
            {language === "de" ? (
              <>
                <GermanFlagIcon className="w-4 h-3 rounded-xs overflow-hidden shrink-0" />
                <span>DE</span>
              </>
            ) : (
              <>
                <UkFlagIcon className="w-4 h-3 rounded-xs overflow-hidden shrink-0" />
                <span>EN</span>
              </>
            )}
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
        </div>
      </div>
    </header>
  );
}
