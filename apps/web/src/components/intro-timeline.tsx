'use client';

import Link from 'next/link';
import type { IntroductionRequest, IntroductionStep } from '@plal/shared';
import { Avatar } from './ui';

function stepStatusLabel(status: IntroductionStep['status']) {
  switch (status) {
    case 'accepted':
      return 'a validé';
    case 'declined':
      return 'a refusé';
    default:
      return 'est sollicité';
  }
}

function statusDot(status: IntroductionStep['status']) {
  const base = 'h-2 w-2 rounded-full';
  if (status === 'accepted') return `${base} bg-trust-500`;
  if (status === 'declined') return `${base} bg-red-500`;
  return `${base} bg-warmth-500`;
}

interface IntroTimelineProps {
  intro: IntroductionRequest;
  currentUserId?: string;
}

export function IntroTimeline({ intro, currentUserId }: IntroTimelineProps) {
  const steps = intro.steps;
  if (steps.length <= 1) return null;

  return (
    <div className="mt-4 rounded-2xl bg-sand/40 p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink/50">
        Chaîne de confiance
      </p>
      <div className="relative space-y-4 pl-3">
        {steps.map((step, index) => {
          const isMe = step.user.userId === currentUserId;
          const isCurrent = intro.currentStep?.id === step.id;
          return (
            <div key={step.id} className="relative flex items-start gap-3">
              {index < steps.length - 1 && (
                <span className="absolute left-[11px] top-6 h-full w-px bg-ink/10" />
              )}
              <div className="relative z-10 mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm">
                <span className={statusDot(step.status)} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/utilisateur/${step.user.userId}`}>
                    <Avatar
                      firstName={step.user.firstName}
                      lastName={step.user.lastName}
                      photoUrl={step.user.photoUrl}
                      size={24}
                    />
                  </Link>
                  <Link href={`/utilisateur/${step.user.userId}`} className="text-sm font-medium hover:text-trust-700">
                    {step.user.firstName} {isMe && '(toi)'}
                  </Link>
                  {isCurrent && (
                    <span className="chip bg-warmth-400/20 text-warmth-600 text-xs">
                      En cours
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-ink/60">
                  {stepStatusLabel(step.status)}
                  {step.responseMessage && ` : « ${step.responseMessage} »`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
