'use client';

import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';

import defaultMessages from '../../translations/en.json';
import zhMessages from '../../translations/zh.json';
import { defaultLocale, type Locale } from '../i18n/config';
import { getStoredLocale, LOCALE_CHANGE_EVENT, localeStorageKey } from '../i18n/locale';

type Messages = typeof defaultMessages;

const messagesByLocale: Record<Locale, Messages> = {
  en: defaultMessages,
  zh: zhMessages,
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  const applyLocale = useCallback((nextLocale: Locale) => {
    setLocale(nextLocale);
  }, []);

  useEffect(() => {
    const stored = getStoredLocale();
    if (stored !== defaultLocale) applyLocale(stored);

    const handleLocaleChange = (event: Event) => {
      const nextLocale = (event as CustomEvent<Locale>).detail;
      if (nextLocale !== locale) applyLocale(nextLocale);
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === localeStorageKey && event.newValue !== locale) {
        applyLocale(getStoredLocale());
      }
    };

    window.addEventListener(LOCALE_CHANGE_EVENT, handleLocaleChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(LOCALE_CHANGE_EVENT, handleLocaleChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, [applyLocale, locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messagesByLocale[locale]}
      timeZone="Asia/Shanghai"
    >
      {children}
    </NextIntlClientProvider>
  );
}
