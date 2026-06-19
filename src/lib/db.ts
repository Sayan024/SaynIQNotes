import fs from 'fs/promises';
import path from 'path';
import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const LOCAL_DB_PATH = path.join(process.cwd(), 'src/lib/local_db.json');

// Interface types
export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  isPinned: boolean;
  isArchived: boolean;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface Inspiration {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  imageUrl: string;
  referenceUrl: string;
  userEmail: string;
  createdAt: string;
}

export interface Resource {
  id: string;
  title: string;
  url: string;
  description: string;
  category: string;
  tags: string[];
  rating: number;
  isFavorite: boolean;
  userEmail: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'note' | 'inspiration' | 'resource';
  userEmail: string;
}

export interface Tag {
  id: string;
  name: string;
  userEmail: string;
}

interface LocalDB {
  notes: Note[];
  inspirations: Inspiration[];
  resources: Resource[];
  categories: Category[];
  tags: Tag[];
}

// Default initial database
const defaultDb: LocalDB = {
  notes: [
    {
      id: 'note-1',
      title: 'Welcome to SaynIQ Notes!',
      content: 'SaynIQ Notes is your personal knowledge hub. You can write markdown, tag items, set categories, and sync everything directly to a Google Sheet.',
      tags: ['Getting Started', 'Guide'],
      category: 'General',
      isPinned: true,
      isArchived: false,
      userEmail: 'demo@sayniq.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ],
  inspirations: [
    {
      id: 'insp-1',
      title: 'Power BI Executive Dashboard',
      description: 'Sleek dark-mode dashboard concept with neon highlights and clean KPI layouts.',
      category: 'Data Visualization',
      tags: ['Power BI', 'Dark Mode', 'KPIs'],
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
      referenceUrl: 'https://dribbble.com',
      userEmail: 'demo@sayniq.com',
      createdAt: new Date().toISOString(),
    }
  ],
  resources: [
    {
      id: 'res-1',
      title: 'Microsoft Fabric Documentation',
      url: 'https://learn.microsoft.com/en-us/fabric/',
      description: 'Official Microsoft documentation for Fabric - SaaS multi-cloud data lakehouse architecture.',
      category: 'Microsoft Fabric',
      tags: ['Fabric', 'Data Lakehouse', 'Docs'],
      rating: 5,
      isFavorite: true,
      userEmail: 'demo@sayniq.com',
      createdAt: new Date().toISOString(),
    }
  ],
  categories: [
    { id: 'cat-1', name: 'General', type: 'note', userEmail: 'demo@sayniq.com' },
    { id: 'cat-2', name: 'Data Visualization', type: 'inspiration', userEmail: 'demo@sayniq.com' },
    { id: 'cat-3', name: 'Microsoft Fabric', type: 'resource', userEmail: 'demo@sayniq.com' },
  ],
  tags: [
    { id: 'tag-1', name: 'Getting Started', userEmail: 'demo@sayniq.com' },
    { id: 'tag-2', name: 'Power BI', userEmail: 'demo@sayniq.com' },
    { id: 'tag-3', name: 'Fabric', userEmail: 'demo@sayniq.com' },
  ]
};

// ----------------------------------------------------
// Local File Storage Utilities
// ----------------------------------------------------
async function getLocalDB(): Promise<LocalDB> {
  try {
    const data = await fs.readFile(LOCAL_DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, create it with default data
    await fs.mkdir(path.dirname(LOCAL_DB_PATH), { recursive: true });
    await fs.writeFile(LOCAL_DB_PATH, JSON.stringify(defaultDb, null, 2), 'utf-8');
    return defaultDb;
  }
}

async function saveLocalDB(db: LocalDB): Promise<void> {
  await fs.mkdir(path.dirname(LOCAL_DB_PATH), { recursive: true });
  await fs.writeFile(LOCAL_DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

// ----------------------------------------------------
// Google Sheets Client Setup
// ----------------------------------------------------
async function getSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY
    ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  if (!email || !privateKey || !SPREADSHEET_ID) {
    return null;
  }

  try {
    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return google.sheets({ version: 'v4', auth });
  } catch (error) {
    console.error('Error creating Google Sheets client:', error);
    return null;
  }
}

// Make sure sheets exist and write headers if they are empty
async function ensureSheetsInitialized(sheets: any): Promise<void> {
  if (!SPREADSHEET_ID) return;
  
  try {
    const metadata = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const existingSheets = metadata.data.sheets?.map((s: any) => s.properties?.title) || [];
    
    const requiredSheets = ['Notes', 'Inspirations', 'Resources', 'Categories', 'Tags'];
    const addRequests: any[] = [];
    
    for (const sheetName of requiredSheets) {
      if (!existingSheets.includes(sheetName)) {
        addRequests.push({
          addSheet: {
            properties: { title: sheetName }
          }
        });
      }
    }
    
    if (addRequests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: { requests: addRequests }
      });
    }

    // Now verify and add headers if they don't exist
    const sheetHeaders: Record<string, string[]> = {
      Notes: ['ID', 'Title', 'Content', 'Tags', 'Category', 'Pinned', 'Archived', 'UserEmail', 'CreatedAt', 'UpdatedAt'],
      Inspirations: ['ID', 'Title', 'Description', 'Category', 'Tags', 'ImageURL', 'ReferenceURL', 'UserEmail', 'CreatedAt'],
      Resources: ['ID', 'Title', 'URL', 'Description', 'Category', 'Tags', 'Rating', 'Favorite', 'UserEmail', 'CreatedAt'],
      Categories: ['ID', 'Name', 'Type', 'UserEmail'],
      Tags: ['ID', 'Name', 'UserEmail']
    };

    for (const sheetName of requiredSheets) {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A1:J1`,
      });

      if (!response.data.values || response.data.values.length === 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${sheetName}!A1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [sheetHeaders[sheetName]]
          }
        });
      }
    }
  } catch (error) {
    console.error('Error ensuring sheets initialization:', error);
  }
}

// ----------------------------------------------------
// CRUD Adapter Layer (Google Sheets with Local DB Fallback)
// ----------------------------------------------------

export async function fetchAllData(userEmail: string) {
  const sheets = await getSheetsClient();
  
  if (!sheets || !SPREADSHEET_ID) {
    console.log('Using local mock database (Google Sheets credentials not set)');
    const db = await getLocalDB();
    return {
      notes: db.notes.filter(n => n.userEmail === userEmail),
      inspirations: db.inspirations.filter(i => i.userEmail === userEmail),
      resources: db.resources.filter(r => r.userEmail === userEmail),
      categories: db.categories.filter(c => c.userEmail === userEmail),
      tags: db.tags.filter(t => t.userEmail === userEmail)
    };
  }

  try {
    await ensureSheetsInitialized(sheets);

    const ranges = ['Notes!A2:J', 'Inspirations!A2:I', 'Resources!A2:J', 'Categories!A2:D', 'Tags!A2:C'];
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: SPREADSHEET_ID,
      ranges,
    });

    const valueRanges = response.data.valueRanges || [];
    
    // Helper to parse tags
    const parseTags = (tagStr: string): string[] => {
      if (!tagStr) return [];
      try {
        return JSON.parse(tagStr);
      } catch {
        return tagStr.split(',').map(t => t.trim()).filter(Boolean);
      }
    };

    // 1. Notes
    const notesRows = valueRanges[0]?.values || [];
    const notes: Note[] = notesRows
      .map(row => ({
        id: row[0],
        title: row[1] || '',
        content: row[2] || '',
        tags: parseTags(row[3]),
        category: row[4] || 'General',
        isPinned: row[5] === 'TRUE',
        isArchived: row[6] === 'TRUE',
        userEmail: row[7] || '',
        createdAt: row[8] || new Date().toISOString(),
        updatedAt: row[9] || new Date().toISOString(),
      }))
      .filter(n => n.userEmail === userEmail);

    // 2. Inspirations
    const inspRows = valueRanges[1]?.values || [];
    const inspirations: Inspiration[] = inspRows
      .map(row => ({
        id: row[0],
        title: row[1] || '',
        description: row[2] || '',
        category: row[3] || 'General',
        tags: parseTags(row[4]),
        imageUrl: row[5] || '',
        referenceUrl: row[6] || '',
        userEmail: row[7] || '',
        createdAt: row[8] || new Date().toISOString(),
      }))
      .filter(i => i.userEmail === userEmail);

    // 3. Resources
    const resRows = valueRanges[2]?.values || [];
    const resources: Resource[] = resRows
      .map(row => ({
        id: row[0],
        title: row[1] || '',
        url: row[2] || '',
        description: row[3] || '',
        category: row[4] || 'General',
        tags: parseTags(row[5]),
        rating: Number(row[6]) || 0,
        isFavorite: row[7] === 'TRUE',
        userEmail: row[8] || '',
        createdAt: row[9] || new Date().toISOString(),
      }))
      .filter(r => r.userEmail === userEmail);

    // 4. Categories
    const catRows = valueRanges[3]?.values || [];
    const categories: Category[] = catRows
      .map(row => ({
        id: row[0],
        name: row[1] || '',
        type: (row[2] as any) || 'note',
        userEmail: row[3] || '',
      }))
      .filter(c => c.userEmail === userEmail);

    // 5. Tags
    const tagsRows = valueRanges[4]?.values || [];
    const tags: Tag[] = tagsRows
      .map(row => ({
        id: row[0],
        name: row[1] || '',
        userEmail: row[2] || '',
      }))
      .filter(t => t.userEmail === userEmail);

    return { notes, inspirations, resources, categories, tags };
  } catch (error) {
    console.error('Failed to fetch from Google Sheets, falling back to local database:', error);
    const db = await getLocalDB();
    return {
      notes: db.notes.filter(n => n.userEmail === userEmail),
      inspirations: db.inspirations.filter(i => i.userEmail === userEmail),
      resources: db.resources.filter(r => r.userEmail === userEmail),
      categories: db.categories.filter(c => c.userEmail === userEmail),
      tags: db.tags.filter(t => t.userEmail === userEmail)
    };
  }
}

// ----------------------------------------------------
// Mutations (Add, Update, Delete)
// ----------------------------------------------------

async function syncToGoogleSheets(sheetName: string, items: any[], headers: string[]) {
  const sheets = await getSheetsClient();
  if (!sheets || !SPREADSHEET_ID) return false;

  try {
    // Overwrite the entire range with fresh data (including headers)
    const rows = [headers, ...items];
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:Z`,
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: rows }
    });
    return true;
  } catch (error) {
    console.error(`Failed to sync ${sheetName} to Google Sheets:`, error);
    return false;
  }
}

