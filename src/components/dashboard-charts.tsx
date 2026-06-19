'use client';

import React, { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CategoryData {
  name: string;
  value: number;
}

interface MonthlyData {
  name: string;
  activity: number;
}

interface ChartsProps {
  notesByCategory: CategoryData[];
  resourcesByCategory: CategoryData[];
  monthlyActivity: MonthlyData[];
}

const COLORS = ['#2563EB', '#14B8A6', '#0EA5E9', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899'];

export function DashboardCharts({
  notesByCategory,
  resourcesByCategory,
  monthlyActivity,
}: ChartsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[300px]">
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 h-80 flex items-center justify-center">
          <p className="text-slate-400 text-sm animate-pulse">Loading charts...</p>
        </Card>
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 h-80 flex items-center justify-center">
          <p className="text-slate-400 text-sm animate-pulse">Loading charts...</p>
        </Card>
      </div>
    );
  }

  // Fallbacks if data is empty
  const notesChartData = notesByCategory.length > 0 ? notesByCategory : [{ name: 'No Data', value: 0 }];
  const resourcesChartData = resourcesByCategory.length > 0 ? resourcesByCategory : [{ name: 'No Data', value: 0 }];

  return (
    <div className="space-y-6">
      {/* Monthly Activity Chart */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold">Knowledge Hub Activity</CardTitle>
          <CardDescription className="text-xs">
            Volume of notes, inspirations, and resources added per month.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64 sm:h-80 pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyActivity} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                }}
              />
              <Area
                type="monotone"
                dataKey="activity"
                stroke="#2563EB"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorActivity)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notes by Category (Pie Chart) */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Notes by Category</CardTitle>
            <CardDescription className="text-xs">Distribution of saved notes.</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex flex-col justify-center">
            {notesByCategory.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                No note categories available.
              </div>
            ) : (
              <div className="h-full w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={notesChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {notesChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => <span className="text-[10px] text-slate-500 dark:text-slate-400">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resources by Category (Bar Chart) */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Resources by Category</CardTitle>
            <CardDescription className="text-xs">Count of reference links by category.</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex flex-col justify-center">
            {resourcesByCategory.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                No resource categories available.
              </div>
            ) : (
              <div className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resourcesChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                    <XAxis
                      dataKey="name"
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }}
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {resourcesChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
