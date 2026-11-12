import { LogoutIcon, CloseIcon } from "../icons/AdminIcons";
import { useLanguage } from "../../context/LanguageContext";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-white rounded-2xl shadow-xl border border-[#E5DDD2] p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center text-[#7A6E62] hover:text-[#1E1B18] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <CloseIcon className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#FEE2E2] flex items-center justify-center text-[#DC2626] shrink-0">
            <LogoutIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#1E1B18]">
              {t.admin.logoutModal.title}
            </h2>
            <p className="text-xs text-[#7A6E62]">
              {t.admin.logoutModal.subtitle}
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#5C4C3E] leading-relaxed">
          {t.admin.logoutModal.description}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#E5DDD2] bg-white hover:bg-[#FAF7F2] text-xs sm:text-sm font-semibold text-[#5C4C3E] transition-all cursor-pointer min-h-[44px]"
          >
            {t.admin.logoutModal.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-xs sm:text-sm font-semibold text-white shadow-xs transition-all cursor-pointer min-h-[44px]"
          >
            {t.admin.logoutModal.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
