"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isValidEmail, checkPasswordCriteria, isPasswordValid } from "@repo/shared";
import { useLanguage } from "../../i18n/LanguageContext";
import { caretakerApi } from "../../utils/caretakerApi";

type ResetStep = "email" | "reset" | "success";

export function ForgotPasswordCard() {
  const { t } = useLanguage();
  const router = useRouter();

  // Step state
  const [step, setStep] = useState<ResetStep>("email");

  // Form input states
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI interaction states
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Status & error states
  const [emailError, setEmailError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [generalSuccess, setGeneralSuccess] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // OTP input element references
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password criteria check
  const passwordCriteria = checkPasswordCriteria(newPassword);

  // Resend countdown timer effect
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Focus first OTP box when entering "reset" step
  useEffect(() => {
    if (step === "reset") {
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // Handle Step 1: Send 6-digit code to email
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setGeneralError("");
    setGeneralSuccess("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError(t.forgotPasswordPage.invalidEmailError);
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setEmailError(t.forgotPasswordPage.invalidEmailError);
      return;
    }

    try {
      setIsSubmitting(true);
      await caretakerApi.forgotPassword(trimmedEmail);
      setStep("reset");
      setResendTimer(60);
      setGeneralSuccess(t.forgotPasswordPage.codeSentSuccess);
    } catch (err: any) {
      setGeneralError(err.message || "Failed to dispatch verification code");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Resend Code
  const handleResendCode = async () => {
    if (resendTimer > 0 || isSubmitting) return;
    setGeneralError("");
    setGeneralSuccess("");

    try {
      setIsSubmitting(true);
      await caretakerApi.forgotPassword(email.trim());
      setResendTimer(60);
      setGeneralSuccess(t.forgotPasswordPage.codeSentSuccess);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 50);
    } catch (err: any) {
      setGeneralError(err.message || "Failed to resend verification code");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle single digit change in OTP boxes
  const handleOtpChange = (index: number, value: string) => {
    setOtpError("");
    setGeneralError("");

    // Accept only digits
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const nextOtp = [...otp];
      nextOtp[index] = "";
      setOtp(nextOtp);
      return;
    }

    // Handle single digit entry
    const char = cleaned.slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = char;
    setOtp(nextOtp);

    // Auto-advance focus to next input
    if (index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Handle Backspace navigation across OTP boxes
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        const nextOtp = [...otp];
        nextOtp[index - 1] = "";
        setOtp(nextOtp);
        otpRefs.current[index - 1]?.focus();
      }
    }
  };

  // Handle pasting full 6-digit code
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const nextOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      nextOtp[i] = pasted[i] || "";
    }
    setOtp(nextOtp);

    // Focus the box following the pasted characters
    const targetIdx = Math.min(pasted.length, 5);
    otpRefs.current[targetIdx]?.focus();
  };

  // Handle Step 2: Validate code, new password & confirmation
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setGeneralError("");
    setGeneralSuccess("");

    const fullCode = otp.join("");
    let hasError = false;

    // 1. Verify 6-digit numeric code
    if (fullCode.length !== 6 || !/^\d{6}$/.test(fullCode)) {
      setOtpError(t.forgotPasswordPage.codeInvalidError);
      hasError = true;
    }

    // 2. Validate new password specification (8+ characters, upper, lower, number, special)
    if (!newPassword) {
      setPasswordError(t.forgotPasswordPage.passwordSpecificationError);
      hasError = true;
    } else if (!isPasswordValid(newPassword)) {
      setPasswordError(t.forgotPasswordPage.passwordSpecificationError);
      hasError = true;
    }

    // 3. Confirm password match
    if (!confirmPassword) {
      setConfirmPasswordError(t.forgotPasswordPage.passwordMismatchError);
      hasError = true;
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError(t.forgotPasswordPage.passwordMismatchError);
      hasError = true;
    }

    if (hasError) return;

    try {
      setIsSubmitting(true);
      await caretakerApi.resetPassword(email.trim(), fullCode, newPassword);
      setStep("success");
    } catch (err: any) {
      setGeneralError(err.message || "Failed to reset password. Please check your 6-digit code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-[24px] border border-[#E5DDD2] shadow-[0_4px_24px_rgba(0,0,0,0.04)] px-6 sm:px-8 py-7 sm:py-9 transition-all w-full max-w-[480px] mx-auto">
      {/* ============================================================== */}
      {/* STEP 1: Enter Email & Request 6-Digit Code                     */}
      {/* ============================================================== */}
      {step === "email" && (
        <form onSubmit={handleRequestCode} className="space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF7F2] border border-[#E5DDD2] flex items-center justify-center text-[#A12D3A] mb-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1
              className="text-[24px] sm:text-[28px] font-bold text-[#1E1B18] tracking-tight"
              style={{ fontFamily: "var(--font-plus-jakarta)" }}
            >
              {t.forgotPasswordPage.step1Title}
            </h1>
            <p className="text-[14px] sm:text-[15px] text-[#7A6E62] leading-relaxed max-w-[360px] mx-auto">
              {t.forgotPasswordPage.step1Subtitle}
            </p>
          </div>

          {generalError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-[13px] flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{generalError}</span>
            </div>
          )}

          <div className="space-y-1.5 pt-1">
            <label htmlFor="auth-reset-email" className="block text-xs font-bold text-[#1E1B18] uppercase tracking-wider">
              {t.forgotPasswordPage.emailLabel}
            </label>
            <input
              id="auth-reset-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError("");
                if (generalError) setGeneralError("");
              }}
              placeholder={t.forgotPasswordPage.emailPlaceholder}
              autoComplete="email"
              required
              className={`w-full h-[50px] px-4 rounded-xl border bg-white text-[15px] text-[#1E1B18] placeholder:text-[#9E9284] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 transition-all ${
                emailError
                  ? "border-[#DC2626] focus:border-[#DC2626]"
                  : "border-[#E5DDD2] focus:border-[#F5A623]"
              }`}
            />
            {emailError && (
              <p className="text-xs text-[#DC2626] font-medium pt-1 px-1">
                {emailError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-[50px] rounded-xl bg-[#F5A623] hover:bg-[#EAA000] active:scale-[0.99] text-[#1E1B18] font-bold text-[16px] shadow-[0_2px_8px_rgba(245,166,35,0.25)] hover:shadow-[0_4px_14px_rgba(245,166,35,0.35)] transition-all flex items-center justify-center cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed min-h-[44px]"
            style={{ fontFamily: "var(--font-plus-jakarta)" }}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-[#1E1B18]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                {t.forgotPasswordPage.sendingCode}
              </span>
            ) : (
              t.forgotPasswordPage.sendCodeButton
            )}
          </button>

          <div className="text-center pt-1 text-[14px] sm:text-[15px] text-[#7A6E62]">
            <span>{t.forgotPasswordPage.rememberPassword} </span>
            <Link
              href="/login"
              className="font-semibold text-[#A12D3A] hover:text-[#88222E] underline underline-offset-2 transition-colors cursor-pointer"
            >
              {t.forgotPasswordPage.loginLink}
            </Link>
          </div>
        </form>
      )}

      {/* ============================================================== */}
      {/* STEP 2: Enter 6-Digit Code & Set New Password                  */}
      {/* ============================================================== */}
      {step === "reset" && (
        <form onSubmit={handleResetPassword} className="space-y-5">
          <div className="text-center space-y-1.5">
            <h1
              className="text-[22px] sm:text-[26px] font-bold text-[#1E1B18] tracking-tight"
              style={{ fontFamily: "var(--font-plus-jakarta)" }}
            >
              {t.forgotPasswordPage.step2Title}
            </h1>
            <p className="text-[13px] sm:text-[14px] text-[#7A6E62] leading-relaxed">
              {t.forgotPasswordPage.step2Subtitle.replace("{email}", email)}
            </p>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setGeneralError("");
                setGeneralSuccess("");
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#A12D3A] hover:text-[#88222E] hover:underline cursor-pointer pt-0.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span>{t.forgotPasswordPage.changeEmail}</span>
            </button>
          </div>

          {generalSuccess && (
            <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs sm:text-[13px] flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-green-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>{generalSuccess}</span>
            </div>
          )}

          {generalError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-[13px] flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{generalError}</span>
            </div>
          )}

          {/* 6-Digit Code Input Group */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#1E1B18] uppercase tracking-wider">
                {t.forgotPasswordPage.codeLabel}
              </label>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendTimer > 0 || isSubmitting}
                className="text-[12px] font-semibold text-[#A12D3A] hover:text-[#88222E] disabled:text-[#9E9284] disabled:cursor-not-allowed hover:underline cursor-pointer"
              >
                {resendTimer > 0
                  ? t.forgotPasswordPage.resendIn.replace("{seconds}", String(resendTimer))
                  : t.forgotPasswordPage.resendCode}
              </button>
            </div>

            <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    otpRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={handleOtpPaste}
                  className={`w-full h-[52px] text-center text-[20px] font-bold text-[#1E1B18] rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 transition-all ${
                    otpError
                      ? "border-[#DC2626] focus:border-[#DC2626]"
                      : digit
                        ? "border-[#15803D] bg-[#F0FDF4]/30"
                        : "border-[#E5DDD2] focus:border-[#F5A623]"
                  }`}
                />
              ))}
            </div>
            {otpError && (
              <p className="text-xs text-[#DC2626] font-medium pt-0.5 px-1">
                {otpError}
              </p>
            )}
          </div>

          {/* New Password Field */}
          <div className="space-y-1.5 pt-1">
            <label
              htmlFor="auth-new-password"
              className="block text-xs font-bold text-[#1E1B18] uppercase tracking-wider"
            >
              {t.forgotPasswordPage.newPasswordLabel}
            </label>
            <div className="relative">
              <input
                id="auth-new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (passwordError) setPasswordError("");
                }}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                placeholder={t.forgotPasswordPage.newPasswordPlaceholder}
                autoComplete="new-password"
                required
                className={`w-full h-[48px] px-4 pr-11 rounded-xl border bg-white text-[15px] text-[#1E1B18] placeholder:text-[#9E9284] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 transition-all ${
                  passwordError
                    ? "border-[#DC2626] focus:border-[#DC2626]"
                    : "border-[#E5DDD2] focus:border-[#F5A623]"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6E62] hover:text-[#1E1B18] p-1 cursor-pointer"
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {passwordError && (
              <p className="text-xs text-[#DC2626] font-medium pt-0.5 px-1">
                {passwordError}
              </p>
            )}

            {/* Password Criteria Real-Time Checklist */}
            {(isPasswordFocused || newPassword.length > 0) && (
              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2] text-xs space-y-1.5 animate-in fade-in duration-150">
                <p className="font-bold text-[#1E1B18] text-[11px] uppercase tracking-wider mb-1">
                  {t.forgotPasswordPage.criteriaTitle}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                  <div className={`flex items-center gap-1.5 ${passwordCriteria.minLength ? "text-[#15803D] font-semibold" : "text-[#7A6E62]"}`}>
                    <span>{passwordCriteria.minLength ? "✓" : "○"}</span>
                    <span>{t.forgotPasswordPage.critMinLength}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordCriteria.hasUpper ? "text-[#15803D] font-semibold" : "text-[#7A6E62]"}`}>
                    <span>{passwordCriteria.hasUpper ? "✓" : "○"}</span>
                    <span>{t.forgotPasswordPage.critUpper}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordCriteria.hasLower ? "text-[#15803D] font-semibold" : "text-[#7A6E62]"}`}>
                    <span>{passwordCriteria.hasLower ? "✓" : "○"}</span>
                    <span>{t.forgotPasswordPage.critLower}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordCriteria.hasNumber ? "text-[#15803D] font-semibold" : "text-[#7A6E62]"}`}>
                    <span>{passwordCriteria.hasNumber ? "✓" : "○"}</span>
                    <span>{t.forgotPasswordPage.critNumber}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 sm:col-span-2 ${passwordCriteria.hasSpecial ? "text-[#15803D] font-semibold" : "text-[#7A6E62]"}`}>
                    <span>{passwordCriteria.hasSpecial ? "✓" : "○"}</span>
                    <span>{t.forgotPasswordPage.critSpecial}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="auth-confirm-password"
              className="block text-xs font-bold text-[#1E1B18] uppercase tracking-wider"
            >
              {t.forgotPasswordPage.confirmPasswordLabel}
            </label>
            <div className="relative">
              <input
                id="auth-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (confirmPasswordError) setConfirmPasswordError("");
                }}
                placeholder={t.forgotPasswordPage.confirmPasswordPlaceholder}
                autoComplete="new-password"
                required
                className={`w-full h-[48px] px-4 pr-11 rounded-xl border bg-white text-[15px] text-[#1E1B18] placeholder:text-[#9E9284] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 transition-all ${
                  confirmPasswordError
                    ? "border-[#DC2626] focus:border-[#DC2626]"
                    : "border-[#E5DDD2] focus:border-[#F5A623]"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6E62] hover:text-[#1E1B18] p-1 cursor-pointer"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {confirmPasswordError && (
              <p className="text-xs text-[#DC2626] font-medium pt-0.5 px-1">
                {confirmPasswordError}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-[50px] rounded-xl bg-[#F5A623] hover:bg-[#EAA000] active:scale-[0.99] text-[#1E1B18] font-bold text-[16px] shadow-[0_2px_8px_rgba(245,166,35,0.25)] hover:shadow-[0_4px_14px_rgba(245,166,35,0.35)] transition-all flex items-center justify-center cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed min-h-[44px]"
            style={{ fontFamily: "var(--font-plus-jakarta)" }}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-[#1E1B18]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                {t.forgotPasswordPage.resettingPasswordButton}
              </span>
            ) : (
              t.forgotPasswordPage.resetPasswordButton
            )}
          </button>

          <div className="text-center pt-1 text-[13px] text-[#7A6E62]">
            <Link
              href="/login"
              className="font-semibold text-[#A12D3A] hover:text-[#88222E] underline underline-offset-2 transition-colors cursor-pointer"
            >
              {t.forgotPasswordPage.backToLogin}
            </Link>
          </div>
        </form>
      )}

      {/* ============================================================== */}
      {/* STEP 3: Success Confirmation Screen                            */}
      {/* ============================================================== */}
      {step === "success" && (
        <div className="text-center space-y-4 py-2">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center text-[#16A34A] animate-in zoom-in-95">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1
            className="text-[24px] sm:text-[28px] font-bold text-[#1E1B18] tracking-tight"
            style={{ fontFamily: "var(--font-plus-jakarta)" }}
          >
            {t.forgotPasswordPage.resetSuccessTitle}
          </h1>
          <p className="text-[14px] sm:text-[15px] text-[#7A6E62] leading-relaxed max-w-[340px] mx-auto">
            {t.forgotPasswordPage.resetSuccessSubtitle}
          </p>
          <div className="pt-4">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="w-full h-[50px] rounded-xl bg-[#F5A623] hover:bg-[#EAA000] text-[#1E1B18] font-bold text-[16px] shadow-[0_2px_8px_rgba(245,166,35,0.25)] hover:shadow-[0_4px_14px_rgba(245,166,35,0.35)] transition-all flex items-center justify-center cursor-pointer min-h-[44px]"
              style={{ fontFamily: "var(--font-plus-jakarta)" }}
            >
              {t.forgotPasswordPage.loginNowButton}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
