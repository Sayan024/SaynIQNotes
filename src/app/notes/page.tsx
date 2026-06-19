import React from 'react';
import { getNotes } from '@/app/actions';
import { NotesWorkspace } from '@/components/notes-workspace';
import { AppShell } from '@/components/app-shell';

export const revalidate = 0; // Disable server caching for dynamic route

export default async function NotesPage() {
  const notes = await getNotes();

  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-teal-500 dark:from-blue-400 dark:to-teal-400 bg-clip-text text-transparent inline-block">
            Smart Notes
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Write markdown notes, tag ideas, and categorize logs. Synced to Google Sheets.
          </p>
        </div>
        <NotesWorkspace initialNotes={notes} />
      </div>
    </AppShell>
  );
}
