'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from '@/components/theme-provider';
import {
  LayoutDashboard,
  FileText,
  Lightbulb,
  Bookmark,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  Search,
  Plus,
  BrainCircuit,
  Database,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Custom Avatar component to avoid adding dependency
function CustomAvatar({ src, name, fallback }: { src?: string; name?: string; fallback?: string }) {
  return (
    <div className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full border border-slate-700 bg-slate-800">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name || 'Avatar'} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-teal-500 text-xs font-bold text-white uppercase">
          {fallback || name?.charAt(0) || 'U'}
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Smart Notes', href: '/notes', icon: FileText },
    { name: 'Inspiration Library', href: '/inspirations', icon: Lightbulb },
    { name: 'Resource Collections', href: '/resources', icon: Bookmark },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchOpen(false);
      router.push(`/notes?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-teal-500 dark:from-blue-400 dark:to-teal-400 bg-clip-text text-transparent">
            SaynIQ Notes
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}>
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-slate-700" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Overlay */}
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          
          <div className="relative flex w-full max-w-xs flex-col bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <span className="font-bold text-lg dark:text-white">SaynIQ Notes</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <nav className="flex-1 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-auto">
              <div className="flex items-center gap-3 px-2 py-3">
                <CustomAvatar src={session?.user?.image || undefined} name={session?.user?.name || 'User'} />
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">
                    {session?.user?.name || 'Demo User'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {session?.user?.email || 'demo@sayniq.com'}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => signOut()}>
                  <LogOut className="h-4 w-4 text-rose-500" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-2.5 px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 shadow-md">
            <BrainCircuit className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-teal-500 dark:from-blue-400 dark:to-teal-400 bg-clip-text text-transparent">
            SaynIQ Notes
          </span>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 dark:shadow-blue-500/10'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Database info and actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <a
            href="https://docs.google.com/spreadsheets/d/1Ef1n9keADMKH6-CSCSENNkZyufg6DJdt0E82oyhFaXE"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 font-medium transition-all"
          >
            <Database className="h-4 w-4 text-emerald-500" />
            <span className="flex-1 truncate">Google Sheet Database</span>
            <ExternalLink className="h-3 w-3 text-slate-400" />
          </a>
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
          <div className="flex items-center gap-3">
            <CustomAvatar src={session?.user?.image || undefined} name={session?.user?.name || 'User'} />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">
                {session?.user?.name || 'Demo User'}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {session?.user?.email || 'demo@sayniq.com'}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="dark:bg-slate-800" />
                <DropdownMenuItem onClick={toggleTheme} className="flex items-center justify-between">
                  <span>Toggle Theme</span>
                  {theme === 'dark' ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="dark:bg-slate-800" />
                <DropdownMenuItem onClick={() => signOut()} className="text-rose-500 focus:text-rose-400">
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Desktop Header */}
        <header className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/80 backdrop-blur-md px-8 lg:flex">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-96">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search notes, tags, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 pl-10 pr-4 py-2 rounded-xl text-sm border-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-500/20 text-slate-800 dark:text-slate-100 transition-all placeholder:text-slate-400"
            />
          </form>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 h-10 w-10"
            >
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-yellow-500" /> : <Moon className="h-4.5 w-4.5 text-slate-700" />}
            </Button>
            
            <Link href="/notes?action=new">
              <Button className="rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-medium flex items-center gap-1.5 h-10 shadow-md shadow-blue-500/10">
                <Plus className="h-4.5 w-4.5" />
                Quick Note
              </Button>
            </Link>
          </div>
        </header>

        {/* Page children */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>

      {/* Global Search Dialog for mobile */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="border-slate-800 bg-slate-900 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Search SaynIQ</DialogTitle>
            <DialogDescription className="text-slate-400">
              Type your search query and press enter to find notes and resources.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSearchSubmit} className="mt-4 space-y-4">
            <input
              type="text"
              placeholder="Search for tags, title, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setSearchOpen(false)} className="text-slate-400 hover:text-white">
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-500">
                Search
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
