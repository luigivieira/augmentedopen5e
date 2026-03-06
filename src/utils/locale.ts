/**
 * Validates if a string is a valid BCP 47 locale in the format 'xx-XX'.
 */
export function isValidLocale(localeString: string): boolean {
  try {
    const locale = new Intl.Locale(localeString);
    const formatted = new Intl.DateTimeFormat(locale.toString()).resolvedOptions().locale;

    const resolvedLang = formatted.split('-')[0].toLowerCase();
    const inputLang = localeString.split(/[-_]/)[0].toLowerCase();

    if (resolvedLang !== inputLang) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
