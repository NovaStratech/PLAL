'use client';

export function VersionBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-trust-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-trust-700 ${className}`}
    >
      V2.0
    </span>
  );
}