export async function saveNote(note: Note): Promise<void> {
  const db = await getLocalDB();
  const index = db.notes.findIndex(n => n.id === note.id);
  
  if (index >= 0) {
    db.notes[index] = note;
  } else {
    db.notes.push(note);
  }
  await saveLocalDB(db);

  // Sync to Google Sheets
  const sheets = await getSheetsClient();
  if (sheets && SPREADSHEET_ID) {
    // Fetch all notes first to merge the change with other users' notes (if multi-user)
    const metadata = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Notes!A2:J',
    });
    const rows = existing.data.values || [];
    let updatedRows = [...rows];
    const rowIdx = updatedRows.findIndex(r => r[0] === note.id);
    
    const noteRow = [
      note.id,
      note.title,
      note.content,
      JSON.stringify(note.tags),
      note.category,
      note.isPinned ? 'TRUE' : 'FALSE',
      note.isArchived ? 'TRUE' : 'FALSE',
      note.userEmail,
      note.createdAt,
      note.updatedAt
    ];

    if (rowIdx >= 0) {
      updatedRows[rowIdx] = noteRow;
    } else {
      updatedRows.push(noteRow);
    }

    await syncToGoogleSheets(
      'Notes', 
      updatedRows, 
      ['ID', 'Title', 'Content', 'Tags', 'Category', 'Pinned', 'Archived', 'UserEmail', 'CreatedAt', 'UpdatedAt']
    );
  }
}

