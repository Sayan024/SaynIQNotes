// Service for Gemini AI integration using native fetch API to avoid library version conflicts

export async function askGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey.includes('your-gemini-api-key')) {
    return ''; // Return empty to trigger mock fallback
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.warn(`Gemini API returned status ${response.status}`);
      return '';
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    console.error('Error contacting Gemini API:', error);
    return '';
  }
}

// ----------------------------------------------------
// AI Assistant Helper Functions
// ----------------------------------------------------

export async function summarizeNote(content: string): Promise<string> {
  const cleanedContent = content.replace(/<[^>]*>/g, '').trim(); // strip html tags
  if (!cleanedContent) return 'Empty note.';

  const prompt = `Summarize the following note content in 2-3 sentences. Keep it clear, concise, and professional:\n\n${cleanedContent}`;
  const response = await askGemini(prompt);
  
  if (response) return response.trim();

  // Smart Mock Fallback
  const sentences = cleanedContent.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  if (sentences.length <= 2) {
    return cleanedContent;
  }
  return `${sentences[0]}. ${sentences[1]}. (AI Mock Summary)`;
}

export async function generateTags(title: string, content: string): Promise<string[]> {
  const cleanedContent = content.replace(/<[^>]*>/g, '').trim();
  const prompt = `Based on the title "${title}" and the content below, suggest 3 to 5 highly relevant single-word tags. Return ONLY a comma-separated list of tags, nothing else.\n\nContent:\n${cleanedContent}`;
  const response = await askGemini(prompt);

  if (response) {
    return response
      .split(',')
      .map(t => t.trim().replace(/[#._-]/g, ''))
      .filter(t => t.length > 0 && t.length < 20)
      .slice(0, 5);
  }

  // Smart Mock Fallback
  const tagsSet = new Set<string>();
  const words = `${title} ${cleanedContent}`.toLowerCase().split(/\W+/);
  
  const techKeywords = ['powerbi', 'fabric', 'sql', 'react', 'nextjs', 'typescript', 'ai', 'dashboard', 'python', 'analytics', 'azure', 'git', 'css', 'design'];
  for (const word of words) {
    if (techKeywords.includes(word)) {
      tagsSet.add(word.charAt(0).toUpperCase() + word.slice(1));
    }
  }

  if (tagsSet.size === 0) {
    tagsSet.add('General');
    tagsSet.add('Reference');
  }

  return Array.from(tagsSet).slice(0, 4);
}

export async function suggestCategory(title: string, content: string): Promise<string> {
  const cleanedContent = content.replace(/<[^>]*>/g, '').trim();
  const prompt = `Based on the title "${title}" and the content below, suggest the single best category. Return ONLY the category name (1-3 words), nothing else.\n\nContent:\n${cleanedContent}`;
  const response = await askGemini(prompt);

  if (response) {
    return response.trim();
  }

  // Smart Mock Fallback
  const combinedText = `${title} ${cleanedContent}`.toLowerCase();
  if (combinedText.includes('powerbi') || combinedText.includes('dashboard') || combinedText.includes('chart') || combinedText.includes('visualization')) {
    return 'Data Visualization';
  }
  if (combinedText.includes('fabric') || combinedText.includes('lakehouse') || combinedText.includes('warehouse')) {
    return 'Microsoft Fabric';
  }
  if (combinedText.includes('sql') || combinedText.includes('database') || combinedText.includes('query')) {
    return 'SQL & Databases';
  }
  if (combinedText.includes('react') || combinedText.includes('nextjs') || combinedText.includes('tailwind') || combinedText.includes('css')) {
    return 'Web Development';
  }
  if (combinedText.includes('ai') || combinedText.includes('gemini') || combinedText.includes('gpt') || combinedText.includes('llm')) {
    return 'AI & ML';
  }
  
  return 'General';
}

export async function generateTitle(content: string): Promise<string> {
  const cleanedContent = content.replace(/<[^>]*>/g, '').trim();
  if (!cleanedContent) return 'Untitled Note';

  const prompt = `Create a short, catchy, and professional title (max 6 words) for a note with this content. Return ONLY the title, nothing else.\n\nContent:\n${cleanedContent}`;
  const response = await askGemini(prompt);

  if (response) {
    return response.trim().replace(/^["']|["']$/g, ''); // strip outer quotes
  }

  // Smart Mock Fallback
  const firstLine = cleanedContent.split(/[.!?\n]+/)[0]?.trim() || '';
  if (firstLine.length > 5 && firstLine.length < 50) {
    return firstLine;
  }
  return 'Draft Note ' + new Date().toLocaleDateString();
}
