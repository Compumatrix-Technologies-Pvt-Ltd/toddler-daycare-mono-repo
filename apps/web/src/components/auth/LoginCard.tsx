"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isValidEmail } from "@repo/shared";
import { useLanguage } from "../../i18n/LanguageContext";
import { useCaretaker } from "../../context/CaretakerContext";
import { caretakerApi } from "../../utils/caretakerApi";

export function LoginCard() {
  const { t } = useLanguage();
  const router = useRouter();
  const { resetProfile, refreshDaycare } = useCaretaker();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [notice, setNotice] = useState<{
    title: string;
    desc: string;
    type: "incomplete" | "awaiting" | "success";
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);

    const trimmedEmail = email.trim();
    let hasError = false;

    // Email validation: required & RFC-compliant email format
    if (!trimmedEmail) {
      setEmailError(t.loginPage.emailRequiredError);
      hasError = true;
    } else if (!isValidEmail(trimmedEmail)) {
      setEmailError(t.loginPage.invalidEmailError);
      hasError = true;
    } else {
      setEmailError("");
    }

    // Password validation: required & at least 8 characters
    if (!password) {
      setPasswordError(t.loginPage.passwordRequiredError);
      hasError = true;
    } else if (password.length < 8) {
      setPasswordError(t.loginPage.passwordLengthError);
      hasError = true;
    } else {
      setPasswordError("");
    }

    if (hasError) {
      return;
    }

    setIsLoading(true);

    try {
      // Call backend login API
      const loginData = await caretakerApi.login(trimmedEmail, password);
      resetProfile({ email: loginData.caretaker.email, isRegistered: true });
      await refreshDaycare();

      // Show success
      setNotice({
        title: t.loginPage.loginSuccessTitle,
        desc: t.caretakerProfile.loginNotice.loginSuccessMessage,
        type: "success",
      });

      const targetPath =
        loginData.daycareStatus === "approved"
          ? "/caretaker/dashboard"
          : "/caretaker/profile";

      // Navigate to caretaker profile setup or dashboard
      setTimeout(() => {
        router.push(targetPath);
      }, 700);
    } catch (error: any) {
      if (error?.code === "DAYCARE_UNDER_REVIEW" || error?.status === 403) {
        setNotice({
          title: t.caretakerProfile.loginNotice.underReviewLoginTitle,
          desc: t.caretakerProfile.loginNotice.underReviewLoginDesc,
          type: "awaiting",
        });
      } else {
        setNotice({
          title: t.loginPage.loginFailedTitle,
          desc: error.message || t.loginPage.invalidCredentialsError,
          type: "incomplete",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[24px] border border-[#E5DDD2] shadow-[0_4px_24px_rgba(0,0,0,0.04)] px-6 sm:px-8 py-7 sm:py-9 transition-all w-full">
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Title */}
        <div className="text-center space-y-2">
          <h1
            className="text-[26px] sm:text-[30px] font-bold text-[#1E1B18] tracking-tight"
            style={{ fontFamily: "var(--font-plus-jakarta)" }}
          >
            {t.loginPage.title}
          </h1>
          <p className="text-[14px] sm:text-[15px] text-[#7A6E62]">
            {t.loginPage.subtitle}
          </p>
        </div>

        {/* Dynamic Caretaker Redirect Notice */}
        {notice && (
          <div
            className={`p-4 rounded-xl border text-[13px] leading-relaxed flex items-start gap-3 animate-in fade-in ${
              notice.type === "success"
                ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#14532D]"
                : notice.type === "incomplete"
                  ? "bg-[#FFF1F2] border-[#FECDD3] text-[#9F1239]"
                  : "bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]"
            }`}
          >
            <span className="shrink-0 mt-0.5">
              {notice.type === "success" ? (
                <svg className="w-5 h-5 text-[#16A34A]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : notice.type === "incomplete" ? (
                <svg className="w-5 h-5 text-[#E11D48]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-[#D97706]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </span>
            <div>
              <p className="font-bold">{notice.title}</p>
              <p className="mt-0.5">{notice.desc}</p>
            </div>
          </div>
        )}

        {/* Email Field */}
        <div>
          <label htmlFor="auth-login-email" className="sr-only">
            {t.loginPage.emailLabel}
          </label>
          <input
            id="auth-login-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError("");
            }}
            placeholder={t.loginPage.emailPlaceholder}
            autoComplete="email"
            className={`w-full h-[50px] px-4 rounded-xl border bg-[#FAF8F5]/60 text-[15px] text-[#1E1B18] placeholder:text-[#9E9284] focus:outline-none transition-all ${
              emailError
                ? "border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626]"
                : "border-[#E5DDD2] focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623]"
            }`}
          />
          {emailError && (
            <p className="text-[12px] text-[#DC2626] font-medium mt-1.5 flex items-center gap-1.5 animate-in fade-in">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {emailError}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <div className="relative">
            <label htmlFor="auth-login-password" className="sr-only">
              {t.loginPage.passwordLabel}
            </label>
            <input
              id="auth-login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError("");
              }}
              placeholder={t.loginPage.passwordPlaceholder}
              autoComplete="current-password"
              className={`w-full h-[50px] px-4 pr-12 rounded-xl border bg-[#FAF8F5]/60 text-[15px] text-[#1E1B18] placeholder:text-[#9E9284] focus:outline-none transition-all ${
                passwordError
                  ? "border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626]"
                  : "border-[#E5DDD2] focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623]"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#9A8E80] hover:text-[#5C5043] transition-colors cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
          {passwordError && (
            <p className="text-[12px] text-[#DC2626] font-medium mt-1.5 flex items-center gap-1.5 animate-in fade-in">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {passwordError}
            </p>
          )}
        </div>

        {/* Remember Me + Forgot Password */}
        <div className="flex items-center justify-between">
          <label
            htmlFor="auth-remember-me"
            className="flex items-center gap-2.5 cursor-pointer select-none group min-h-[44px]"
          >
            <div className="relative">
              <input
                id="auth-remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="peer sr-only"
              />
              <div className="w-[18px] h-[18px] rounded-[4px] border-2 border-[#D5C8B8] bg-white peer-checked:bg-[#A12D3A] peer-checked:border-[#A12D3A] transition-all flex items-center justify-center">
                {rememberMe && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-[14px] text-[#4B3E2F] font-medium group-hover:text-[#1E1B18] transition-colors">
              {t.loginPage.rememberMe}
            </span>
          </label>

          <Link
            href="/forgot-password"
            className="text-[14px] font-semibold text-[#A12D3A] hover:text-[#88222E] transition-colors cursor-pointer min-h-[44px] flex items-center"
          >
            {t.loginPage.forgotPassword}
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          id="auth-login-submit-btn"
          disabled={isLoading}
          className="w-full h-[50px] rounded-xl bg-gradient-to-b from-[#F3A712] to-[#EAA000] hover:from-[#EAA000] hover:to-[#D89500] text-[#1E1B18] font-bold text-[16px] shadow-[0_2px_8px_rgba(234,160,0,0.25)] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          style={{ fontFamily: "var(--font-plus-jakarta)" }}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-[#1E1B18]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              {t.loginPage.loginButton}
            </span>
          ) : (
            t.loginPage.loginButton
          )}
        </button>

        {/* Register Link */}
        <p className="text-center text-[14px] text-[#7A6E62]">
          {t.loginPage.noAccount}{" "}
          <Link
            href="/register"
            className="font-semibold text-[#A12D3A] hover:text-[#88222E] underline underline-offset-2 transition-colors cursor-pointer"
          >
            {t.loginPage.becomeProvider}
          </Link>
        </p>
      </form>
    </div>
  );
}