export async function deleteNote(id: string, userEmail: string): Promise<void> {
  const db = await getLocalDB();
  db.notes = db.notes.filter(n => !(n.id === id && n.userEmail === userEmail));
  await saveLocalDB(db);

  const sheets = await getSheetsClient();
  if (sheets && SPREADSHEET_ID) {
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Notes!A2:J',
    });
    const rows = existing.data.values || [];
    const filteredRows = rows.filter(r => !(r[0] === id && r[7] === userEmail));
    await syncToGoogleSheets(
      'Notes',
      filteredRows,
      ['ID', 'Title', 'Content', 'Tags', 'Category', 'Pinned', 'Archived', 'UserEmail', 'CreatedAt', 'UpdatedAt']
    );
  }
}

export async function saveInspiration(insp: Inspiration): Promise<void> {
  const db = await getLocalDB();
  const index = db.inspirations.findIndex(i => i.id === insp.id);
  
  if (index >= 0) {
    db.inspirations[index] = insp;
  } else {
    db.inspirations.push(insp);
  }
  await saveLocalDB(db);

  const sheets = await getSheetsClient();
  if (sheets && SPREADSHEET_ID) {
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Inspirations!A2:I',
    });
    const rows = existing.data.values || [];
    let updatedRows = [...rows];
    const rowIdx = updatedRows.findIndex(r => r[0] === insp.id);
    
    const rowData = [
      insp.id,
      insp.title,
      insp.description,
      insp.category,
      JSON.stringify(insp.tags),
      insp.imageUrl,
      insp.referenceUrl,
      insp.userEmail,
      insp.createdAt
    ];

    if (rowIdx >= 0) {
      updatedRows[rowIdx] = rowData;
    } else {
      updatedRows.push(rowData);
    }

    await syncToGoogleSheets(
      'Inspirations',
      updatedRows,
      ['ID', 'Title', 'Description', 'Category', 'Tags', 'ImageURL', 'ReferenceURL', 'UserEmail', 'CreatedAt']
    );
  }
}

