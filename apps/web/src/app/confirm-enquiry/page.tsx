"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { EnquiryConfirmation } from "../../components/EnquiryConfirmation";

function ConfirmEnquiryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refId = searchParams.get("ref") || undefined;
  const contacted = searchParams.get("contacted") || undefined;

  return (
    <EnquiryConfirmation
      referenceId={refId}
      caretakersContacted={contacted}
      onBackToSearch={() => router.push("/")}
      onViewFavorites={() => router.push("/favorites")}
    />
  );
}

export default function ConfirmEnquiryPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FCF9F8]">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center">
        <Suspense
          fallback={
            <div className="py-20 text-center text-sm text-[#7A6E62]">
              Loading confirmation...
            </div>
          }
        >
          <ConfirmEnquiryContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
