/**
 * Validates if a string is a valid locale in the required 'language-region' format (BCP 47 subset).
 * Examples of valid values:  'pt-BR', 'pt-br', 'en-US', 'en-us'
 * Examples of invalid values: 'pt', 'us', 'eng-US', 'pt_BR', 'ptbr'
 */
export function isValidLocale(localeString: string): boolean {
  // Require exactly: 2-letter language code + hyphen + 2-letter region code.
  // Allows any case (pt-BR, pt-br, PT-BR all accepted).
  const FORMAT = /^[a-zA-Z]{2}-[a-zA-Z]{2}$/;
  if (!FORMAT.test(localeString)) {
    return false;
  }

  try {
    // Delegate to Intl.Locale to verify the combination is a real locale.
    const locale = new Intl.Locale(localeString);
    const resolved = new Intl.DateTimeFormat(locale.toString()).resolvedOptions().locale;
    const resolvedLang = resolved.split('-')[0].toLowerCase();
    const inputLang = localeString.split('-')[0].toLowerCase();
    return resolvedLang === inputLang;
  } catch {
    return false;
  }
}
