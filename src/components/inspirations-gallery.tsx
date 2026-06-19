'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Inspiration } from '@/lib/db';
import { upsertInspiration, deleteInspiration } from '@/app/actions';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  ExternalLink,
  Trash2,
  Calendar,
  Layers,
  Tag as TagIcon,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface InspirationsGalleryProps {
  initialInspirations: Inspiration[];
}

export function InspirationsGallery({ initialInspirations }: InspirationsGalleryProps) {
  const router = useRouter();

  // Local state
  const [inspirations, setInspirations] = useState<Inspiration[]>(initialInspirations);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Dialog form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync initialInspirations
  React.useEffect(() => {
    setInspirations(initialInspirations);
  }, [initialInspirations]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleOpenAddDialog = () => {
    setTitle('');
    setDescription('');
    setCategory('Dashboard Design');
    setTagsInput('');
    setImageUrl('');
    setReferenceUrl('');
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) {
      showToast('error', 'Title and Image URL are required.');
      return;
    }

    setSubmitting(true);
    try {
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const newInsp = {
        title: title.trim(),
        description: description.trim(),
        category: category.trim() || 'Design',
        tags,
        imageUrl: imageUrl.trim(),
        referenceUrl: referenceUrl.trim(),
      };

      const saved = await upsertInspiration(newInsp);
      setInspirations(prev => [saved, ...prev]);
      setDialogOpen(false);
      showToast('success', 'Inspiration added successfully!');
      router.refresh();
    } catch (error) {
      console.error(error);
      showToast('error', 'Failed to add inspiration to Google Sheets.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inspiration item?')) return;

    setDeletingId(id);
    try {
      await deleteInspiration(id);
      setInspirations(prev => prev.filter(i => i.id !== id));
      showToast('success', 'Inspiration deleted successfully.');
      router.refresh();
    } catch (error) {
      console.error(error);
      showToast('error', 'Failed to delete inspiration.');
    } finally {
      setDeletingId(null);
    }
  };

  // Filters
  const categories = ['All', ...Array.from(new Set(inspirations.map(i => i.category))).filter(Boolean)];

  const filteredInspirations = inspirations.filter(item => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      query === '' ||
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.tags.some(t => t.toLowerCase().includes(query));

    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900/60 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search inspirations..."
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
        </div>

        {/* Add Button Trigger */}
        <Button
          onClick={handleOpenAddDialog}
          className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-9 text-xs font-semibold px-4 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Inspiration
        </Button>
      </div>

      {/* Main Inspirations Grid Gallery */}
      {filteredInspirations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center">
          <ImageIcon className="h-16 w-16 text-slate-300 dark:text-slate-700 mb-2" />
          <p className="text-sm font-bold">No inspirations saved yet</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs leading-normal">
            Click "Add Inspiration" to store design references, UI/UX ideas, and dashboard screenshots synced to Google Sheets.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInspirations.map((item) => (
            <Card
              key={item.id}
              className="overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-md group hover:shadow-xl transition-all duration-300 flex flex-col h-full"
            >
              {/* Image Preview Block */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-950/80 border-b border-slate-100 dark:border-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  onError={(e) => {
                    // Fallback placeholder image if url load fails
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=800&q=80';
                  }}
                  className="h-full w-full object-cover group-hover:scale-105 transition-all duration-500"
                />
                
                {/* Category label badge */}
                <span className="absolute top-3 left-3 text-[10px] font-bold text-white bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg">
                  {item.category}
                </span>

                {/* Hover overlay icons */}
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2 duration-300">
                  {item.referenceUrl && (
                    <a
                      href={item.referenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all shadow-md"
                      title="View Reference Site"
                    >
                      <ExternalLink className="h-4.5 w-4.5" />
                    </a>
                  )}
                  <Button
                    variant="ghost"
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="p-2 h-9 w-9 rounded-xl bg-white/10 hover:bg-rose-600 hover:text-white text-white backdrop-blur-md transition-all shadow-md"
                    title="Delete Item"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </Button>
                </div>
              </div>

              {/* Text Info Block */}
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold line-clamp-1 leading-normal">
                  {item.title}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                  {item.description || 'No description provided.'}
                </CardDescription>
              </CardHeader>

              {/* Tag Badges and Date Block */}
              <CardContent className="px-4 py-2 flex-1 flex flex-col justify-end">
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.map(t => (
                      <span key={t} className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>

              <CardFooter className="px-4 py-3 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/20 dark:bg-slate-900/20 text-[10px] text-slate-400 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Added on {new Date(item.createdAt).toLocaleDateString()}</span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Add Inspiration Dialog Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold">Add Design Inspiration</DialogTitle>
            <DialogDescription className="text-xs">
              Save dashboard screenshots, UI templates, or reference ideas. Syncs with Google Sheets.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Title *</label>
                <Input
                  placeholder="e.g. Sales Report Layout"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Category</label>
                <Input
                  placeholder="e.g. Dashboard Design, UI Component"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Description</label>
              <Textarea
                placeholder="Briefly describe what inspired you..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl min-h-[70px] text-xs resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Image URL *</label>
              <Input
                placeholder="https://images.unsplash.com/... or cloud storage URL"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Reference URL (link to source)</label>
                <Input
                  placeholder="https://dribbble.com/..."
                  value={referenceUrl}
                  onChange={(e) => setReferenceUrl(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Tags (comma separated)</label>
                <Input
                  placeholder="powerbi, darkmode, grid"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                />
              </div>
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
                {submitting ? 'Adding...' : 'Add to Sheet'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
