import React from 'react';
import { getInspirations } from '@/app/actions';
import { InspirationsGallery } from '@/components/inspirations-gallery';
import { AppShell } from '@/components/app-shell';

export const revalidate = 0;

export default async function InspirationsPage() {
  const inspirations = await getInspirations();

  return (
    <AppShell>
      <div className="space-y-4 animate-in fade-in duration-300">
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-teal-500 dark:from-blue-400 dark:to-teal-400 bg-clip-text text-transparent inline-block">
            Inspiration Library
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Store references for dashboards, web design concepts, data visualizations, and color schemes.
          </p>
        </div>
        <InspirationsGallery initialInspirations={inspirations} />
      </div>
    </AppShell>
  );
}