export async function deleteInspiration(id: string, userEmail: string): Promise<void> {
  const db = await getLocalDB();
  db.inspirations = db.inspirations.filter(i => !(i.id === id && i.userEmail === userEmail));
  await saveLocalDB(db);

  const sheets = await getSheetsClient();
  if (sheets && SPREADSHEET_ID) {
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Inspirations!A2:I',
    });
    const rows = existing.data.values || [];
    const filteredRows = rows.filter(r => !(r[0] === id && r[7] === userEmail));
    await syncToGoogleSheets(
      'Inspirations',
      filteredRows,
      ['ID', 'Title', 'Description', 'Category', 'Tags', 'ImageURL', 'ReferenceURL', 'UserEmail', 'CreatedAt']
    );
  }
}

export async function saveResource(res: Resource): Promise<void> {
  const db = await getLocalDB();
  const index = db.resources.findIndex(r => r.id === res.id);
  
  if (index >= 0) {
    db.resources[index] = res;
  } else {
    db.resources.push(res);
  }
  await saveLocalDB(db);

  const sheets = await getSheetsClient();
  if (sheets && SPREADSHEET_ID) {
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Resources!A2:J',
    });
    const rows = existing.data.values || [];
    let updatedRows = [...rows];
    const rowIdx = updatedRows.findIndex(r => r[0] === res.id);
    
    const rowData = [
      res.id,
      res.title,
      res.url,
      res.description,
      res.category,
      JSON.stringify(res.tags),
      res.rating.toString(),
      res.isFavorite ? 'TRUE' : 'FALSE',
      res.userEmail,
      res.createdAt
    ];

    if (rowIdx >= 0) {
      updatedRows[rowIdx] = rowData;
    } else {
      updatedRows.push(rowData);
    }

    await syncToGoogleSheets(
      'Resources',
      updatedRows,
      ['ID', 'Title', 'URL', 'Description', 'Category', 'Tags', 'Rating', 'Favorite', 'UserEmail', 'CreatedAt']
    );
  }
}

export async function deleteResource(id: string, userEmail: string): Promise<void> {
  const db = await getLocalDB();
  db.resources = db.resources.filter(r => !(r.id === id && r.userEmail === userEmail));
  await saveLocalDB(db);

  const sheets = await getSheetsClient();
  if (sheets && SPREADSHEET_ID) {
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Resources!A2:J',
    });
    const rows = existing.data.values || [];
    const filteredRows = rows.filter(r => !(r[0] === id && r[8] === userEmail));
    await syncToGoogleSheets(
      'Resources',
      filteredRows,
      ['ID', 'Title', 'URL', 'Description', 'Category', 'Tags', 'Rating', 'Favorite', 'UserEmail', 'CreatedAt']
    );
  }
}

export async function addCategory(category: Category): Promise<void> {
  const db = await getLocalDB();
  if (!db.categories.some(c => c.name.toLowerCase() === category.name.toLowerCase() && c.type === category.type && c.userEmail === category.userEmail)) {
    db.categories.push(category);
    await saveLocalDB(db);

    const sheets = await getSheetsClient();
    if (sheets && SPREADSHEET_ID) {
      const existing = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Categories!A2:D',
      });
      const rows = existing.data.values || [];
      const updatedRows = [...rows, [category.id, category.name, category.type, category.userEmail]];
      await syncToGoogleSheets('Categories', updatedRows, ['ID', 'Name', 'Type', 'UserEmail']);
    }
  }
}

export async function addTag(tag: Tag): Promise<void> {
  const db = await getLocalDB();
  if (!db.tags.some(t => t.name.toLowerCase() === tag.name.toLowerCase() && t.userEmail === tag.userEmail)) {
    db.tags.push(tag);
    await saveLocalDB(db);

    const sheets = await getSheetsClient();
    if (sheets && SPREADSHEET_ID) {
      const existing = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Tags!A2:C',
      });
      const rows = existing.data.values || [];
      const updatedRows = [...rows, [tag.id, tag.name, tag.userEmail]];
      await syncToGoogleSheets('Tags', updatedRows, ['ID', 'Name', 'UserEmail']);
    }
  }
}
