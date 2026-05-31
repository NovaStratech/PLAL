import { RelationalDistance, RELATIONAL_DISTANCE_LABELS } from '@plal/shared';

export function Avatar({
  firstName,
  lastName,
  photoUrl,
  size = 44,
}: {
  firstName: string;
  lastName?: string | null;
  photoUrl?: string | null;
  size?: number;
}) {
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={photoUrl}
        alt={firstName}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-trust-100 font-semibold text-trust-700"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials || '?'}
    </div>
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
