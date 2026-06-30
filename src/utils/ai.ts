export interface AISummaryAndStudy {
  summary: {
    tldr: string;
    keyTakeaways: string[];
  };
  study: {
    eli5: string;
    glossary: { term: string; definition: string }[];
    quiz: {
      question: string;
      options: string[];
      correctAnswerIndex: number;
      explanation: string;
    }[];
  };
}

export interface AISettings {
  provider: 'gemini' | 'openai';
  apiKey: string;
  baseUrl: string;
  model: string;
  autoSummarize: boolean;
  enableAI: boolean;
}

export function getAISettings(): AISettings {
  const provider = (localStorage.getItem('feedmind_ai_provider') as 'gemini' | 'openai') || 'gemini';
  const apiKey = localStorage.getItem('feedmind_ai_key') || '';
  const baseUrl = localStorage.getItem('feedmind_ai_url') || '';
  const model = localStorage.getItem('feedmind_ai_model') || '';
  const autoSummarize = localStorage.getItem('feedmind_ai_auto_summarize') !== 'false';
  const enableAI = localStorage.getItem('feedmind_ai_enabled') !== 'false';

  return {
    provider,
    apiKey,
    baseUrl,
    model,
    autoSummarize,
    enableAI
  };
}

export function saveAISettings(settings: Partial<AISettings>) {
  if (settings.provider !== undefined) localStorage.setItem('feedmind_ai_provider', settings.provider);
  if (settings.apiKey !== undefined) localStorage.setItem('feedmind_ai_key', settings.apiKey);
  if (settings.baseUrl !== undefined) localStorage.setItem('feedmind_ai_url', settings.baseUrl);
  if (settings.model !== undefined) localStorage.setItem('feedmind_ai_model', settings.model);
  if (settings.autoSummarize !== undefined) localStorage.setItem('feedmind_ai_auto_summarize', String(settings.autoSummarize));
  if (settings.enableAI !== undefined) localStorage.setItem('feedmind_ai_enabled', String(settings.enableAI));
}

export async function generateAISummaryAndStudy(title: string, textContent: string): Promise<AISummaryAndStudy> {
  const settings = getAISettings();
  if (!settings.apiKey) {
    throw new Error('API Key is missing. Please add it in settings.');
  }

  const prompt = `You are an educational assistant in a tech and developer news aggregator app called FeedMind.
Your task is to analyze the following article and generate educational/summarization metadata in strict JSON format.

Article Title: "${title}"
Article Content:
${textContent.substring(0, 10000)}

Please return a JSON object with the following structure, and do not include any markdown formatting, code block markers, or text outside the JSON object:
{
  "summary": {
    "tldr": "A 1-sentence summary of the main point of the article.",
    "keyTakeaways": [
      "Key point 1",
      "Key point 2",
      "Key point 3"
    ]
  },
  "study": {
    "eli5": "A simple explanation of the core concept as if explaining to a 5-year old, using analogies if appropriate.",
    "glossary": [
      {
        "term": "Jargon or concept term 1",
        "definition": "Definition or explanation of term 1 in simple words."
      },
      {
        "term": "Jargon or concept term 2",
        "definition": "Definition or explanation of term 2."
      },
      {
        "term": "Jargon or concept term 3",
        "definition": "Definition or explanation of term 3."
      }
    ],
    "quiz": [
      {
        "question": "A multiple-choice question testing understanding of a key concept from the article.",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswerIndex": 0,
        "explanation": "Brief explanation of why the correct option is right."
      },
      {
        "question": "Another multiple-choice question.",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswerIndex": 1,
        "explanation": "Brief explanation."
      },
      {
        "question": "A third multiple-choice question.",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswerIndex": 2,
        "explanation": "Brief explanation."
      }
    ]
  }
}

Ensure the output is valid, parsable JSON matching this schema exactly.`;

  if (settings.provider === 'gemini') {
    const model = settings.model || 'gemini-1.5-flash';
    const host = settings.baseUrl || 'https://generativelanguage.googleapis.com';
    const url = `${host}/v1beta/models/${model}:generateContent?key=${settings.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error (${response.status}): ${errorText || response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Gemini API returned an empty response.');
    }

    return parseJSONResponse(text);
  } else {
    // OpenAI-Compatible Provider (with auto-detection for Groq & OpenRouter keys)
    let host = settings.baseUrl;
    let model = settings.model;

    if (!host) {
      if (settings.apiKey.startsWith('gsk_')) {
        host = 'https://api.groq.com/openai/v1';
      } else if (settings.apiKey.startsWith('sk-or-v1-')) {
        host = 'https://openrouter.ai/api/v1';
      } else {
        host = 'https://api.openai.com/v1';
      }
    }

    if (!model) {
      if (settings.apiKey.startsWith('gsk_')) {
        model = 'llama-3.3-70b-versatile';
      } else if (settings.apiKey.startsWith('sk-or-v1-')) {
        model = 'google/gemini-2.5-flash';
      } else {
        model = 'gpt-4o-mini';
      }
    }

    const url = `${host}/chat/completions`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API Error (${response.status}): ${errorText || response.statusText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error('OpenAI API returned an empty response.');
    }

    return parseJSONResponse(text);
  }
}

function parseJSONResponse(text: string): AISummaryAndStudy {
  // Clean potential markdown blocks if API did not respect config
  let cleanText = text.trim();
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.substring(7);
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.substring(3);
  }
  if (cleanText.endsWith('```')) {
    cleanText = cleanText.substring(0, cleanText.length - 3);
  }
  cleanText = cleanText.trim();

  try {
    const parsed = JSON.parse(cleanText);
    
    // Validate structural requirements to prevent runtime crashes
    if (!parsed.summary || typeof parsed.summary !== 'object') {
      parsed.summary = { tldr: 'Summary generation failed.', keyTakeaways: [] };
    }
    if (!parsed.summary.tldr) parsed.summary.tldr = 'No summary available.';
    if (!Array.isArray(parsed.summary.keyTakeaways)) parsed.summary.keyTakeaways = [];

    if (!parsed.study || typeof parsed.study !== 'object') {
      parsed.study = { eli5: 'ELI5 generation failed.', glossary: [], quiz: [] };
    }
    if (!parsed.study.eli5) parsed.study.eli5 = 'No simplified explanation available.';
    if (!Array.isArray(parsed.study.glossary)) parsed.study.glossary = [];
    if (!Array.isArray(parsed.study.quiz)) parsed.study.quiz = [];

    return parsed as AISummaryAndStudy;
  } catch (e: any) {
    console.error('Failed to parse AI response as JSON:', text);
    throw new Error(`Failed to parse AI response: ${e.message}`);
  }
}
