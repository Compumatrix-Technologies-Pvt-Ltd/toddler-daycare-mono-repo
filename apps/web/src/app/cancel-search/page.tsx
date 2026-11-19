"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { useLanguage } from "../../i18n/LanguageContext";
import { cancelSearchHistoryApi } from "../../utils/inquery";

function CancelSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const refParam = searchParams.get("ref") || searchParams.get("referenceId") || "";
  const emailParam = searchParams.get("email") || "";
  const statusParam = searchParams.get("status") || "";

  const [loading, setLoading] = useState<boolean>(statusParam !== "deleted" && Boolean(refParam || emailParam));
  const [success, setSuccess] = useState<boolean>(statusParam === "deleted");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [deletedCount, setDeletedCount] = useState<number>(0);

  useEffect(() => {
    if (statusParam === "deleted") {
      setSuccess(true);
      setLoading(false);
      return;
    }

    if (!refParam && !emailParam) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function executeCancellation() {
      try {
        setLoading(true);
        setErrorMessage("");
        const res = await cancelSearchHistoryApi({
          referenceId: refParam || undefined,
          email: emailParam || undefined,
        });
        if (isMounted) {
          setSuccess(true);
          setDeletedCount(res?.data?.deletedCount ?? 1);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("[CancelSearch] Error executing cancellation:", err);
          setErrorMessage(err.message || t.cancelSearch.errorDescription);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    executeCancellation();

    return () => {
      isMounted = false;
    };
  }, [refParam, emailParam, statusParam, t.cancelSearch.errorDescription]);

  const handleManualRetry = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const res = await cancelSearchHistoryApi({
        referenceId: refParam || undefined,
        email: emailParam || undefined,
      });
      setSuccess(true);
      setDeletedCount(res?.data?.deletedCount ?? 1);
    } catch (err: any) {
      setErrorMessage(err.message || t.cancelSearch.errorDescription);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-center items-center py-6 sm:py-10 px-4 sm:px-6">
      <div className="w-full max-w-[480px] bg-white rounded-2xl border border-[#D5C4AB] p-6 sm:p-8 shadow-[0px_12px_24px_0px_rgba(0,0,0,0.06)] space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Icon */}
        <div className="flex flex-col items-center text-center space-y-3">
          {loading ? (
            <div className="w-16 h-16 rounded-full bg-[#A12D3A]/10 text-[#A12D3A] flex items-center justify-center">
              <span className="w-8 h-8 border-3 border-[#A12D3A] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : success ? (
            <div className="w-16 h-16 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center shadow-xs">
              <svg
                className="w-9 h-9"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#DC2626]/10 text-[#DC2626] flex items-center justify-center shadow-xs">
              <svg
                className="w-9 h-9"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
          )}

          <h2 className="font-bold text-2xl sm:text-[26px] text-[#1B1C1C] leading-tight font-heading">
            {loading
              ? t.cancelSearch.loading
              : success
                ? t.cancelSearch.successTitle
                : t.cancelSearch.title}
          </h2>

          <p className="text-sm text-[#514532] leading-relaxed max-w-[400px]">
            {loading
              ? t.cancelSearch.subtitle
              : success
                ? t.cancelSearch.successDescription
                : errorMessage || t.cancelSearch.subtitle}
          </p>
        </div>

        {/* Details Card */}
        <div className="bg-[#FAF7F2] rounded-xl border border-[#E5DDD2] p-4 space-y-3 text-sm">
          {refParam && (
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-[#8C7C6D]">
                {t.cancelSearch.referenceLabel}
              </span>
              <span className="font-bold text-[#1B1C1C] font-mono">
                {refParam}
              </span>
            </div>
          )}

          {emailParam && (
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-[#8C7C6D]">
                {t.cancelSearch.emailLabel}
              </span>
              <span className="font-bold text-[#1B1C1C] truncate max-w-[220px]">
                {emailParam}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E5DDD2]">
            <span className="font-medium text-[#8C7C6D]">
              {t.cancelSearch.statusLabel}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                success
                  ? "bg-[#DCFCE7] text-[#166534]"
                  : loading
                    ? "bg-[#FEF3C7] text-[#92400E]"
                    : "bg-[#FEE2E2] text-[#991B1B]"
              }`}
            >
              {success ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                  <span>{t.cancelSearch.statusDeleted}</span>
                </>
              ) : loading ? (
                <span>{t.cancelSearch.loading}</span>
              ) : (
                <span>{t.cancelSearch.errorTitle}</span>
              )}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          {!success && !loading && (refParam || emailParam) && (
            <button
              type="button"
              onClick={handleManualRetry}
              className="w-full bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold text-sm py-3 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              <span>{t.cancelSearch.title}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full bg-[#A12D3A] hover:bg-[#88222E] text-white font-semibold text-sm py-3 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
          >
            <span>{t.cancelSearch.backToSearch}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CancelSearchPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FCF9F8]">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center">
        <Suspense
          fallback={
            <div className="py-20 text-center text-sm text-[#7A6E62]">
              Loading...
            </div>
          }
        >
          <CancelSearchContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
