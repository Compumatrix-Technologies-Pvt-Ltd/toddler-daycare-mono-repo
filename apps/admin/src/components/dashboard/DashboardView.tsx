import {
  BuildingIcon,
  UsersIcon,
  ShieldCheckIcon,
  ClockIcon,
} from "../icons/AdminIcons";
import { DaycareApplication } from "../../types/admin";
import { AdminDashboardStats } from "../../services/adminDaycareService";
import { useLanguage } from "../../context/LanguageContext";
import { DaycaresTableSection } from "./DaycaresTableSection";

interface DashboardViewProps {
  applications: DaycareApplication[];
  inquiriesCount?: number;
  stats?: AdminDashboardStats | null;
  isLoading?: boolean;
  onViewAllDaycares?: (() => void) | undefined;
  onRequestApprove: (application: DaycareApplication) => void;
  onReject: (id: string) => void;
  onOpenDetails: (application: DaycareApplication) => void;
}

export function DashboardView({
  applications,
  inquiriesCount = 0,
  stats,
  isLoading = false,
  onViewAllDaycares,
  onRequestApprove,
  onReject,
  onOpenDetails,
}: DashboardViewProps) {
  const { t } = useLanguage();

  const totalDaycaresCount = stats?.totalDaycares ?? applications.length;
  const pendingCount = stats?.pendingPermits ?? applications.filter((a) => a.status === "pending").length;
  const approvedCount = stats?.verifiedCaretakers ?? applications.filter((a) => a.status === "approved").length;
  const totalInquiries = stats?.demandInquiries ?? inquiriesCount;
  const totalCapacity = stats?.totalCapacity ?? applications.reduce((acc, curr) => acc + (curr.capacity || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="rounded-xl bg-gradient-to-r from-[#FAF7F2] via-white to-[#FAF7F2] border border-[#E5DDD2] p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg lg:text-xl font-extrabold text-[#1E1B18] tracking-tight">
                {t.admin.dashboard.welcome}
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#166534] text-[10px] font-bold uppercase tracking-wider shrink-0">
                {t.admin.dashboard.liveSystem}
              </span>
            </div>
            <p className="text-xs sm:text-[13px] text-[#7A6E62] leading-snug">
              {t.admin.dashboard.welcomeSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <span className="px-3 py-1.5 rounded-lg bg-white border border-[#E5DDD2] text-[11px] font-semibold text-[#5C4C3E] shadow-2xs whitespace-nowrap">
              {t.admin.regionNotice}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Overview Metrics Cards - Rule 3 exact scaling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Daycares */}
        <div className="bg-white rounded-xl border border-[#E5DDD2] p-3 sm:p-3.5 lg:p-4 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7A6E62] truncate">
              {t.admin.dashboard.kpi.totalDaycares}
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] border border-[#E5DDD2] flex items-center justify-center text-[#5C4C3E] shrink-0">
              <BuildingIcon className="w-4 h-4 text-[#8A775C]" />
            </div>
          </div>
          <div className="text-[18px] sm:text-[20px] xl:text-[22px] font-bold text-[#1E1B18] my-1 sm:my-1.5">
            {totalDaycaresCount}
          </div>
          <div className="text-[11px] font-medium text-[#16A34A] truncate">
            {totalDaycaresCount > 0 ? `${totalDaycaresCount} registered` : "No registered daycares"}
          </div>
        </div>

        {/* Pending Permits */}
        <div className="bg-white rounded-xl border border-[#E5DDD2] p-3 sm:p-3.5 lg:p-4 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7A6E62] truncate">
              {t.admin.dashboard.kpi.pendingPermits}
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#92400E] shrink-0">
              <ClockIcon className="w-4 h-4 text-[#D97706]" />
            </div>
          </div>
          <div className="text-[18px] sm:text-[20px] xl:text-[22px] font-bold text-[#D97706] my-1 sm:my-1.5">
            {pendingCount}
          </div>
          <div className="text-[11px] font-medium text-[#92400E] truncate">
            {pendingCount > 0 ? `${pendingCount} awaiting review` : "All reviewed"}
          </div>
        </div>

        {/* Verified Caretakers */}
        <div className="bg-white rounded-xl border border-[#E5DDD2] p-3 sm:p-3.5 lg:p-4 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7A6E62] truncate">
              {t.admin.dashboard.kpi.verifiedCaretakers}
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] border border-[#BBF7D0] flex items-center justify-center text-[#166534] shrink-0">
              <ShieldCheckIcon className="w-4 h-4 text-[#16A34A]" />
            </div>
          </div>
          <div className="text-[18px] sm:text-[20px] xl:text-[22px] font-bold text-[#16A34A] my-1 sm:my-1.5">
            {approvedCount}
          </div>
          <div className="text-[11px] font-medium text-[#16A34A] truncate">
            {approvedCount > 0 ? `${approvedCount} approved active` : "0 approved"}
          </div>
        </div>

        {/* Demand Inquiries */}
        <div className="bg-white rounded-xl border border-[#E5DDD2] p-3 sm:p-3.5 lg:p-4 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7A6E62] truncate">
              {t.admin.dashboard.kpi.demandInquiries}
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#1D4ED8] shrink-0">
              <UsersIcon className="w-4 h-4 text-[#2563EB]" />
            </div>
          </div>
          <div className="text-[18px] sm:text-[20px] xl:text-[22px] font-bold text-[#1E1B18] my-1 sm:my-1.5">
            {totalInquiries}
          </div>
          <div className="text-[11px] font-medium text-[#5C4C3E] truncate">
            {totalCapacity > 0
              ? `${totalCapacity} registered capacity spots`
              : "0 registered capacity spots"}
          </div>
        </div>
      </div>

      {/* Recent Caretakers / Daycares */}
      <DaycaresTableSection
        applications={applications}
        isLoading={isLoading}
        mode="recent"
        onViewAll={onViewAllDaycares}
        onRequestApprove={onRequestApprove}
        onReject={onReject}
        onOpenDetails={onOpenDetails}
      />
    </div>
  );
}
