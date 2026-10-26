/**
 * quick-responder — Madi AI chat (Gemini) for Nomadiqe iOS
 *
 * Secrets: GEMINI_API_KEY
 * Deploy:  supabase functions deploy quick-responder
 */

import { SYSTEM_INSTRUCTION } from './systemInstruction.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_MODEL = 'gemini-3.1-flash-lite';
const MAX_HISTORY_TURNS = 12;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// property_guides columns, with the label Gemini sees for each one
const GUIDE_FIELDS: Array<[string, string]> = [
  ['check_in_out', 'Check-in / check-out'],
  ['how_to_get_there', 'How to get there'],
  ['wifi', 'Wi-Fi'],
  ['transportation', 'Transportation'],
  ['good_to_know', 'Good to know'],
  ['what_to_do', 'What to do nearby'],
  ['restaurants', 'Recommended restaurants'],
  ['bars', 'Recommended bars'],
  ['property_rules', 'Property rules'],
  ['emergency_numbers', 'Emergency numbers'],
];

// Blueprint for the chat history
interface HistoryEntry {
  role: 'user' | 'model'; // who sent the message
  text: string; // the message
}

// Converts raw data to JSON and sets the response headers
function jsonResponse(body: Record<string, unknown>, status = 200): Response { // must return a Response object
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

// cleaner function to normalize the history array
function normalizeHistory(raw: unknown): HistoryEntry[] { // will return an array that follows the HistoryEntry interface
  if (!Array.isArray(raw)) return [];

  const entries: HistoryEntry[] = [];
  
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const record = item as { role?: unknown; text?: unknown };
    const text = typeof record.text === 'string' ? record.text.trim() : '';
    if (!text) continue;

    // add the user's message to the history array
    if (record.role === 'user') {
      entries.push({ role: 'user', text });
    } else if (record.role === 'model' || record.role === 'ai' || record.role === 'admin') {
      entries.push({
        role: 'model',
        text: record.role === 'admin' ? `[Nomadiqe Support Team]: ${text}` : text,
      });
    }
  }

  return entries.slice(-MAX_HISTORY_TURNS);
}

// Reads the guide for one property through PostgREST, forwarding the caller's JWT
// so row level security decides whether they may see it. Returns null when the
// guide is missing, empty, or the caller has no access.
async function fetchPropertyGuide(
  propertyId: string,
  authHeader: string
): Promise<Record<string, string> | null> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !anonKey) {
    console.error('SUPABASE_URL or SUPABASE_ANON_KEY is missing in the Edge Function environment');
    return null;
  }

  const columns = GUIDE_FIELDS.map(([column]) => column).join(',');
  const url =
    `${supabaseUrl}/rest/v1/property_guides` +
    `?select=${columns}&property_id=eq.${encodeURIComponent(propertyId)}&limit=1`;

  const res = await fetch(url, {
    headers: {
      apikey: anonKey,
      Authorization: authHeader,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    console.error('property_guides fetch failed:', res.status, await res.text());
    return null;
  }

  const rows = (await res.json()) as Record<string, string>[];
  return rows[0] ?? null;
}

// Turns a guide row into the extra system instruction block for this property
function buildGuideInstruction(guide: Record<string, string>): string | null {
  const sections = GUIDE_FIELDS
    .map(([column, label]) => [label, (guide[column] ?? '').trim()] as const)
    .filter(([, value]) => value.length > 0)
    .map(([label, value]) => `${label}: ${value}`);

  if (sections.length === 0) return null;

  return [
    '',
    'PROPERTY GUIDE FOR THE CURRENT CONVERSATION:',
    'The host wrote the details below for this specific property. Treat them as the source of truth',
    'for questions about this stay, and quote them exactly (Wi-Fi passwords, times, phone numbers).',
    'Anything covered by this guide is in scope, including the local recommendations, so do not',
    'decline it as off-topic. If the guest asks something the guide does not cover, say so and',
    'suggest contacting the host.',
    '',
    ...sections,
  ].join('\n');
}

// builds the contents array for the Gemini API request
function buildGeminiContents(history: HistoryEntry[], message: string) {
  const contents = history.map((entry) => ({
    role: entry.role,
    parts: [{ text: entry.text }],
  }));

  // add the user's message to the contents array
  contents.push({
    role: 'user',
    parts: [{ text: message }],
  });

  return contents;
}

// main function to handle the request
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  // parses incoming JSON body and extracts the message
  try {
    const body = await req.json();
    const message = typeof body?.message === 'string' ? body.message.trim() : '';

    if (!message) {
      return jsonResponse({ error: 'Message is required' }, 400);
    }

    const propertyId = typeof body?.property_id === 'string' ? body.property_id.trim() : '';
    if (propertyId && !UUID_PATTERN.test(propertyId)) {
      return jsonResponse({ error: 'property_id must be a UUID' }, 400);
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('GEMINI_API_KEY is missing in Edge Function Secrets');
      return jsonResponse({ error: 'GEMINI_API_KEY secret is not configured' }, 500);
    }
    // Runs the cleanup and packaging helpers on incoming request
    const history = normalizeHistory(body?.history);
    const contents = buildGeminiContents(history, message);

    // Personalise the assistant with the host's own property guide when the app
    // sends a property_id. A failure here must not break the generic chat.
    let systemInstruction = SYSTEM_INSTRUCTION;
    const authHeader = req.headers.get('Authorization');
    if (propertyId && authHeader) {
      try {
        const guide = await fetchPropertyGuide(propertyId, authHeader);
        const guideInstruction = guide ? buildGuideInstruction(guide) : null;
        if (guideInstruction) systemInstruction += guideInstruction;
      } catch (guideError) {
        console.error('Could not load property guide context:', guideError);
      }
    }

    const geminiUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    // POST request to the Google's generateContent endpoint with the Gemini request body and sets the headers to JSON and the body to the Gemini request body
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }],
        },
        contents,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 300,
      thinkingConfig: {
        thinkingLevel: "minimal",
      },
        },
      }),
    });
    // parses the response from the Gemini API 
    const geminiData = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error('Gemini API Error:', geminiData);
      return jsonResponse(
        { error: geminiData.error?.message || 'Gemini API call failed' },
        geminiRes.status
      );
    }

    // extracts Madi's response from the API response
    const reply =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text ||
      'No response from Gemini.';

    // returns the AI response as JSON
    return jsonResponse({ reply });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Edge Function Unexpected Error:', error);
    return jsonResponse({ error: message }, 500);
  }
});
