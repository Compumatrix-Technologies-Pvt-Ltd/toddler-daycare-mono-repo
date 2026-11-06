"use client";

import React, { useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";

const inputClass =
  "w-full min-h-[42px] rounded-xl border border-[#D9CDBB] bg-white px-4 py-3 text-[14px] sm:text-[15px] text-[#1E1B18] placeholder:text-[#8A7D6E] outline-none focus:border-[#A12D3A] focus:ring-2 focus:ring-[#A12D3A]/15 transition-all";

export function ContactFormCard() {
  const { t } = useLanguage();
  const content = t.contactPage;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError(content.requiredError);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(content.emailError);
      return;
    }
    setSending(true);
    window.setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 700);
  };

  return (
    <div className="w-full max-w-[560px] mx-auto bg-white rounded-3xl border border-[#D9CDBB] px-5 sm:px-8 lg:px-9 py-6 sm:py-8 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <h1 className="text-center font-bold text-[#1E1B18] tracking-tight text-[24px] sm:text-[30px] leading-tight">
        {sent ? content.successTitle : content.title}
      </h1>
      <p className="mt-3 text-center text-[#5C5043] text-[14px] sm:text-[16px] leading-relaxed max-w-[440px] mx-auto">
        {sent ? content.successMessage : content.subtitle}
      </p>

      {sent ? (
        <div className="mt-8 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] px-5 py-5 text-center">
          <p className="text-[14px] sm:text-[15px] text-[#15803D] font-medium leading-relaxed">
            {content.successMessage}
          </p>
          <p className="mt-3 text-[13px] sm:text-sm text-[#5C5043]">
            {content.directPrefix}{" "}
            <a
              href={`mailto:${content.supportEmail}`}
              className="text-[#A12D3A] font-semibold underline underline-offset-2 hover:text-[#88222E] break-all"
            >
              {content.supportEmail}
            </a>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-7 space-y-4 sm:space-y-5" noValidate>
          <div>
            <label htmlFor="contact-name" className="sr-only">
              {content.fullNamePlaceholder}
            </label>
            <input
              id="contact-name"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={content.fullNamePlaceholder}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="contact-email" className="sr-only">
              {content.emailPlaceholder}
            </label>
            <input
              id="contact-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={content.emailPlaceholder}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="contact-subject" className="sr-only">
              {content.subjectPlaceholder}
            </label>
            <input
              id="contact-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={content.subjectPlaceholder}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="contact-message" className="sr-only">
              {content.messagePlaceholder}
            </label>
            <textarea
              id="contact-message"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={content.messagePlaceholder}
              className={`${inputClass} min-h-[140px] resize-y leading-relaxed`}
            />
          </div>

          {error && (
            <p role="alert" className="text-[13px] sm:text-sm font-medium text-[#A12D3A]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={sending}
            className="w-full inline-flex items-center justify-center min-h-[52px] rounded-xl bg-[#F5B301] hover:bg-[#E0A400] disabled:opacity-70 disabled:cursor-wait active:scale-[0.99] transition-all text-[#5A3E00] font-bold text-[16px] sm:text-[18px] tracking-tight"
          >
            {sending ? content.sendingButton : content.submitButton}
          </button>

          <p className="pt-1 text-center text-[13px] sm:text-[15px] text-[#5C5043] leading-relaxed">
            {content.directPrefix}{" "}
            <a
              href={`mailto:${content.supportEmail}`}
              className="text-[#A12D3A] font-semibold underline underline-offset-2 hover:text-[#88222E] break-all"
            >
              {content.supportEmail}
            </a>
          </p>
        </form>
      )}
    </div>
  );
}
