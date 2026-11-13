"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { caretakerApi } from "../../utils/caretakerApi";

export default function CaretakerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      const token = caretakerApi.getToken();

      if (!token) {
        if (isMounted) {
          setIsAuthenticated(false);
          router.replace("/login");
        }
        return;
      }

      try {
        await caretakerApi.verifyToken(token);
        if (isMounted) {
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.warn("Caretaker session verification failed:", err);
        caretakerApi.logout();
        if (isMounted) {
          setIsAuthenticated(false);
          router.replace("/login");
        }
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  // While checking authentication or redirecting, show loading state to prevent flash of content
  if (isAuthenticated === null || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#E5DDD2] border-t-[#A12D3A] rounded-full animate-spin" />
          <p className="text-xs sm:text-sm font-medium text-[#7A6E62] tracking-wide">
            Verifying session...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

