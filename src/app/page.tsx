import React from 'react';
import Link from 'next/link';
import { getDashboardData } from './actions';
import { AppShell } from '@/components/app-shell';

export const dynamic = 'force-dynamic';

import { QuickNote } from '@/components/quick-note';
import { DashboardCharts } from '@/components/dashboard-charts';
import {
  FileText,
  Lightbulb,
  Bookmark,
  Plus,
  ArrowRight,
  Star,
  Tag,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <AppShell>
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-sky-600 to-teal-500 p-6 sm:p-8 shadow-lg shadow-blue-500/10">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-xl pointer-events-none"></div>
          <div className="z-10 max-w-xl space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Personal Knowledge Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              SaynIQ Notes
            </h1>
            <p className="text-sm text-blue-100 leading-relaxed max-w-lg">
              "Capture Ideas. Organize Knowledge. Accelerate Learning." Access your categorized logs, bookmarks, and UI inspirations, sync-saved to Google Sheets.
            </p>
          </div>
        </div>

        {/* Counter Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Notes Count */}
          <Link href="/notes" className="group">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Notes</p>
                  <p className="text-2xl font-bold dark:text-white">{data.stats.totalNotes}</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Inspirations Count */}
          <Link href="/inspirations" className="group">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 group-hover:bg-teal-600 group-hover:text-white transition-all">
                  <Lightbulb className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Inspirations</p>
                  <p className="text-2xl font-bold dark:text-white">{data.stats.totalInspirations}</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Resources Count */}
          <Link href="/resources" className="group">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:bg-sky-600 group-hover:text-white transition-all">
                  <Bookmark className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Resources</p>
                  <p className="text-2xl font-bold dark:text-white">{data.stats.totalResources}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Mid section: Quick Note & recents */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Note Widget */}
          <div className="lg:col-span-1">
            <QuickNote />
            
            {/* Most Used Tags */}
            <Card className="mt-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Tag className="h-4.5 w-4.5 text-blue-500" />
                  <span>Popular Tags</span>
                </CardTitle>
                <CardDescription className="text-xs">Tags you reference most across items.</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                {data.mostUsedTags.length === 0 ? (
                  <p className="text-xs text-slate-400">No tags used yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {data.mostUsedTags.map(tag => (
                      <Link key={tag.name} href={`/notes?search=${encodeURIComponent(tag.name)}`}>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-blue-500/10 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                          #{tag.name}
                          <span className="text-[10px] text-slate-400 font-normal">({tag.count})</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Notes & Inspirations list */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Notes */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Clock className="h-4.5 w-4.5 text-teal-500" />
                    <span>Recent Notes</span>
                  </CardTitle>
                  <CardDescription className="text-xs">Your lately drafted ideas.</CardDescription>
                </div>
                <Link href="/notes">
                  <Button variant="ghost" size="sm" className="text-xs text-blue-500 hover:text-blue-400">
                    View All
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                {data.recentNotes.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No notes created yet. Click "Quick Note" to start.</p>
                ) : (
                  data.recentNotes.map((note) => (
                    <Link key={note.id} href={`/notes?id=${note.id}`} className="block">
                      <div className="group p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 hover:border-blue-500/40 hover:bg-blue-500/[0.02] transition-all">
                        <div className="flex justify-between items-start">
                          <h3 className="text-sm font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all truncate pr-4">
                            {note.title}
                          </h3>
                          <span className="text-[10px] font-medium text-slate-400 bg-slate-200/50 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            {note.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {note.content.replace(/<[^>]*>/g, '')}
                        </p>
                        <div className="flex justify-between items-center mt-2.5">
                          <span className="text-[10px] text-slate-400">
                            Updated {new Date(note.updatedAt).toLocaleDateString()}
                          </span>
                          <div className="flex gap-1">
                            {note.tags.slice(0, 2).map(t => (
                              <span key={t} className="text-[10px] text-slate-400">#{t}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Favorite Resources */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Star className="h-4.5 w-4.5 fill-yellow-500 text-yellow-500" />
                    <span>Favorite Resource Links</span>
                  </CardTitle>
                  <CardDescription className="text-xs">Highly rated knowledge links.</CardDescription>
                </div>
                <Link href="/resources?filter=favorites">
                  <Button variant="ghost" size="sm" className="text-xs text-blue-500 hover:text-blue-400">
                    View All
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                {data.favoriteResources.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No favorite resources bookmarked yet.</p>
                ) : (
                  data.favoriteResources.map((res) => (
                    <div
                      key={res.id}
                      className="group flex items-start justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 hover:border-blue-500/40 transition-all"
                    >
                      <div className="min-w-0 flex-1 pr-4">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all inline-flex items-center gap-1 truncate hover:underline"
                          >
                            {res.title}
                            <ExternalLink className="h-3 w-3 inline opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5 leading-relaxed">{res.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < res.rating ? 'fill-yellow-500 text-yellow-500' : 'text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-200/50 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          {res.category}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Charts Section */}
        <DashboardCharts
          notesByCategory={data.charts.notesByCategory}
          resourcesByCategory={data.charts.resourcesByCategory}
          monthlyActivity={data.charts.monthlyActivity}
        />
      </div>
    </AppShell>
  );
}
