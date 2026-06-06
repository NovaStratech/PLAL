import { RelationalDistance, RELATIONAL_DISTANCE_LABELS } from '@plal/shared';

export function Avatar({
  firstName,
  lastName,
  photoUrl,
  size = 44,
  className = '',
  onClick,
}: {
  firstName: string;
  lastName?: string | null;
  photoUrl?: string | null;
  size?: number;
  className?: string;
  onClick?: () => void;
}) {
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
  const classes = `rounded-full object-cover shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`;

  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={photoUrl}
        alt={firstName}
        width={size}
        height={size}
        className={classes}
        style={{ width: size, height: size }}
        onClick={onClick}
      />
    );
  }
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center justify-center rounded-full bg-trust-100 font-semibold text-trust-700 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38, minWidth: size }}
      disabled={!onClick}
    >
      {initials || '?'}
    </button>
  );
}

export function DistanceBadge({ distance }: { distance: RelationalDistance }) {
  const isDirect = distance === RelationalDistance.DIRECT;
  return (
    <span
      className={`chip ${
        isDirect ? 'bg-trust-100 text-trust-700' : 'bg-warmth-400/20 text-warmth-600'
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {RELATIONAL_DISTANCE_LABELS[distance]}
    </span>
  );
}

export function CategoryChip({ name }: { name: string }) {
  return <span className="chip bg-sand text-ink/70">{name}</span>;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-sand bg-white/50 p-8 text-center">
      <p className="font-medium text-ink/80">{title}</p>
      {hint && <p className="mt-1 text-sm text-ink/50">{hint}</p>}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-10">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-trust-200 border-t-trust-600" />
    </div>
  );
}

export function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
