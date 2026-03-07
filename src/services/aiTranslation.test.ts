import { beforeEach, describe, expect, it, vi } from 'vitest';
import { translateSpellFields, type SpellData } from './aiTranslation';

const baseSpell: SpellData & { locale: string } = {
  locale: 'en-us',
  name: 'Fireball',
  desc: 'A bright streak flashes from your pointing finger...',
  higher_level: 'When you cast this spell using a spell slot of 4th level or higher...',
  material: 'A tiny ball of bat guano and sulfur',
  duration: 'Instantaneous',
  casting_time: '1 action',
  school: 'Evocation',
  range: '150 feet',
  level: '3rd',
  dnd_class: 'Sorcerer, Wizard',
  spell_lists: ['Sorcerer', 'Wizard'],
  archetype: '',
};

function makeGroqResponse(content: string, ok = true, status = 200) {
  return {
    ok,
    status,
    text: async () => `Groq error ${status}`,
    json: async () => ({
      choices: [{ message: { content } }],
    }),
  };
}

describe('translateSpellFields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up a GROQ_API_KEY so the service doesn't fail early
    process.env.GROQ_API_KEY = 'test-api-key';
  });

  it('should translate spell fields and return merged result', async () => {
    const translatedJson = JSON.stringify({
      name: 'Bola de Fogo',
      desc: 'Um clarão brilhante...',
      higher_level: null,
      material: 'Uma pequena bola de guano de morcego e enxofre',
      duration: 'Instantâneo',
      casting_time: '1 ação',
      school: 'Evocação',
      range: '45 metros',
      level: '3º',
      dnd_class: 'Feiticeiro, Mago',
      spell_lists: ['Feiticeiro', 'Mago'],
      archetype: '',
    });

    global.fetch = vi.fn().mockResolvedValueOnce(makeGroqResponse(translatedJson));

    const result = await translateSpellFields(baseSpell, 'pt-br');

    expect(result.locale).toBe('pt-br');
    expect(result.name).toBe('Bola de Fogo');
    expect(result.desc).toBe('Um clarão brilhante...');
    // Original fields that were not in translatable set remain
    expect(result['locale']).toBe('pt-br');
  });

  it('should strip ```json markdown wrapper from response', async () => {
    const rawContent = '```json\n{"name": "Bola de Fogo", "desc": "Um clarão"}\n```';
    global.fetch = vi.fn().mockResolvedValueOnce(makeGroqResponse(rawContent));

    const result = await translateSpellFields(baseSpell, 'pt-br');
    expect(result.name).toBe('Bola de Fogo');
  });

  it('should strip plain ``` markdown wrapper from response', async () => {
    const rawContent = '```\n{"name": "Bola de Fogo", "desc": "Um clarão"}\n```';
    global.fetch = vi.fn().mockResolvedValueOnce(makeGroqResponse(rawContent));

    const result = await translateSpellFields(baseSpell, 'pt-br');
    expect(result.name).toBe('Bola de Fogo');
  });

  it('should throw Open5eApiError with 502 when API returns non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(makeGroqResponse('', false, 429));

    await expect(translateSpellFields(baseSpell, 'pt-br')).rejects.toMatchObject({
      status: 502,
    });
  });

  it('should throw Open5eApiError with 502 when response JSON is malformed', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(makeGroqResponse('not valid json'));

    await expect(translateSpellFields(baseSpell, 'pt-br')).rejects.toMatchObject({
      status: 502,
    });
  });

  it('should throw Open5eApiError with 502 when GROQ_API_KEY is not set', async () => {
    delete process.env.GROQ_API_KEY;
    // Ensure Azion env is also not set
    globalThis.Azion = {} as any;

    await expect(translateSpellFields(baseSpell, 'pt-br')).rejects.toMatchObject({
      status: 502,
      message: expect.stringContaining('Failed to translate'),
    });
  });

  it('should use Azion.env.get for API key when process.env is not available', async () => {
    delete process.env.GROQ_API_KEY;
    globalThis.Azion = {
      env: {
        get: vi.fn().mockReturnValue('azion-api-key'),
      },
    } as any;

    const translatedJson = JSON.stringify({ name: 'Test' });
    global.fetch = vi.fn().mockResolvedValueOnce(makeGroqResponse(translatedJson));

    const result = await translateSpellFields(baseSpell, 'pt-br');
    expect(result.name).toBe('Test');
    expect(globalThis.Azion.env.get).toHaveBeenCalledWith('GROQ_API_KEY');
  });
});
