import { Open5eApiError } from './open5e';

export interface SpellData {
  name?: string;
  desc?: string;
  higher_level?: string;
  material?: string;
  duration?: string;
  casting_time?: string;
  school?: string;
  range?: string;
  level?: string;
  dnd_class?: string;
  spell_lists?: unknown;
  archetype?: string;
  [key: string]: unknown;
}

function getGroqApiKey(): string | undefined {
  if (typeof process !== 'undefined' && process.env?.GROQ_API_KEY) {
    return process.env.GROQ_API_KEY;
  }
  if (typeof globalThis !== 'undefined' && Azion?.env?.get) {
    return Azion.env.get('GROQ_API_KEY');
  }
  return undefined;
}

/**
 * Service responsible for translating text fields of a spell using the Groq API.
 *
 * Groq is used instead of Azion AI Inference due to usage limitations on paid Azion plans.
 * Model: llama-3.3-70b-versatile — best free model on Groq for multilingual translation tasks,
 * with 128K context and strong instruction-following across languages.
 */
export async function translateSpellFields(
  originalSpell: SpellData,
  targetLocale: string,
): Promise<SpellData & { locale: string }> {
  const fieldsToTranslate = {
    name: originalSpell.name,
    desc: originalSpell.desc,
    higher_level: originalSpell.higher_level,
    material: originalSpell.material,
    duration: originalSpell.duration,
    casting_time: originalSpell.casting_time,
    school: originalSpell.school,
    range: originalSpell.range,
    level: originalSpell.level,
    dnd_class: originalSpell.dnd_class,
    spell_lists: originalSpell.spell_lists,
    archetype: originalSpell.archetype,
  };

  const systemPrompt = `You are a strict technical translator for the Dungeons & Dragons 5th Edition tabletop role-playing game rules.
Your task is to translate the values of a JSON object from English to the target locale: '${targetLocale}'.
Preserve all formatting such as markdown or D&D 5e specific terminology appropriately.
Do NOT translate the JSON keys. Keep the keys exactly as they are.
Respond ONLY with the translated JSON object. Absolutely no conversational text or markdown code blocks (like \`\`\`json) outside the pure JSON.`;

  const userPrompt = JSON.stringify(fieldsToTranslate);

  try {
    const apiKey = getGroqApiKey();
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is not set.');
    }

    const MODEL_ID = 'llama-3.3-70b-versatile';
    console.log(`[AI] Running Groq inference with model '${MODEL_ID}'...`);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`[AI] Groq response received.`);

    let rawOutput: string = data.choices[0].message.content;

    // Cleanup: Some LLMs stubbornly put ```json ... ``` wrapper.
    if (rawOutput.startsWith('```json')) {
      rawOutput = rawOutput.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (rawOutput.startsWith('```')) {
      rawOutput = rawOutput.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    const translatedFields = JSON.parse(rawOutput.trim());

    return {
      ...originalSpell,
      ...translatedFields,
      locale: targetLocale,
    };
  } catch (error) {
    console.error('Translation failed:', error);
    throw new Open5eApiError('Failed to translate spell content using AI.', 502, false);
  }
}
