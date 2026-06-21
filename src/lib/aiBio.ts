/**
 * AI bio enhancer — no API key required.
 * Uses Hugging Face free Inference API (no sign-in for small models).
 * Falls back to a smart rule-based rewriter if the network call fails.
 */

const HF_URL =
  'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2';

function ruleBasedEnhance(raw: string, name: string, title: string): string {
  const s = raw.trim().replace(/\.+$/, '');
  const rolePhrase = title ? `${title.toLowerCase()} ` : '';
  const connectors = [
    `Passionate ${rolePhrase}with a knack for building things that matter.`,
    `A ${rolePhrase}who loves turning ideas into polished products.`,
    `${rolePhrase.charAt(0).toUpperCase() + rolePhrase.slice(1)}focused on craft, clarity, and impact.`,
  ];
  const opener = connectors[Math.floor(Math.random() * connectors.length)];
  // Capitalise first letter, tidy punctuation
  const cleaned = s.charAt(0).toUpperCase() + s.slice(1);
  return `${opener} ${cleaned}.`;
}

export async function enhanceBio(
  raw: string,
  name: string,
  title: string
): Promise<string> {
  const prompt = `<s>[INST] Rewrite this short professional bio in 1-2 punchy sentences. Keep it in third person, confident, and human — no clichés. Name: ${name}. Role: ${title}. Bio: "${raw}" [/INST]`;
  try {
    const res = await fetch(HF_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { max_new_tokens: 120, temperature: 0.7, return_full_text: false },
      }),
    });
    if (!res.ok) throw new Error('HF error');
    const data = await res.json();
    const text: string =
      (Array.isArray(data) ? data[0]?.generated_text : data?.generated_text) ?? '';
    // Strip the prompt echo if returned
    const clean = text.replace(/^.*\[\/?INST\]/s, '').trim();
    if (clean.length > 10) return clean;
    throw new Error('empty');
  } catch {
    return ruleBasedEnhance(raw, name, title);
  }
}
