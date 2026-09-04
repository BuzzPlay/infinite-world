'use client';

import { useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import type { Locale } from './config';
import { setStoredLocale } from './locale';

export type TranslationValues = Record<string, string | number>;

export function useTranslation(namespace?: string) {
  const translate = useTranslations(namespace);
  const locale = useLocale() as Locale;
  const setLocale = useCallback((nextLocale: Locale) => {
    setStoredLocale(nextLocale);
  }, []);
  const t = useCallback(
    (key: string, values?: TranslationValues) =>
      values === undefined ? translate(key) : translate(key, values),
    [translate],
  );

  return { locale, setLocale, t };
}
