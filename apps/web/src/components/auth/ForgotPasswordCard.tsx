"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLanguage } from "../../i18n/LanguageContext";

export function ForgotPasswordCard() {
  const { t } = useLanguage();

  const [resetEmail, setResetEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState("");

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");

    if (!resetEmail || !/^\S+@\S+\.\S+$/.test(resetEmail)) {
      setResetError(t.forgotPasswordPage.invalidEmailError);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setResetSuccess(true);
    }, 600);
  };

  return (
    <div className="bg-white rounded-[24px] border border-[#E5DDD2] shadow-[0_4px_24px_rgba(0,0,0,0.04)] px-6 sm:px-8 py-7 sm:py-9 transition-all w-full">
      {resetSuccess ? (
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
            {t.forgotPasswordPage.successTitle}
          </h1>
          <p className="text-[14px] sm:text-[15px] text-[#7A6E62] leading-relaxed max-w-[340px] mx-auto">
            {t.forgotPasswordPage.successSubtitle}
          </p>
          <div className="pt-4 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                setResetSuccess(false);
                setResetEmail("");
              }}
              className="w-full h-[48px] rounded-xl bg-[#FAF7F2] hover:bg-[#F3ECE2] text-[#4B3E2F] font-semibold text-[15px] border border-[#E5DDD2] transition-colors cursor-pointer"
            >
              {t.forgotPasswordPage.sendResetLink}
            </button>
            <Link
              href="/login"
              className="w-full h-[48px] rounded-xl text-[#A12D3A] hover:text-[#88222E] font-semibold text-[15px] hover:underline underline-offset-2 transition-colors flex items-center justify-center cursor-pointer"
            >
              {t.forgotPasswordPage.backToLogin}
            </Link>
          </div>
        </div>
      ) : (
        /* Standard Forgot Password Form */
        <form onSubmit={handleResetSubmit} className="space-y-6">
          <div className="text-center space-y-2">
            <h1
              className="text-[26px] sm:text-[30px] font-bold text-[#1E1B18] tracking-tight"
              style={{ fontFamily: "var(--font-plus-jakarta)" }}
            >
              {t.forgotPasswordPage.title}
            </h1>
            <p className="text-[15px] sm:text-[16px] text-[#7A6E62] leading-relaxed max-w-[360px] mx-auto">
              {t.forgotPasswordPage.subtitle}
            </p>
          </div>

          <div className="space-y-1.5 pt-2">
            <label htmlFor="auth-reset-email" className="sr-only">
              {t.forgotPasswordPage.emailLabel}
            </label>
            <input
              id="auth-reset-email"
              type="email"
              value={resetEmail}
              onChange={(e) => {
                setResetEmail(e.target.value);
                if (resetError) setResetError("");
              }}
              placeholder={t.forgotPasswordPage.emailPlaceholder}
              autoComplete="email"
              required
              className={`w-full h-[50px] px-4 rounded-xl border bg-white text-[15px] text-[#1E1B18] placeholder:text-[#9E9284] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 transition-all ${
                resetError
                  ? "border-[#DC2626] focus:border-[#DC2626]"
                  : "border-[#E5DDD2] focus:border-[#F5A623]"
              }`}
            />
            {resetError && (
              <p className="text-xs text-[#DC2626] font-medium pt-1 px-1">
                {resetError}
              </p>
            )}
          </div>

          <button
            type="submit"
            id="auth-send-reset-btn"
            disabled={isSubmitting}
            className="w-full h-[50px] rounded-xl bg-[#F5A623] hover:bg-[#EAA000] active:scale-[0.99] text-[#1E1B18] font-bold text-[16px] shadow-[0_2px_8px_rgba(245,166,35,0.25)] hover:shadow-[0_4px_14px_rgba(245,166,35,0.35)] transition-all flex items-center justify-center cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            style={{ fontFamily: "var(--font-plus-jakarta)" }}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-[#1E1B18]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                {t.forgotPasswordPage.sendingResetLink}
              </span>
            ) : (
              t.forgotPasswordPage.sendResetLink
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
    </div>
  );
}
