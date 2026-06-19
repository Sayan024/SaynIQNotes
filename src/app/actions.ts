'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as db from '@/lib/db';
import * as ai from '@/lib/gemini';
import { revalidatePath } from 'next/cache';

// Helper to get authenticated user email or fallback to demo
async function getAuthenticatedUserEmail(): Promise<string> {
  try {
    const session = await getServerSession(authOptions);
    return session?.user?.email || 'demo@sayniq.com';
  } catch (error) {
    console.error('Error fetching session, defaulting to demo user:', error);
    return 'demo@sayniq.com';
  }
}

// ----------------------------------------------------
// Data Fetching Actions
// ----------------------------------------------------

export async function getDashboardData() {
  const email = await getAuthenticatedUserEmail();
  try {
    const data = await db.fetchAllData(email);
    
    // Calculate dashboard statistics
    const totalNotes = data.notes.length;
    const totalInspirations = data.inspirations.length;
    const totalResources = data.resources.length;

    // Recents
    const recentNotes = [...data.notes]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);

    const recentInspirations = [...data.inspirations]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);

    const favoriteResources = data.resources.filter(r => r.isFavorite).slice(0, 5);

    // Most used tags
    const tagCounts: Record<string, number> = {};
    data.notes.forEach(note => {
      note.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    data.inspirations.forEach(insp => {
      insp.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    data.resources.forEach(res => {
      res.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const mostUsedTags = Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Chart Data: Notes by Category
    const notesCategoryCounts: Record<string, number> = {};
    data.notes.forEach(note => {
      const cat = note.category || 'General';
      notesCategoryCounts[cat] = (notesCategoryCounts[cat] || 0) + 1;
    });
    const notesByCategoryChart = Object.entries(notesCategoryCounts).map(([name, count]) => ({
      name,
      value: count,
    }));

    // Chart Data: Resources by Category
    const resourcesCategoryCounts: Record<string, number> = {};
    data.resources.forEach(res => {
      const cat = res.category || 'General';
      resourcesCategoryCounts[cat] = (resourcesCategoryCounts[cat] || 0) + 1;
    });
    const resourcesByCategoryChart = Object.entries(resourcesCategoryCounts).map(([name, count]) => ({
      name,
      value: count,
    }));

    // Chart Data: Monthly Activity (last 6 months)
    const monthlyActivity: Record<string, number> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const allItems = [
      ...data.notes.map(n => n.createdAt),
      ...data.inspirations.map(i => i.createdAt),
      ...data.resources.map(r => r.createdAt),
    ];

    allItems.forEach(dateStr => {
      const date = new Date(dateStr);
      const monthYear = `${months[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
      monthlyActivity[monthYear] = (monthlyActivity[monthYear] || 0) + 1;
    });

    // Let's ensure the current and previous 5 months are in the chart, even if 0
    const activityChart = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthYear = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      activityChart.push({
        name: monthYear,
        activity: monthlyActivity[monthYear] || 0,
      });
    }

    return {
      stats: {
        totalNotes,
        totalInspirations,
        totalResources,
      },
      recentNotes,
      recentInspirations,
      favoriteResources,
      mostUsedTags,
      charts: {
        notesByCategory: notesByCategoryChart,
        resourcesByCategory: resourcesByCategoryChart,
        monthlyActivity: activityChart,
      },
      categories: data.categories,
      tags: data.tags,
    };
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    throw new Error('Failed to load dashboard data.');
  }
}

export async function getNotes() {
  const email = await getAuthenticatedUserEmail();
  try {
    const data = await db.fetchAllData(email);
    return data.notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching notes:', error);
    return [];
  }
}

export async function getInspirations() {
  const email = await getAuthenticatedUserEmail();
  try {
    const data = await db.fetchAllData(email);
    return data.inspirations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching inspirations:', error);
    return [];
  }
}

export async function getResources() {
  const email = await getAuthenticatedUserEmail();
  try {
    const data = await db.fetchAllData(email);
    return data.resources.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching resources:', error);
    return [];
  }
}

export async function getCategoriesAndTags() {
  const email = await getAuthenticatedUserEmail();
  try {
    const data = await db.fetchAllData(email);
    return {
      categories: data.categories,
      tags: data.tags,
    };
  } catch (error) {
    console.error('Error fetching categories and tags:', error);
    return { categories: [], tags: [] };
  }
}

// ----------------------------------------------------
// Mutation Actions
// ----------------------------------------------------

export async function upsertNote(noteData: Partial<db.Note> & { id?: string }) {
  const email = await getAuthenticatedUserEmail();
  try {
    const id = noteData.id || `note-${Date.now()}`;
    const isNew = !noteData.id;
    
    const note: db.Note = {
      id,
      title: noteData.title || 'Untitled Note',
      content: noteData.content || '',
      tags: noteData.tags || [],
      category: noteData.category || 'General',
      isPinned: noteData.isPinned ?? false,
      isArchived: noteData.isArchived ?? false,
      userEmail: email,
      createdAt: noteData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.saveNote(note);

    // Automatically check and add category/tags
    if (note.category) {
      await db.addCategory({
        id: `cat-${Date.now()}`,
        name: note.category,
        type: 'note',
        userEmail: email,
      });
    }

    for (const tag of note.tags) {
      await db.addTag({
        id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: tag,
        userEmail: email,
      });
    }

    revalidatePath('/');
    revalidatePath('/notes');
    return note;
  } catch (error) {
    console.error('Error saving note:', error);
    throw new Error('Failed to save note.');
  }
}

export async function deleteNote(id: string) {
  const email = await getAuthenticatedUserEmail();
  try {
    await db.deleteNote(id, email);
    revalidatePath('/');
    revalidatePath('/notes');
    return { success: true };
  } catch (error) {
    console.error('Error deleting note:', error);
    throw new Error('Failed to delete note.');
  }
}

export async function upsertInspiration(inspData: Partial<db.Inspiration> & { id?: string }) {
  const email = await getAuthenticatedUserEmail();
  try {
    const id = inspData.id || `insp-${Date.now()}`;
    
    const insp: db.Inspiration = {
      id,
      title: inspData.title || 'Untitled Inspiration',
      description: inspData.description || '',
      category: inspData.category || 'Design',
      tags: inspData.tags || [],
      imageUrl: inspData.imageUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
      referenceUrl: inspData.referenceUrl || '',
      userEmail: email,
      createdAt: inspData.createdAt || new Date().toISOString(),
    };

    await db.saveInspiration(insp);

    if (insp.category) {
      await db.addCategory({
        id: `cat-${Date.now()}`,
        name: insp.category,
        type: 'inspiration',
        userEmail: email,
      });
    }

    for (const tag of insp.tags) {
      await db.addTag({
        id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: tag,
        userEmail: email,
      });
    }

    revalidatePath('/');
    revalidatePath('/inspirations');
    return insp;
  } catch (error) {
    console.error('Error saving inspiration:', error);
    throw new Error('Failed to save inspiration.');
  }
}

export async function deleteInspiration(id: string) {
  const email = await getAuthenticatedUserEmail();
  try {
    await db.deleteInspiration(id, email);
    revalidatePath('/');
    revalidatePath('/inspirations');
    return { success: true };
  } catch (error) {
    console.error('Error deleting inspiration:', error);
    throw new Error('Failed to delete inspiration.');
  }
}

export async function upsertResource(resData: Partial<db.Resource> & { id?: string }) {
  const email = await getAuthenticatedUserEmail();
  try {
    const id = resData.id || `res-${Date.now()}`;
    
    const res: db.Resource = {
      id,
      title: resData.title || 'Untitled Resource',
      url: resData.url || '',
      description: resData.description || '',
      category: resData.category || 'Link',
      tags: resData.tags || [],
      rating: resData.rating || 0,
      isFavorite: resData.isFavorite ?? false,
      userEmail: email,
      createdAt: resData.createdAt || new Date().toISOString(),
    };

    await db.saveResource(res);

    if (res.category) {
      await db.addCategory({
        id: `cat-${Date.now()}`,
        name: res.category,
        type: 'resource',
        userEmail: email,
      });
    }

    for (const tag of res.tags) {
      await db.addTag({
        id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: tag,
        userEmail: email,
      });
    }

    revalidatePath('/');
    revalidatePath('/resources');
    return res;
  } catch (error) {
    console.error('Error saving resource:', error);
    throw new Error('Failed to save resource.');
  }
}

export async function deleteResource(id: string) {
  const email = await getAuthenticatedUserEmail();
  try {
    await db.deleteResource(id, email);
    revalidatePath('/');
    revalidatePath('/resources');
    return { success: true };
  } catch (error) {
    console.error('Error deleting resource:', error);
    throw new Error('Failed to delete resource.');
  }
}

// ----------------------------------------------------
// AI Actions
// ----------------------------------------------------

export async function summarizeNoteAction(content: string) {
  try {
    return await ai.summarizeNote(content);
  } catch (error) {
    console.error('Error in summarizeNoteAction:', error);
    return 'Failed to generate summary.';
  }
}

export async function generateTagsAction(title: string, content: string) {
  try {
    return await ai.generateTags(title, content);
  } catch (error) {
    console.error('Error in generateTagsAction:', error);
    return [];
  }
}

export async function suggestCategoryAction(title: string, content: string) {
  try {
    return await ai.suggestCategory(title, content);
  } catch (error) {
    console.error('Error in suggestCategoryAction:', error);
    return 'General';
  }
}

export async function createTitleAction(content: string) {
  try {
    return await ai.generateTitle(content);
  } catch (error) {
    console.error('Error in createTitleAction:', error);
    return 'Untitled Note';
  }
}
