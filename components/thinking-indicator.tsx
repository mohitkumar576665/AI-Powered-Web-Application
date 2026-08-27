'use client';

import { cn } from '@/lib/utils';

export function ThinkingIndicator({ label = 'Thinking' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <div className="flex items-center gap-1">
        <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-primary" />
        <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-primary" />
        <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-primary" />
      </div>
      <span className={cn('text-sm')}>{label}…</span>
    </div>
  );
}
