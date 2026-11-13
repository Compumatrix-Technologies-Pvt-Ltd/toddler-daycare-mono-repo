import { useState, type FormEvent } from "react";
import {
  BrandSunIcon,
  MailIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  KeyIcon,
  GermanFlagIcon,
  UkFlagIcon,
} from "../icons/AdminIcons";
import { useLanguage } from "../../context/LanguageContext";

interface AdminForgotPasswordProps {
  onBackToLogin: () => void;
}

export function AdminForgotPassword({
  onBackToLogin,
}: AdminForgotPasswordProps) {
  const { t, language, toggleLanguage } = useLanguage();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage(t.admin.auth.errors.emailRequired);
      return;
    }

    setIsLoading(true);

    // Simulate sending password reset link via Laravel REST endpoint: /api/v1/auth/forgot-password
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 600);
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
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md mx-auto my-5 sm:my-8 bg-white rounded-2xl border border-[#E5DDD2] shadow-sm p-5 sm:p-8 space-y-5 sm:space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {!isSubmitted ? (
          <>
            {/* Header */}
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FAF7F2] border border-[#E5DDD2] text-[#A12D3A] shadow-2xs mx-auto mb-1">
                <KeyIcon className="w-6 h-6 text-[#A12D3A]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#1E1B18] tracking-tight">
                {t.admin.auth.forgotPasswordTitle}
              </h1>
              <p className="text-xs sm:text-[13px] text-[#7A6E62] leading-snug">
                {t.admin.auth.forgotPasswordSubtitle}
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl bg-[#A12D3A] hover:bg-[#88222E] active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
              >
                {isLoading ? (
                  <span>{t.admin.auth.sendingReset}</span>
                ) : (
                  <span>{t.admin.auth.sendResetButton}</span>
                )}
              </button>
            </form>
          </>
        ) : (
          /* Confirmation State */
          <div className="text-center space-y-4 py-2 animate-in fade-in">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#DCFCE7] border border-[#BBF7D0] text-[#166534] shadow-2xs mx-auto">
              <CheckCircleIcon className="w-8 h-8 text-[#16A34A]" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg sm:text-xl font-bold text-[#1E1B18]">
                {t.admin.auth.resetSentTitle}
              </h2>
              <p className="text-xs sm:text-[13px] text-[#5C4C3E] leading-relaxed">
                {t.admin.auth.resetSentDesc.replace("{email}", email)}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(false);
                  setIsLoading(false);
                }}
                className="text-xs font-semibold text-[#A12D3A] hover:underline cursor-pointer min-h-[40px] inline-flex items-center"
              >
                {t.admin.auth.resendLink}
              </button>
            </div>
          </div>
        )}

        {/* Back to Sign In Action */}
        <div className="pt-2 border-t border-[#E5DDD2] text-center">
          <button
            type="button"
            onClick={onBackToLogin}
            className="inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-[#5C4C3E] hover:text-[#A12D3A] transition-colors cursor-pointer py-1 min-h-[44px]"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>{t.admin.auth.backToLogin}</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-[11px] text-[#8A775C]">
        <span>{t.brand.copyright}</span>
      </div>
    </div>
  );
}
