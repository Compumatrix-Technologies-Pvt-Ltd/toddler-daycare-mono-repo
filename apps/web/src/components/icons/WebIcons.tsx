import React, { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement>;

export function GermanFlagIcon({ className = "w-4 h-3", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 640 480" className={className} aria-hidden="true" {...props}>
      <path fill="#000" d="M0 0h640v160H0z" />
      <path fill="#D00" d="M0 160h640v160H0z" />
      <path fill="#FFCE00" d="M0 320h640v160H0z" />
    </svg>
  );
}

export function UkFlagIcon({ className = "w-4 h-3", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 640 480" className={className} aria-hidden="true" {...props}>
      <path fill="#012169" d="M0 0h640v480H0z" />
      <path stroke="#FFF" strokeWidth="60" d="m0 0 640 480M640 0 0 480" />
      <path stroke="#C8102E" strokeWidth="40" d="m0 0 640 480M640 0 0 480" />
      <path stroke="#FFF" strokeWidth="100" d="M320 0v480M0 240h640" />
      <path stroke="#C8102E" strokeWidth="60" d="M320 0v480M0 240h640" />
    </svg>
  );
}

export function FemaleIcon({ className = "w-3.5 h-3.5", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <circle cx="12" cy="10" r="5" />
      <path d="M12 15v7M9 19h6" />
    </svg>
  );
}

export function MaleIcon({ className = "w-3.5 h-3.5", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <circle cx="10" cy="14" r="5" />
      <path d="M19 5l-5.4 5.4M19 5h-5M19 5v5" />
    </svg>
  );
}

export function PotIcon({ className = "w-3.5 h-3.5", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <path d="M2 12h20" />
      <path d="M20 12v6a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-6" />
      <path d="M9 4v4M15 4v4M4 8h16" />
    </svg>
  );
}

export function BoxIcon({ className = "w-3.5 h-3.5", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
    </svg>
  );
}

export function DogIcon({ className = "w-3.5 h-3.5", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 2.756 1.722.955 0 1.244-.57 1.244-1.222 0-1.5.5-2.5 1.5-2.5 1 0 1.5 1 1.5 2.5 0 2-2 4-2 7 0 2.5 1.5 4.5 4.5 4.5s4.5-2 4.5-4.5c0-1.5 1-2.5 2-2.5s2 1 2 2.5c0 2.5 1.5 4.5 4.5 4.5s4.5-2 4.5-4.5c0-3-2-5-2-7 0-1.5.5-2.5 1.5-2.5s1.5 1 1.5 2.5c0 .652.289 1.222 1.244 1.222C21.275 11.722 22.92 10.703 23 10c.113-.994-1.177-6.53-4-7-1.923-.321-3.5.782-3.5 2.172" />
    </svg>
  );
}

export function BanIcon({ className = "w-3.5 h-3.5", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  );
}

export function ClockIcon({ className = "w-3.5 h-3.5", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function BabyIcon({ className = "w-4 h-4", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M9 12h.01M15 12h.01" />
      <path d="M10 16c.5.5 1.5.5 2 0" />
      <path d="M12 4v-2" />
    </svg>
  );
}

export function CalendarIcon({ className = "w-4 h-4", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function SparklesIcon({ className = "w-4 h-4", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4M3 5h4M19 17v4M17 19h4" />
    </svg>
  );
}

export function UserIcon({ className = "w-4 h-4", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function MapPinIcon({ className = "w-4 h-4", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function MailIcon({ className = "w-4 h-4", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

export function PhoneIcon({ className = "w-3.5 h-3.5", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export function RefreshCwIcon({ className = "w-3.5 h-3.5", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}

export function InboxIcon({ className = "w-6 h-6", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

export function CloseIcon({ className = "w-3 h-3", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function CheckIcon({ className = "w-4 h-4", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function StarIcon({ className = "w-3.5 h-3.5", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className} aria-hidden="true" {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
