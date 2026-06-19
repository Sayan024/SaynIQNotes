'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { upsertNote, generateTagsAction, suggestCategoryAction, createTitleAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Wand2, Send, CheckCircle, AlertCircle } from 'lucide-react';

export function QuickNote() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [tagsInput, setTagsInput] = useState('');
  
  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAISuggest = async () => {
    if (!content.trim()) {
      setMessage({ type: 'error', text: 'Please write some content first so the AI can analyze it.' });
      return;
    }

    setAiLoading(true);
    setMessage(null);
    try {
      const [aiTitle, aiTags, aiCategory] = await Promise.all([
        createTitleAction(content),
        generateTagsAction('', content),
        suggestCategoryAction('', content),
      ]);

      if (aiTitle) setTitle(aiTitle);
      if (aiCategory) setCategory(aiCategory);
      if (aiTags && aiTags.length > 0) setTagsInput(aiTags.join(', '));
      
      setMessage({ type: 'success', text: 'AI suggestions applied! Review and save your note.' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'AI assistant failed. Check your Gemini API Key.' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    setMessage(null);

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    try {
      await upsertNote({
        title: title.trim() || 'Quick Note ' + new Date().toLocaleDateString(),
        content: content.trim(),
        category: category.trim(),
        tags,
        isPinned: false,
        isArchived: false,
      });

      // Reset form
      setContent('');
      setTitle('');
      setCategory('General');
      setTagsInput('');
      
      setMessage({ type: 'success', text: 'Note saved successfully and synced to Google Sheets!' });
      
      // Refresh page data
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Failed to sync to Google Sheets. Try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <span>Quick Add Note</span>
        </CardTitle>
        <CardDescription className="text-xs">
          Draft a note and let the AI generate tags and category.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-3 pb-3">
          <Textarea
            placeholder="What's on your mind? Write or paste content here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] text-sm resize-none bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
            required
          />

          {/* Collapsible/Extended inputs once content is present */}
          {content.length > 0 && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Title</label>
                  <Input
                    placeholder="Enter note title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-8 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Category</label>
                  <Input
                    placeholder="General, Fabric, Power BI..."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-8 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Tags (comma separated)</label>
                <Input
                  placeholder="analytics, workspace, idea..."
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="h-8 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-lg"
                />
              </div>
            </div>
          )}

          {message && (
            <div
              className={`flex items-start gap-2 p-2.5 rounded-lg text-xs leading-normal ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              )}
              <span>{message.text}</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t border-slate-100 dark:border-slate-800/60 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAISuggest}
            disabled={aiLoading || submitting || !content.trim()}
            className="text-xs border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg h-9"
          >
            <Wand2 className={`h-3.5 w-3.5 mr-1.5 ${aiLoading ? 'animate-spin' : ''}`} />
            Auto AI
          </Button>

          <Button
            type="submit"
            size="sm"
            disabled={submitting || !content.trim()}
            className="text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg h-9 px-4"
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            Save Note
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
