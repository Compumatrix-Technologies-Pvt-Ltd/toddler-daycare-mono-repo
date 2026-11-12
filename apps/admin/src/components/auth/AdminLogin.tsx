import { useState, type FormEvent } from "react";
import {
  BrandSunIcon,
  LockIcon,
  MailIcon,
  EyeIcon,
  EyeOffIcon,
  ShieldCheckIcon,
} from "../icons/AdminIcons";
import { adminAuthService } from "../../services/adminAuthService";
import { AdminRole, AdminUser } from "../../types/admin";
import { useLanguage } from "../../context/LanguageContext";

interface AdminLoginProps {
  onLoginSuccess: (user: AdminUser) => void;
  onNavigateToForgotPassword: () => void;
}

export function AdminLogin({
  onLoginSuccess,
  onNavigateToForgotPassword,
}: AdminLoginProps) {
  const { t, language, toggleLanguage } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<AdminRole>("super-admin");
  const [email, setEmail] = useState("s.jenkins@toddler-governance.berlin");
  const [password, setPassword] = useState("Admin@Secure2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleQuickFill = (role: AdminRole) => {
    setSelectedRole(role);
    setErrorMessage(null);
    if (role === "super-admin") {
      setEmail("s.jenkins@toddler-governance.berlin");
      setPassword("Admin@Secure2026!");
    } else {
      setEmail("m.becker@toddler-governance.berlin");
      setPassword("Reviewer@2026!");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage(t.admin.auth.errors.emailRequired);
      return;
    }
    if (!password.trim()) {
      setErrorMessage(t.admin.auth.errors.passwordRequired);
      return;
    }

    setIsLoading(true);

    try {
      const user = await adminAuthService.login(email.trim(), password);
      onLoginSuccess(user);
    } catch (error: any) {
      const backendMessage =
        error.response?.data?.message ||
        t.admin.auth.errors.invalidCredentials ||
        "Login failed";
      setErrorMessage(backendMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1E1B18] flex flex-col justify-between p-4 sm:p-6 lg:p-8 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] antialiased">
      {/* Top Bar with Language Switcher */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full flex items-center justify-center relative shrink-0 shadow-2xs">
            <BrandSunIcon className="w-9 h-9 text-[#EAA000]" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-[#423223] text-sm sm:text-base leading-tight block truncate">
              {t.brand.title}
            </span>
            <span className="text-[10px] text-[#8A775C] uppercase tracking-wider font-semibold block truncate">
              {t.admin.badge} Control
            </span>
          </div>
        </div>

        {/* Language Switcher - Rule 5 */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 h-10 rounded-xl bg-white border border-[#E5DDD2] hover:bg-[#F3ECE2] text-xs font-bold text-[#423223] shadow-2xs transition-all cursor-pointer min-h-[44px]"
          aria-label="Toggle language"
        >
          <span>{language === "de" ? "🇩🇪 DE" : "🇬🇧 EN"}</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md mx-auto my-5 sm:my-8 bg-white rounded-2xl border border-[#E5DDD2] shadow-sm p-5 sm:p-8 space-y-5 sm:space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Card Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FAF7F2] border border-[#E5DDD2] text-[#A12D3A] shadow-2xs mx-auto mb-1">
            <ShieldCheckIcon className="w-6 h-6 text-[#A12D3A]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1E1B18] tracking-tight">
            {t.admin.auth.loginTitle}
          </h1>
          <p className="text-xs sm:text-[13px] text-[#7A6E62] leading-snug">
            {t.admin.auth.loginSubtitle}
          </p>
        </div>

        {/* Role Selector Tabs (Super Admin vs Admin) */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7A6E62]">
            {t.admin.auth.roleSelectLabel}
          </label>
          <div className="grid grid-cols-2 gap-2 bg-[#FAF7F2] p-1 rounded-xl border border-[#E5DDD2]">
            <button
              type="button"
              onClick={() => handleQuickFill("super-admin")}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[40px] ${selectedRole === "super-admin"
                  ? "bg-[#A12D3A] text-white shadow-2xs"
                  : "text-[#5C4C3E] hover:text-[#1E1B18]"
                }`}
            >
              {t.admin.auth.roles.superAdmin}
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill("admin")}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[40px] ${selectedRole === "admin"
                  ? "bg-[#1E1B18] text-white shadow-2xs"
                  : "text-[#5C4C3E] hover:text-[#1E1B18]"
                }`}
            >
              {t.admin.auth.roles.admin}
            </button>
          </div>
          <p className="text-[11px] text-[#8A775C] italic pt-0.5">
            {selectedRole === "super-admin"
              ? t.admin.auth.roles.superAdminDesc
              : t.admin.auth.roles.adminDesc}
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] text-xs font-semibold animate-in fade-in">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#1E1B18]">
              {t.admin.auth.emailLabel}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A775C]">
                <MailIcon className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.admin.auth.emailPlaceholder}
                className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-[#E5DDD2] bg-[#FAF7F2]/40 text-xs sm:text-sm text-[#1E1B18] placeholder-[#9E9080] focus:border-[#A12D3A] focus:ring-2 focus:ring-[#A12D3A]/15 focus:bg-white transition-all min-h-[44px]"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#1E1B18]">
                {t.admin.auth.passwordLabel}
              </label>
              <button
                type="button"
                onClick={onNavigateToForgotPassword}
                className="text-xs font-semibold text-[#A12D3A] hover:underline cursor-pointer"
              >
                {t.admin.auth.forgotPasswordLink}
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A775C]">
                <LockIcon className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.admin.auth.passwordPlaceholder}
                className="w-full h-11 pl-10 pr-10 rounded-xl border border-[#E5DDD2] bg-[#FAF7F2]/40 text-xs sm:text-sm text-[#1E1B18] placeholder-[#9E9080] focus:border-[#A12D3A] focus:ring-2 focus:ring-[#A12D3A]/15 focus:bg-white transition-all min-h-[44px]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8A775C] hover:text-[#1E1B18] transition-colors cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOffIcon className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="remember-me"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded text-[#A12D3A] focus:ring-[#A12D3A] border-[#CBD5E1] cursor-pointer"
            />
            <label
              htmlFor="remember-me"
              className="text-xs text-[#5C4C3E] font-medium cursor-pointer select-none"
            >
              {t.admin.auth.rememberMe}
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-xl bg-[#A12D3A] hover:bg-[#88222E] active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
          >
            {isLoading ? (
              <span>{t.admin.auth.signingIn}</span>
            ) : (
              <span>{t.admin.auth.signInButton}</span>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials Switcher */}
        <div className="pt-2 border-t border-[#E5DDD2] space-y-2">
          <div className="text-[11px] font-semibold text-[#8A775C] text-center">
            {t.admin.auth.quickDemoLabel}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill("super-admin")}
              className="px-2.5 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] hover:bg-white text-[11px] font-semibold text-[#423223] transition-colors cursor-pointer min-h-[40px]"
            >
              🔑 {t.admin.auth.quickFillSuperAdmin}
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill("admin")}
              className="px-2.5 py-2 rounded-lg border border-[#E5DDD2] bg-[#FAF7F2] hover:bg-white text-[11px] font-semibold text-[#423223] transition-colors cursor-pointer min-h-[40px]"
            >
              👤 {t.admin.auth.quickFillAdmin}
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-[11px] text-[#8A775C]">
        <span>{t.brand.copyright}</span>
      </div>
    </div>
  );
}
