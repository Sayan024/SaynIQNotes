'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Note } from '@/lib/db';
import { TiptapEditor } from './tiptap-editor';
import { upsertNote, deleteNote, summarizeNoteAction, generateTagsAction, suggestCategoryAction, createTitleAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search,
  Plus,
  Pin,
  Archive,
  Trash2,
  Save,
  Wand2,
  Sparkles,
  ArrowLeft,
  Calendar,
  Layers,
  Tag as TagIcon,
  CheckCircle,
  AlertCircle,
  FileText,
  Brain,
  X
} from 'lucide-react';

interface NotesWorkspaceProps {
  initialNotes: Note[];
}

export function NotesWorkspace({ initialNotes }: NotesWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL params-driven state
  const preSelectedId = searchParams.get('id');
  const actionParam = searchParams.get('action');
  const initialSearch = searchParams.get('search') || '';

  // Local state
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [activeTab, setActiveTab] = useState<'all' | 'pinned' | 'archived'>('all');

  // Form Editor state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editTags, setEditTags] = useState('');
  const [isNewNote, setIsNewNote] = useState(false);

  // Status and AI state
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync initialNotes with local state when it updates from SSR
  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  // Handle URL parameters
  useEffect(() => {
    if (preSelectedId) {
      const found = notes.find(n => n.id === preSelectedId);
      if (found) {
        handleSelectNote(found);
      }
    } else if (actionParam === 'new') {
      handleNewNote();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preSelectedId, actionParam, notes]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditCategory(note.category);
    setEditTags(note.tags.join(', '));
    setIsNewNote(false);
    setIsEditing(true);
    setSummaryResult(null);
  };

  const handleNewNote = () => {
    setSelectedNote(null);
    setEditTitle('');
    setEditContent('');
    setEditCategory('General');
    setEditTags('');
    setIsNewNote(true);
    setIsEditing(true);
    setSummaryResult(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedNote(null);
    setIsNewNote(false);
    setSummaryResult(null);
    
    // Clear URL parameters
    router.replace('/notes');
  };

  // ----------------------------------------------------
  // Note Mutations
  // ----------------------------------------------------
  const handleSave = async () => {
    if (!editContent.trim()) {
      showToast('error', 'Note content cannot be empty.');
      return;
    }

    setSaving(true);
    try {
      const tags = editTags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const noteToSave = {
        id: isNewNote ? undefined : selectedNote?.id,
        title: editTitle.trim() || 'Untitled Note',
        content: editContent,
        category: editCategory.trim() || 'General',
        tags,
        isPinned: isNewNote ? false : selectedNote?.isPinned ?? false,
        isArchived: isNewNote ? false : selectedNote?.isArchived ?? false,
        createdAt: isNewNote ? undefined : selectedNote?.createdAt,
      };

      const saved = await upsertNote(noteToSave);
      
      // Update local list
      if (isNewNote) {
        setNotes(prev => [saved, ...prev]);
      } else {
        setNotes(prev => prev.map(n => (n.id === saved.id ? saved : n)));
      }

      setSelectedNote(saved);
      setIsNewNote(false);
      showToast('success', 'Note saved and synced successfully!');
      router.refresh();
    } catch (error) {
      console.error(error);
      showToast('error', 'Error syncing note with Google Sheets.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedNote) return;
    if (!confirm('Are you sure you want to delete this note?')) return;

    setDeleting(true);
    try {
      await deleteNote(selectedNote.id);
      setNotes(prev => prev.filter(n => n.id !== selectedNote.id));
      setSelectedNote(null);
      setIsEditing(false);
      showToast('success', 'Note deleted successfully.');
      router.replace('/notes');
      router.refresh();
    } catch (error) {
      console.error(error);
      showToast('error', 'Error deleting note from Google Sheets.');
    } finally {
      setDeleting(false);
    }
  };

  const handleTogglePin = async (note: Note) => {
    try {
      const updated = { ...note, isPinned: !note.isPinned, updatedAt: new Date().toISOString() };
      await upsertNote(updated);
      setNotes(prev => prev.map(n => (n.id === note.id ? updated : n)));
      if (selectedNote?.id === note.id) {
        setSelectedNote(updated);
      }
      showToast('success', note.isPinned ? 'Note unpinned' : 'Note pinned');
      router.refresh();
    } catch (error) {
      console.error(error);
      showToast('error', 'Failed to update pin state.');
    }
  };

  const handleToggleArchive = async (note: Note) => {
    try {
      const updated = { ...note, isArchived: !note.isArchived, updatedAt: new Date().toISOString() };
      await upsertNote(updated);
      setNotes(prev => prev.map(n => (n.id === note.id ? updated : n)));
      if (selectedNote?.id === note.id) {
        setSelectedNote(updated);
      }
      showToast('success', note.isArchived ? 'Note unarchived' : 'Note archived');
      router.refresh();
    } catch (error) {
      console.error(error);
      showToast('error', 'Failed to update archive state.');
    }
  };

  // ----------------------------------------------------
  // AI Integration Handlers
  // ----------------------------------------------------
  const handleAISummarize = async () => {
    if (!editContent.trim()) return;
    setAiLoading('summarize');
    try {
      const summary = await summarizeNoteAction(editContent);
      setSummaryResult(summary);
    } catch (error) {
      console.error(error);
      showToast('error', 'AI Summary failed.');
    } finally {
      setAiLoading(null);
    }
  };

  const handleAITags = async () => {
    setAiLoading('tags');
    try {
      const tags = await generateTagsAction(editTitle, editContent);
      if (tags && tags.length > 0) {
        setEditTags(tags.join(', '));
        showToast('success', 'AI suggested tags applied!');
      }
    } catch (error) {
      console.error(error);
      showToast('error', 'AI Tag generation failed.');
    } finally {
      setAiLoading(null);
    }
  };

  const handleAICategory = async () => {
    setAiLoading('category');
    try {
      const cat = await suggestCategoryAction(editTitle, editContent);
      if (cat) {
        setEditCategory(cat);
        showToast('success', `AI suggested category "${cat}" applied!`);
      }
    } catch (error) {
      console.error(error);
      showToast('error', 'AI Category suggestion failed.');
    } finally {
      setAiLoading(null);
    }
  };

  const handleAITitle = async () => {
    if (!editContent.trim()) return;
    setAiLoading('title');
    try {
      const title = await createTitleAction(editContent);
      if (title) {
        setEditTitle(title);
        showToast('success', 'AI suggested title applied!');
      }
    } catch (error) {
      console.error(error);
      showToast('error', 'AI Title generation failed.');
    } finally {
      setAiLoading(null);
    }
  };

  // ----------------------------------------------------
  // Filters & Search
  // ----------------------------------------------------
  const categories = ['All', ...Array.from(new Set(notes.map(n => n.category))).filter(Boolean)];

  const filteredNotes = notes.filter(note => {
    // Search query matches title, content, category, or tags
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      query === '' ||
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query) ||
      note.category.toLowerCase().includes(query) ||
      note.tags.some(t => t.toLowerCase().includes(query));

    // Category filter matches
    const matchesCategory = categoryFilter === 'All' || note.category === categoryFilter;

    // Tabs filter matches
    if (activeTab === 'pinned') {
      return matchesSearch && matchesCategory && note.isPinned && !note.isArchived;
    }
    if (activeTab === 'archived') {
      return matchesSearch && matchesCategory && note.isArchived;
    }
    // Default 'all' - displays unarchived notes
    return matchesSearch && matchesCategory && !note.isArchived;
  });

  // Group filtered notes into pinned and other (only for 'All' tab)
  const pinnedList = filteredNotes.filter(n => n.isPinned);
  const unpinnedList = filteredNotes.filter(n => !n.isPinned);

  return (
    <div className="flex h-[calc(100vh-10rem)] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/40 shadow-xl">
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-600 text-white shadow-emerald-950/20'
              : 'bg-rose-600 text-white shadow-rose-950/20'
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

      {/* LEFT PANE: Notes list (hidden on mobile if editing) */}
      <div
        className={`w-full lg:w-96 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/10 ${
          isEditing ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {/* Search & Actions Header */}
        <div className="p-4 space-y-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 pl-9 h-9 text-xs rounded-xl"
              />
            </div>
            <Button onClick={handleNewNote} className="h-9 w-9 p-0 rounded-xl bg-blue-600 hover:bg-blue-500 text-white">
              <Plus className="h-5 w-5" />
            </Button>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-400 font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-lg py-1 px-2.5 outline-none font-semibold text-xs"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs px-2 bg-slate-50/20 dark:bg-slate-900/20">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-3 text-center border-b-2 font-bold transition-all ${
              activeTab === 'all'
                ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            All Notes
          </button>
          <button
            onClick={() => setActiveTab('pinned')}
            className={`flex-1 py-3 text-center border-b-2 font-bold transition-all ${
              activeTab === 'pinned'
                ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Pinned
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`flex-1 py-3 text-center border-b-2 font-bold transition-all ${
              activeTab === 'archived'
                ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Archived
          </button>
        </div>

        {/* Notes Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center px-4">
              <FileText className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-xs font-semibold">No notes found</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Try clearing filters or search keyword.</p>
            </div>
          ) : (
            <>
              {/* Show Pinned block group only in All Notes list */}
              {activeTab === 'all' && pinnedList.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 py-1 flex items-center gap-1">
                    <Pin className="h-3 w-3 fill-blue-500 text-blue-500" />
                    Pinned
                  </div>
                  {pinnedList.map(note => (
                    <NoteItemCard key={note.id} note={note} />
                  ))}
                  <div className="h-px bg-slate-200 dark:bg-slate-800/80 my-3" />
                </div>
              )}
              {/* Unpinned/Standard Notes */}
              {(activeTab !== 'all' ? filteredNotes : unpinnedList).map(note => (
                <NoteItemCard key={note.id} note={note} />
              ))}
            </>
          )}
        </div>
      </div>

      {/* RIGHT PANE: Note Editor Workspace */}
      <div className={`flex-1 flex flex-col h-full bg-white dark:bg-slate-900/20 ${!isEditing ? 'hidden lg:flex justify-center items-center text-slate-400 bg-slate-50/10' : 'flex'}`}>
        {!isEditing ? (
          <div className="text-center p-6 space-y-3">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
              <Brain className="h-8 w-8 text-blue-500/60" />
            </div>
            <div>
              <h3 className="text-base font-bold dark:text-white">Workspace is ready</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs leading-normal">
                Select a note from the left sidebar to start editing, or create a brand new note to sync with Google Sheets.
              </p>
            </div>
            <Button onClick={handleNewNote} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-9 text-xs">
              <Plus className="h-4 w-4 mr-1" />
              Create Note
            </Button>
          </div>
        ) : (
          /* Actual Form Workspace */
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Editor Action Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handleCancelEdit} className="lg:hidden h-8 w-8">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <span className="font-bold text-sm text-slate-700 dark:text-slate-300">
                  {isNewNote ? 'New Note Draft' : 'Edit Note'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {!isNewNote && selectedNote && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      title={selectedNote.isPinned ? 'Unpin Note' : 'Pin Note'}
                      onClick={() => handleTogglePin(selectedNote)}
                      className={`h-9 w-9 rounded-xl ${selectedNote.isPinned ? 'text-blue-500 bg-blue-500/10' : 'text-slate-400'}`}
                    >
                      <Pin className="h-4.5 w-4.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title={selectedNote.isArchived ? 'Unarchive Note' : 'Archive Note'}
                      onClick={() => handleToggleArchive(selectedNote)}
                      className={`h-9 w-9 rounded-xl ${selectedNote.isArchived ? 'text-teal-500 bg-teal-500/10' : 'text-slate-400'}`}
                    >
                      <Archive className="h-4.5 w-4.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Delete Note"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="h-9 w-9 rounded-xl text-rose-500 hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </Button>
                  </>
                )}
                <Button
                  onClick={handleSave}
                  disabled={saving || !editContent.trim()}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-9 px-4 text-xs font-semibold"
                >
                  <Save className="h-4 w-4 mr-1.5" />
                  {saving ? 'Syncing...' : 'Save & Sync'}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="text-xs h-9 rounded-xl">
                  Close
                </Button>
              </div>
            </div>

            {/* Editor Workspace Forms */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* AI assistant action box */}
              <div className="p-3.5 rounded-2xl border border-blue-500/10 bg-blue-500/[0.02] dark:bg-blue-500/[0.01] flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-teal-500">
                    <Wand2 className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold dark:text-white">AI Writing Copilot</p>
                    <p className="text-[10px] text-slate-400">Generate metadata, suggest tags, or summarize instantly.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAITitle}
                    disabled={aiLoading !== null || !editContent.trim()}
                    className="h-7 text-[10px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg hover:text-blue-500"
                  >
                    Generate Title
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAICategory}
                    disabled={aiLoading !== null}
                    className="h-7 text-[10px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg hover:text-blue-500"
                  >
                    Auto Category
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAITags}
                    disabled={aiLoading !== null}
                    className="h-7 text-[10px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg hover:text-blue-500"
                  >
                    Suggest Tags
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAISummarize}
                    disabled={aiLoading !== null || !editContent.trim()}
                    className="h-7 text-[10px] bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-lg hover:opacity-90"
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Summarize
                  </Button>
                </div>
              </div>

              {/* Summary box output */}
              {summaryResult && (
                <div className="relative p-4 rounded-xl border border-teal-500/10 bg-teal-500/[0.02] text-xs leading-relaxed animate-in fade-in duration-200">
                  <button
                    onClick={() => setSummaryResult(null)}
                    className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-bold mb-1">
                    <Brain className="h-4 w-4" />
                    AI Summary
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 pr-4">{summaryResult}</p>
                </div>
              )}

              {/* Title & Metadata Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    Note Title
                  </label>
                  <Input
                    placeholder="Enter note title..."
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" />
                    Category
                  </label>
                  <Input
                    placeholder="General, Ideas, SQL, Fabric..."
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                  <TagIcon className="h-3.5 w-3.5" />
                  Tags (comma separated)
                </label>
                <Input
                  placeholder="e.g. data, tutorial, nextjs, pbi"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                />
              </div>

              {/* Rich Text Editor */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Content</label>
                <TiptapEditor content={editContent} onChange={setEditContent} />
              </div>

              {/* Metadata log info */}
              {!isNewNote && selectedNote && (
                <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Created: {new Date(selectedNote.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Last Updated: {new Date(selectedNote.updatedAt).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Helper card component for each note in list
  function NoteItemCard({ note }: { note: Note }) {
    const isSelected = selectedNote?.id === note.id;
    const cleanContent = note.content.replace(/<[^>]*>/g, '').trim();

    return (
      <div
        onClick={() => handleSelectNote(note)}
        className={`group p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
          isSelected
            ? 'bg-blue-600/10 border-blue-500 text-blue-900 dark:text-blue-200'
            : 'border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-900/80'
        }`}
      >
        <div className="flex justify-between items-start">
          <h4 className="text-xs font-bold line-clamp-1 flex-1 pr-2">
            {note.title || 'Untitled Note'}
          </h4>
          <div className="flex items-center gap-1">
            {note.isPinned && (
              <Pin className="h-3 w-3 fill-blue-500 text-blue-500 shrink-0" />
            )}
            {note.isArchived && (
              <Archive className="h-3 w-3 text-slate-500 shrink-0" />
            )}
          </div>
        </div>
        
        <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
          {cleanContent || 'No content...'}
        </p>

        <div className="flex justify-between items-center mt-2 pt-1 border-t border-slate-100 dark:border-slate-800/30 text-[9px] text-slate-400">
          <span>{note.category}</span>
          <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    );
  }
}
