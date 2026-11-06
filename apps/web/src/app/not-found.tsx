import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF7F2] text-[#1E1B18] px-4 py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-[#FFF1F2] border border-[#FECDD3] flex items-center justify-center text-[#A12D3A] mb-5">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h1 className="text-[28px] sm:text-[34px] font-bold text-[#1E1B18] tracking-tight">
        404 - Seite nicht gefunden / Page not found
      </h1>
      <p className="mt-3 text-[15px] sm:text-[16px] text-[#7A6E62] max-w-md">
        Die von Ihnen gesuchte Seite existiert nicht oder wurde verschoben.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center justify-center min-h-[46px] px-6 rounded-xl bg-[#A12D3A] hover:bg-[#88222E] text-white font-semibold text-sm transition-all shadow-xs"
      >
        Zur Startseite / Return Home
      </Link>
    </div>
  );
}

