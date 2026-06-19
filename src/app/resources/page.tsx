import React from 'react';
import { getResources } from '@/app/actions';
import { ResourcesList } from '@/components/resources-list';
import { AppShell } from '@/components/app-shell';

export const revalidate = 0;

export default async function ResourcesPage() {
  const resources = await getResources();

  return (
    <AppShell>
      <div className="space-y-4 animate-in fade-in duration-300">
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-teal-500 dark:from-blue-400 dark:to-teal-400 bg-clip-text text-transparent inline-block">
            Resource Collections
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Bookmark Fabric libraries, SQL tutorials, YouTube channels, and documentation links. Syncs to Google Sheets.
          </p>
        </div>
        <ResourcesList initialResources={resources} />
      </div>
    </AppShell>
  );
}
