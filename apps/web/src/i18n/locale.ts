import { defaultLocale, locales, type Locale } from './config';

export const LOCALE_CHANGE_EVENT = 'infinite-world:locale-change';
export const localeStorageKey = 'infinite-world.language';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && locales.includes(value as Locale);
}

export function normalizeLocale(value: unknown): Locale | null {
  if (isLocale(value)) return value;
  if (typeof value !== 'string') return null;

  const base = value.toLowerCase().split(/[-_]/)[0];
  return isLocale(base) ? base : null;
}

export function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;
  return normalizeLocale(window.localStorage.getItem(localeStorageKey)) ?? defaultLocale;
}

export function setStoredLocale(locale: Locale) {
  window.localStorage.setItem(localeStorageKey, locale);
  window.dispatchEvent(new CustomEvent(LOCALE_CHANGE_EVENT, { detail: locale }));
}
