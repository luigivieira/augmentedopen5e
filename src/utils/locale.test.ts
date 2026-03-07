import { describe, expect, it, vi } from 'vitest';
import { isValidLocale } from './locale';

describe('isValidLocale', () => {
  it('should return true for valid locale en-us', () => {
    expect(isValidLocale('en-us')).toBe(true);
  });

  it('should return true for valid locale pt-br', () => {
    expect(isValidLocale('pt-br')).toBe(true);
  });

  it('should return true for uppercase locale PT-BR', () => {
    expect(isValidLocale('PT-BR')).toBe(true);
  });

  it('should return true for mixed case locale pt-BR', () => {
    expect(isValidLocale('pt-BR')).toBe(true);
  });

  it('should return false for single segment locale like "pt"', () => {
    expect(isValidLocale('pt')).toBe(false);
  });

  it('should return false for underscore-separated locale like "pt_BR"', () => {
    expect(isValidLocale('pt_BR')).toBe(false);
  });

  it('should return false for locale with 3-letter language code like "eng-US"', () => {
    expect(isValidLocale('eng-US')).toBe(false);
  });

  it('should return false for locale with 3-letter region code like "pt-BRA"', () => {
    expect(isValidLocale('pt-BRA')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isValidLocale('')).toBe(false);
  });

  it('should return false when language and region are swapped (us-en)', () => {
    // 'us-en' passes the regex but fails Intl validation (resolved language !== 'us')
    expect(isValidLocale('us-en')).toBe(false);
  });

  it('should return false when Intl.Locale throws an error', () => {
    const original = globalThis.Intl.Locale;
    try {
      (globalThis.Intl as any).Locale = function () {
        throw new RangeError('Invalid language tag');
      };
      expect(isValidLocale('xx-yy')).toBe(false);
    } finally {
      globalThis.Intl.Locale = original;
    }
  });
});
