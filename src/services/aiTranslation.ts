import { Open5eApiError } from './open5e';

export interface SpellData {
  name?: string;
  desc?: string;
  higher_level?: string;
  material?: string;
  duration?: string;
  casting_time?: string;
  school?: string;
  [key: string]: unknown;
}

/**
 * Service responsible for translating text fields of a spell using Azion AI Inference.
 */
export async function translateSpellFields(
  originalSpell: SpellData,
  targetLocale: string,
): Promise<SpellData & { locale: string }> {
  // Fields that actually need translation
  const fieldsToTranslate = {
    name: originalSpell.name,
    desc: originalSpell.desc,
    higher_level: originalSpell.higher_level,
    material: originalSpell.material,
    duration: originalSpell.duration,
    casting_time: originalSpell.casting_time,
    school: originalSpell.school,
  };

  const systemPrompt = `You are a strict technical translator for the Dungeons & Dragons 5th Edition tabletop role-playing game rules.
Your task is to translate the values of a JSON object from English to the target locale: '${targetLocale}'.
Preserve all formatting such as markdown or D&D 5e specific terminology appropriately.
Do NOT translate the JSON keys. Keep the keys exactly as they are.
Respond ONLY with the translated JSON object. Absolutely no conversational text or markdown code blocks (like \`\`\`json) outside the pure JSON.`;

  const userPrompt = JSON.stringify(fieldsToTranslate);

  // --- MOCK LOGIC ---
  let mockLatencyStr: string | undefined;
  console.log(`[AI] Checking for MOCK_AI_LATENCY...`);

  if (typeof process !== 'undefined' && process.env && process.env.MOCK_AI_LATENCY) {
    mockLatencyStr = process.env.MOCK_AI_LATENCY;
    console.log(`[AI] Found MOCK_AI_LATENCY in process.env: ${mockLatencyStr}`);
  } else if (typeof globalThis !== 'undefined' && globalThis.Azion?.env?.get) {
    mockLatencyStr = globalThis.Azion.env.get('MOCK_AI_LATENCY');
    console.log(`[AI] Found MOCK_AI_LATENCY in Azion.env: ${mockLatencyStr}`);
  } else {
    console.log(`[AI] MOCK_AI_LATENCY not found. Using real AI Inference.`);
  }

  if (mockLatencyStr) {
    const latency = parseInt(mockLatencyStr, 10) || 0;
    console.log(`[AI MOCK] Detected MOCK_AI_LATENCY=${latency}ms. Simulating translation...`);

    if (latency > 0) {
      await new Promise((resolve) => setTimeout(resolve, latency));
    }

    const mockResponse: SpellData = {
      name: `[la-LA] ${originalSpell.name || 'Unknown'}`,
      desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
      higher_level:
        'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
      material:
        'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      duration: 'Permanent',
      casting_time: '1 moment',
      school: originalSpell.school,
    };

    return {
      ...originalSpell,
      ...mockResponse,
      locale: targetLocale,
    };
  }
  // ------------------

  try {
    // We are assuming Llama-3-8B-Instruct is available in Azion.
    // If we need a different default model, it can be swapped here.
    console.log(`[AI] Running real AI Inference with model 'Llama-3-8B-Instruct'...`);
    const result = await Azion.AI.run('Llama-3-8B-Instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });
    console.log(`[AI] Inference response received. Length: ${result.response?.length || 0} chars.`);

    let rawOutput = result.response;

    // Cleanup: Some LLMs stubbornly put ```json ... ``` wrapper.
    if (rawOutput.startsWith('```json')) {
      rawOutput = rawOutput.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (rawOutput.startsWith('```')) {
      rawOutput = rawOutput.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    const translatedFields = JSON.parse(rawOutput.trim());

    // Merge translated fields back into original spell
    return {
      ...originalSpell,
      ...translatedFields,
      locale: targetLocale, // Force override the locale field
    };
  } catch (error) {
    console.error('Translation failed:', error);
    // Throw an API error so the router can handle it properly
    throw new Open5eApiError('Failed to translate spell content using AI Inference.', 502, false);
  }
}
