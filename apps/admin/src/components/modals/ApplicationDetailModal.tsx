import { CloseIcon, ShieldCheckIcon, BuildingIcon, CheckCircleIcon } from "../icons/AdminIcons";
import { DaycareApplication } from "../../types/admin";
import { useLanguage } from "../../context/LanguageContext";

interface ApplicationDetailModalProps {
  application: DaycareApplication | null;
  onClose: () => void;
  onApprove: (application: DaycareApplication) => void;
  onReject: (id: string) => void;
}

export function ApplicationDetailModal({
  application,
  onClose,
  onApprove,
  onReject,
}: ApplicationDetailModalProps) {
  const { t } = useLanguage();

  if (!application) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border border-[#E5DDD2] my-auto max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5DDD2] flex items-center justify-between bg-[#FAF7F2] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#E5DDD2] flex items-center justify-center text-[#A12D3A] shadow-2xs shrink-0">
              <BuildingIcon className="w-5 h-5 text-[#A12D3A]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#1E1B18] leading-tight truncate">
                {application.daycareName}
              </h2>
              <p className="text-xs text-[#7A6E62] truncate">
                {t.admin.dashboard.detailModal.title} • {application.caretakerName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[#7A6E62] hover:text-[#1E1B18] hover:bg-[#EFE7DC] transition-colors cursor-pointer shrink-0 ml-2"
            aria-label="Close modal"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-4 text-xs sm:text-sm text-[#1E1B18]">
          {/* Status Bar */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E5DDD2]">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#7A6E62]">
                {t.admin.dashboard.table.colStatus}
              </div>
              <div className="text-xs font-bold text-[#1E1B18] capitalize mt-0.5">
                {application.status}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#7A6E62]">
                {t.admin.dashboard.table.colSubmitted}
              </div>
              <div className="text-xs font-medium text-[#5C4C3E] mt-0.5">
                {application.submittedDate}
              </div>
            </div>
          </div>

          {/* Section: Official Permit */}
          <div className="space-y-2 p-4 rounded-xl border border-[#E5DDD2] bg-white">
            <div className="flex items-center gap-2 text-xs font-bold text-[#423223]">
              <ShieldCheckIcon className="w-4 h-4 text-[#16A34A]" />
              <span>{t.admin.dashboard.detailModal.permitDetails}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div>
                <span className="text-[#7A6E62] block text-[11px]">
                  {t.admin.dashboard.table.colPermit}
                </span>
                <span className="font-mono font-bold text-[#1E1B18] break-all">
                  {application.permitId || application.permitNumber}
                </span>
              </div>
              <div>
                <span className="text-[#7A6E62] block text-[11px]">
                  {t.admin.dashboard.detailModal.registeredCapacity}
                </span>
                <span className="font-bold text-[#1E1B18]">
                  {application.authorizedCapacity ?? application.capacity} {t.admin.dashboard.table.children}
                </span>
              </div>
              {application.registrationDate && (
                <div>
                  <span className="text-[#7A6E62] block text-[11px]">
                    {t.admin.dashboard.detailModal.registrationDate}
                  </span>
                  <span className="font-semibold text-[#1E1B18]">
                    {application.registrationDate}
                  </span>
                </div>
              )}
              {application.expirationDate && (
                <div>
                  <span className="text-[#7A6E62] block text-[11px]">
                    {t.admin.dashboard.detailModal.expirationDate}
                  </span>
                  <span className="font-semibold text-[#16A34A]">
                    {application.expirationDate}
                  </span>
                </div>
              )}
              {application.issuingAuthority && (
                <div>
                  <span className="text-[#7A6E62] block text-[11px]">
                    {t.admin.dashboard.detailModal.issuingAuthority}
                  </span>
                  <span className="font-semibold text-[#1E1B18]">
                    {application.issuingAuthority}
                  </span>
                </div>
              )}
              <div className="sm:col-span-2">
                <span className="text-[#7A6E62] block text-[11px]">
                  {t.admin.dashboard.table.colDistrict}
                </span>
                <span className="text-[#5C4C3E] break-words block">
                  {application.location}
                </span>
              </div>
              <div className="sm:col-span-2 pt-1">
                <span className="text-[#7A6E62] block text-[11px]">
                  {t.admin.dashboard.detailModal.areaClassification}
                </span>
                <div className="flex items-center gap-2.5 mt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      application.areaType === "rural"
                        ? "bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]"
                        : "bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        application.areaType === "rural" ? "bg-[#D97706]" : "bg-[#16A34A]"
                      }`}
                    />
                    {application.areaType === "rural"
                      ? t.admin.dashboard.table.ruralBadge.replace("{radius}", String(application.catchmentRadiusKm || 10))
                      : t.admin.dashboard.table.urbanBadge.replace("{radius}", String(application.catchmentRadiusKm || 3))}
                  </span>
                  <span className="text-[11px] text-[#7A6E62]">
                    {t.admin.dashboard.detailModal.osmSourceNotice}
                  </span>
                </div>
              </div>
              {application.adminNotes && (
                <div className="sm:col-span-2 pt-1">
                  <span className="text-[#7A6E62] block text-[11px]">
                    {t.admin.dashboard.detailModal.adminNotes}
                  </span>
                  <p className="text-[#4E443B] bg-[#FAF7F2] p-2.5 rounded-lg border border-[#E5DDD2] text-xs mt-1">
                    {application.adminNotes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section: Contact & Verification Documents */}
          <div className="space-y-2 p-4 rounded-xl border border-[#E5DDD2] bg-white">
            <h3 className="text-xs font-bold text-[#423223]">
              {t.admin.dashboard.detailModal.contactInfo}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div>
                <span className="text-[#7A6E62] block text-[11px]">
                  {t.admin.dashboard.detailModal.phone}
                </span>
                <span className="font-medium text-[#1E1B18]">{application.phone || "Not specified"}</span>
              </div>
              <div>
                <span className="text-[#7A6E62] block text-[11px]">
                  {t.admin.dashboard.detailModal.email}
                </span>
                <span className="font-medium text-[#1E1B18] truncate block">{application.email || "Not specified"}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[#7A6E62] block text-[11px]">
                  {t.admin.dashboard.detailModal.attachedDocuments}
                </span>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-1 rounded-lg bg-[#FAF7F2] border border-[#E5DDD2] text-xs font-semibold text-[#16A34A]">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>
                    {application.documentsCount} {t.admin.dashboard.detailModal.documentsCount}
                  </span>
                </div>
              </div>
              {application.workPermitUrl && (
                <a
                  href={application.workPermitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5DDD2] bg-[#FAF7F2] hover:bg-[#EFE7DC] text-xs font-semibold text-[#A12D3A] transition-colors"
                >
                  <span>{t.admin.dashboard.detailModal.viewPermitDoc}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-[#E5DDD2] bg-[#FAF7F2] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#E5DDD2] bg-white hover:bg-[#FAF7F2] text-xs font-semibold text-[#5C4C3E] transition-colors cursor-pointer min-h-[38px]"
          >
            {t.admin.dashboard.detailModal.close}
          </button>

          {application.status === "pending" && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onReject(application.id);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl border border-[#FCA5A5] text-[#DC2626] hover:bg-[#FEF2F2] font-semibold text-xs transition-colors cursor-pointer min-h-[38px]"
              >
                {t.admin.dashboard.table.reject}
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onApprove(application);
                }}
                className="px-4 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer min-h-[38px]"
              >
                {t.admin.dashboard.table.approve}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
