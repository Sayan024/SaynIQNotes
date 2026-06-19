'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Resource } from '@/lib/db';
import { upsertResource, deleteResource } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  ExternalLink,
  Trash2,
  Calendar,
  Layers,
  Tag as TagIcon,
  Star,
  Globe,
  Bookmark,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface ResourcesListProps {
  initialResources: Resource[];
}

export function ResourcesList({ initialResources }: ResourcesListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');

  // Local state
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [viewFavoritesOnly, setViewFavoritesOnly] = useState(filterParam === 'favorites');
  
  // Dialog form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [rating, setRating] = useState(3);
  const [isFavorite, setIsFavorite] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync initialResources
  React.useEffect(() => {
    setResources(initialResources);
  }, [initialResources]);

  // Sync favorites check if query changes
  React.useEffect(() => {
    if (filterParam === 'favorites') {
      setViewFavoritesOnly(true);
    }
  }, [filterParam]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleOpenAddDialog = () => {
    setTitle('');
    setUrl('');
    setDescription('');
    setCategory('Microsoft Fabric');
    setTagsInput('');
    setRating(3);
    setIsFavorite(false);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      showToast('error', 'Title and Resource URL are required.');
      return;
    }

    setSubmitting(true);
    try {
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const newRes = {
        title: title.trim(),
        url: url.trim(),
        description: description.trim(),
        category: category.trim() || 'Reference',
        tags,
        rating,
        isFavorite,
      };

      const saved = await upsertResource(newRes);
      setResources(prev => [saved, ...prev]);
      setDialogOpen(false);
      showToast('success', 'Resource bookmarked and synced successfully!');
      router.refresh();
    } catch (error) {
      console.error(error);
      showToast('error', 'Failed to save resource link.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource link?')) return;

    setDeletingId(id);
    try {
      await deleteResource(id);
      setResources(prev => prev.filter(r => r.id !== id));
      showToast('success', 'Resource link deleted.');
      router.refresh();
    } catch (error) {
      console.error(error);
      showToast('error', 'Failed to delete resource link.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleFavorite = async (res: Resource) => {
    setTogglingId(res.id);
    try {
      const updated = { ...res, isFavorite: !res.isFavorite };
      await upsertResource(updated);
      setResources(prev => prev.map(r => (r.id === res.id ? updated : r)));
      showToast('success', updated.isFavorite ? 'Added to favorites' : 'Removed from favorites');
      router.refresh();
    } catch (error) {
      console.error(error);
      showToast('error', 'Failed to toggle favorite.');
    } finally {
      setTogglingId(null);
    }
  };

  // Helper to extract favicon
  const getFaviconUrl = (linkUrl: string) => {
    try {
      const domain = new URL(linkUrl).hostname;
      return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
    } catch {
      return '';
    }
  };

  // Filters
  const categories = ['All', ...Array.from(new Set(resources.map(r => r.category))).filter(Boolean)];

  const filteredResources = resources.filter(item => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      query === '' ||
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.url.toLowerCase().includes(query) ||
      item.tags.some(t => t.toLowerCase().includes(query));

    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesFav = !viewFavoritesOnly || item.isFavorite;

    return matchesSearch && matchesCategory && matchesFav;
  });

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300 ${
            toastMsg.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Filter and Action Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900/60 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search reference links..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 pl-9 h-9 text-xs rounded-xl"
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 shrink-0">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-lg py-1 px-2.5 outline-none font-semibold text-xs h-9"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Favorites Filter button */}
          <Button
            variant={viewFavoritesOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewFavoritesOnly(prev => !prev)}
            className={`h-9 text-xs rounded-xl ${
              viewFavoritesOnly
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-transparent'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Star className={`h-4 w-4 mr-1.5 ${viewFavoritesOnly ? 'fill-current' : ''}`} />
            Favorites Only
          </Button>
        </div>

        {/* Add Resource Trigger */}
        <Button
          onClick={handleOpenAddDialog}
          className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-9 text-xs font-semibold px-4 w-full md:w-auto"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Bookmark Resource
        </Button>
      </div>

      {/* Main Reference Links List */}
      {filteredResources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center">
          <Bookmark className="h-16 w-16 text-slate-300 dark:text-slate-700 mb-2" />
          <p className="text-sm font-bold">No resource links cataloged</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs leading-normal">
            Click "Bookmark Resource" to store Fabric guides, SQL websites, Power BI templates, and AI tools synced with Google Sheets.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredResources.map((item) => {
            const favicon = getFaviconUrl(item.url);
            return (
              <div
                key={item.id}
                className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm hover:shadow-md hover:border-blue-500/30 dark:hover:border-blue-500/20 transition-all duration-200 gap-4"
              >
                {/* Left: Favicon + Info */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 overflow-hidden mt-0.5">
                    {favicon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={favicon} alt="" className="h-5 w-5 object-contain" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                    ) : (
                      <Globe className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                  
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1 hover:underline"
                      >
                        {item.title}
                        <ExternalLink className="h-3 w-3 inline opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {item.description || 'No description provided.'}
                    </p>
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {item.tags.map(t => (
                          <span key={t} className="text-[9px] font-bold text-slate-400 bg-slate-100/50 dark:bg-slate-800/40 px-2 py-0.5 rounded-md">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Stars + Favorite + Delete Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto border-t sm:border-t-0 border-slate-100 dark:border-slate-800/50 pt-3 sm:pt-0">
                  {/* Date representation */}
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 sm:hidden">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-4">
                    {/* Stars render */}
                    <div className="flex items-center" title={`Rating: ${item.rating}/5`}>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < item.rating ? 'fill-yellow-500 text-yellow-500' : 'text-slate-200 dark:text-slate-800'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Favorite toggle star */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleFavorite(item)}
                      disabled={togglingId === item.id}
                      className={`h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 ${
                        item.isFavorite ? 'text-yellow-500' : 'text-slate-400'
                      }`}
                      title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star className={`h-4.5 w-4.5 ${item.isFavorite ? 'fill-current' : ''}`} />
                    </Button>

                    {/* Delete button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="h-9 w-9 rounded-xl text-rose-500 hover:bg-rose-500/10"
                      title="Delete Bookmark"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Resource Dialog Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold">Bookmark Resource Link</DialogTitle>
            <DialogDescription className="text-xs">
              Save Fabric, Power BI, SQL, AI, documentation reference URLs. Syncs with Google Sheets.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Title *</label>
                <Input
                  placeholder="e.g. SQL Performance Tuning Guide"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Category</label>
                <Input
                  placeholder="e.g. SQL, Power BI, Fabric"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Resource URL *</label>
              <Input
                placeholder="https://example.com/learn-sql"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Description</label>
              <Textarea
                placeholder="Briefly describe what this resource contains..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl min-h-[70px] text-xs resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Tags (comma separated)</label>
                <Input
                  placeholder="database, optimization, reference"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Quality Rating (1 to 5 Stars)</label>
                <div className="flex items-center gap-1.5 h-10">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRating(val)}
                      className="text-slate-300 dark:text-slate-700 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          val <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-slate-300 dark:text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isFavorite"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isFavorite" className="text-xs font-bold text-slate-400 cursor-pointer">
                Mark as Favorite (Pins to dashboard overview)
              </label>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs px-4"
              >
                {submitting ? 'Saving...' : 'Save & Sync'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
