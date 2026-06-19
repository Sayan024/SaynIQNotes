'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import React, { useEffect } from 'react';
import { Bold, Italic, List, ListOrdered, Quote, Heading1, Heading2, Strikethrough } from 'lucide-react';

interface TiptapEditorProps {
  content: string;
  onChange: (richText: string) => void;
  placeholder?: string;
}

export function TiptapEditor({ content, onChange, placeholder = 'Start writing...' }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          'prose dark:prose-invert max-w-none min-h-[300px] max-h-[500px] overflow-y-auto px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-500/20 text-sm leading-relaxed',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync content when it changes outside (e.g., when selecting a different note)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="h-[300px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 animate-pulse" />
    );
  }

  const MenuBarButton = ({
    onClick,
    isActive,
    children,
    title,
  }: {
    onClick: () => void;
    isActive: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
        isActive
          ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-bold'
          : 'text-slate-500 dark:text-slate-400'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-2">
      {/* Editor Menu Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <MenuBarButton
          title="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
        >
          <Bold className="h-4 w-4" />
        </MenuBarButton>

        <MenuBarButton
          title="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
        >
          <Italic className="h-4 w-4" />
        </MenuBarButton>

        <MenuBarButton
          title="Strikethrough"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
        >
          <Strikethrough className="h-4 w-4" />
        </MenuBarButton>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        <MenuBarButton
          title="Heading 1"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
        >
          <Heading1 className="h-4 w-4" />
        </MenuBarButton>

        <MenuBarButton
          title="Heading 2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
        >
          <Heading2 className="h-4 w-4" />
        </MenuBarButton>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        <MenuBarButton
          title="Bullet List"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
        >
          <List className="h-4 w-4" />
        </MenuBarButton>

        <MenuBarButton
          title="Ordered List"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
        >
          <ListOrdered className="h-4 w-4" />
        </MenuBarButton>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        <MenuBarButton
          title="Blockquote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
        >
          <Quote className="h-4 w-4" />
        </MenuBarButton>
      </div>

      {/* Actual Content Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}
