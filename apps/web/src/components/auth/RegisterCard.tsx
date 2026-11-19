"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isValidEmail, checkPasswordCriteria, isPasswordValid } from "@repo/shared";
import { useLanguage } from "../../i18n/LanguageContext";
import { useCaretaker } from "../../context/CaretakerContext";
import { caretakerApi } from "../../utils/caretakerApi";

export function RegisterCard() {
  const { t } = useLanguage();
  const router = useRouter();
  const { resetProfile } = useCaretaker();

  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [registerError, setRegisterError] = useState("");

  const [isRegistering, setIsRegistering] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const passwordCriteria = checkPasswordCriteria(registerPassword);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");

    let hasError = false;
    const trimmedEmail = registerEmail.trim();

    // 1. Email validation: required & RFC-compliant format
    if (!trimmedEmail) {
      setEmailError(t.registerPage.emailRequiredError);
      hasError = true;
    } else if (!isValidEmail(trimmedEmail)) {
      setEmailError(t.registerPage.invalidEmailError);
      hasError = true;
    } else {
      setEmailError("");
    }

    // 2. Password validation: required, 8+ characters & full security specifications
    if (!registerPassword) {
      setPasswordError(t.registerPage.passwordLengthError);
      hasError = true;
    } else if (!passwordCriteria.minLength) {
      setPasswordError(t.registerPage.passwordLengthError);
      hasError = true;
    } else if (!isPasswordValid(registerPassword)) {
      setPasswordError(t.registerPage.passwordSpecificationError);
      hasError = true;
    } else {
      setPasswordError("");
    }

    // 3. Confirm password validation
    if (!confirmPassword) {
      setConfirmPasswordError(t.registerPage.passwordMismatchError);
      hasError = true;
    } else if (registerPassword !== confirmPassword) {
      setConfirmPasswordError(t.registerPage.passwordMismatchError);
      hasError = true;
    } else {
      setConfirmPasswordError("");
    }

    if (hasError) {
      return;
    }

    setIsRegistering(true);
    try {
      await caretakerApi.register(trimmedEmail, registerPassword);
      setRegisterSuccess(true);
      // Ensure newly registered caretaker starts with a completely empty profile form
      resetProfile({
        email: trimmedEmail,
        isRegistered: true,
        approvalStatus: "pending",
      });
      // Redirect to Caretaker Profile setup
      setTimeout(() => {
        router.push("/caretaker/profile");
      }, 800);
    } catch (error: any) {
      setRegisterError(error.message || t.registerPage.registrationFailedError);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="bg-white rounded-[24px] border border-[#E5DDD2] shadow-[0_4px_24px_rgba(0,0,0,0.04)] px-6 sm:px-8 py-7 sm:py-9 transition-all w-full">
      {registerSuccess ? (
        /* Success State */
        <div className="text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center text-[#16A34A]">
            <svg
              className="w-7 h-7"
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
            {t.registerPage.successTitle}
          </h1>
          <p className="text-[14px] sm:text-[15px] text-[#7A6E62] leading-relaxed max-w-[340px] mx-auto">
            {t.registerPage.successSubtitle}
          </p>
          <div className="pt-4">
            <button
              type="button"
              onClick={() => router.push("/caretaker/profile")}
              className="w-full h-[50px] rounded-xl bg-[#F5A623] hover:bg-[#EAA000] text-[#1E1B18] font-bold text-[16px] shadow-[0_2px_8px_rgba(245,166,35,0.25)] transition-all flex items-center justify-center cursor-pointer"
              style={{ fontFamily: "var(--font-plus-jakarta)" }}
            >
              {t.caretakerProfile.pageTitle}
            </button>
          </div>
        </div>
      ) : (
        /* Standard Register Form */
        <form onSubmit={handleRegisterSubmit} noValidate className="space-y-4">
          {/* Title & Subtitle */}
          <div className="text-center space-y-2">
            <h1
              className="text-[26px] sm:text-[30px] font-bold text-[#1E1B18] tracking-tight"
              style={{ fontFamily: "var(--font-plus-jakarta)" }}
            >
              {t.registerPage.title}
            </h1>
            <p className="text-[14px] sm:text-[15px] text-[#7A6E62] leading-snug max-w-[380px] mx-auto">
              {t.registerPage.subtitle}
            </p>
          </div>

          {/* Form Inputs Container */}
          <div className="space-y-3 pt-2">
            {/* Field 1: Email (Username) */}
            <div>
              <label htmlFor="auth-register-email" className="sr-only">
                {t.registerPage.emailLabel}
              </label>
              <input
                id="auth-register-email"
                type="email"
                value={registerEmail}
                onChange={(e) => {
                  setRegisterEmail(e.target.value);
                  if (emailError) setEmailError("");
                  if (registerError) setRegisterError("");
                }}
                placeholder={t.registerPage.emailPlaceholder}
                autoComplete="email"
                className={`w-full h-[50px] px-4 rounded-xl border bg-[#FAF8F5]/60 text-[15px] text-[#1E1B18] placeholder:text-[#9E9284] focus:outline-none transition-all ${emailError
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

            {/* Field 2: Password */}
            <div>
              <div className="relative">
                <label htmlFor="auth-register-password" className="sr-only">
                  {t.registerPage.passwordLabel}
                </label>
                <input
                  id="auth-register-password"
                  type={showRegisterPassword ? "text" : "password"}
                  value={registerPassword}
                  onChange={(e) => {
                    setRegisterPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                    if (registerError) setRegisterError("");
                  }}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  placeholder={t.registerPage.passwordPlaceholder}
                  autoComplete="new-password"
                  className={`w-full h-[50px] px-4 pr-12 rounded-xl border bg-[#FAF8F5]/60 text-[15px] text-[#1E1B18] placeholder:text-[#9E9284] focus:outline-none transition-all ${passwordError
                      ? "border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626]"
                      : "border-[#E5DDD2] focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623]"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#9A8E80] hover:text-[#5C5043] transition-colors cursor-pointer"
                  aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showRegisterPassword ? (
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

              {/* Password Specification Checklist Indicator */}
              {(registerPassword.length > 0 || isPasswordFocused) && (
                <div className="mt-2 p-3 rounded-xl bg-[#FAF8F5] border border-[#E5DDD2] text-[12px] space-y-1.5 animate-in fade-in">
                  <p className="font-semibold text-[#4B3E2F] text-[11px] uppercase tracking-wider">
                    {t.registerPage.passwordCriteriaTitle}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {/* 8+ Characters */}
                    <div
                      className={`flex items-center gap-1.5 transition-colors ${passwordCriteria.minLength ? "text-[#16A34A] font-medium" : "text-[#7A6E62]"
                        }`}
                    >
                      {passwordCriteria.minLength ? (
                        <svg className="w-3.5 h-3.5 shrink-0 text-[#16A34A]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D5C9B8] ml-1 mr-1 shrink-0" />
                      )}
                      <span>{t.registerPage.passwordCriteriaMinLength}</span>
                    </div>

                    {/* Uppercase Letter */}
                    <div
                      className={`flex items-center gap-1.5 transition-colors ${passwordCriteria.hasUpper ? "text-[#16A34A] font-medium" : "text-[#7A6E62]"
                        }`}
                    >
                      {passwordCriteria.hasUpper ? (
                        <svg className="w-3.5 h-3.5 shrink-0 text-[#16A34A]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D5C9B8] ml-1 mr-1 shrink-0" />
                      )}
                      <span>{t.registerPage.passwordCriteriaUppercase}</span>
                    </div>

                    {/* Lowercase Letter */}
                    <div
                      className={`flex items-center gap-1.5 transition-colors ${passwordCriteria.hasLower ? "text-[#16A34A] font-medium" : "text-[#7A6E62]"
                        }`}
                    >
                      {passwordCriteria.hasLower ? (
                        <svg className="w-3.5 h-3.5 shrink-0 text-[#16A34A]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D5C9B8] ml-1 mr-1 shrink-0" />
                      )}
                      <span>{t.registerPage.passwordCriteriaLowercase}</span>
                    </div>

                    {/* Number */}
                    <div
                      className={`flex items-center gap-1.5 transition-colors ${passwordCriteria.hasNumber ? "text-[#16A34A] font-medium" : "text-[#7A6E62]"
                        }`}
                    >
                      {passwordCriteria.hasNumber ? (
                        <svg className="w-3.5 h-3.5 shrink-0 text-[#16A34A]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D5C9B8] ml-1 mr-1 shrink-0" />
                      )}
                      <span>{t.registerPage.passwordCriteriaNumber}</span>
                    </div>

                    {/* Special Character */}
                    <div
                      className={`flex items-center gap-1.5 sm:col-span-2 transition-colors ${passwordCriteria.hasSpecial ? "text-[#16A34A] font-medium" : "text-[#7A6E62]"
                        }`}
                    >
                      {passwordCriteria.hasSpecial ? (
                        <svg className="w-3.5 h-3.5 shrink-0 text-[#16A34A]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D5C9B8] ml-1 mr-1 shrink-0" />
                      )}
                      <span>{t.registerPage.passwordCriteriaSpecial}</span>
                    </div>
                  </div>
                </div>
              )}

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

            {/* Field 3: Confirm Password */}
            <div>
              <div className="relative">
                <label htmlFor="auth-register-confirm-password" className="sr-only">
                  {t.registerPage.confirmPasswordLabel}
                </label>
                <input
                  id="auth-register-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (confirmPasswordError) setConfirmPasswordError("");
                    if (registerError) setRegisterError("");
                  }}
                  placeholder={t.registerPage.confirmPasswordPlaceholder}
                  autoComplete="new-password"
                  className={`w-full h-[50px] px-4 pr-12 rounded-xl border bg-[#FAF8F5]/60 text-[15px] text-[#1E1B18] placeholder:text-[#9E9284] focus:outline-none transition-all ${confirmPasswordError
                      ? "border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626]"
                      : "border-[#E5DDD2] focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623]"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#9A8E80] hover:text-[#5C5043] transition-colors cursor-pointer"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
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
              {confirmPasswordError && (
                <p className="text-[12px] text-[#DC2626] font-medium mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {confirmPasswordError}
                </p>
              )}
            </div>

            {registerError && (
              <div className="p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#9F1239] text-[13px] flex items-center gap-2 animate-in fade-in">
                <svg className="w-4 h-4 shrink-0 text-[#E11D48]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{registerError}</span>
              </div>
            )}
          </div>

          {/* Primary CTA Button: Jetzt registrieren */}
          <button
            type="submit"
            id="auth-register-submit-btn"
            disabled={isRegistering}
            className="w-full h-[50px] rounded-xl bg-[#F5A623] hover:bg-[#EAA000] active:scale-[0.99] text-[#1E1B18] font-bold text-[16px] shadow-[0_2px_8px_rgba(245,166,35,0.25)] hover:shadow-[0_4px_14px_rgba(245,166,35,0.35)] transition-all flex items-center justify-center cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            style={{ fontFamily: "var(--font-plus-jakarta)" }}
          >
            {isRegistering ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-[#1E1B18]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                {t.registerPage.registeringButton}
              </span>
            ) : (
              t.registerPage.registerButton
            )}
          </button>

          {/* Bottom Link */}
          <div className="text-center pt-2 text-[14px] sm:text-[15px] text-[#7A6E62]">
            <span>{t.registerPage.hasAccount} </span>
            <Link
              href="/login"
              className="font-semibold text-[#A12D3A] hover:text-[#88222E] underline underline-offset-2 transition-colors cursor-pointer"
            >
              {t.registerPage.loginLink}
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
