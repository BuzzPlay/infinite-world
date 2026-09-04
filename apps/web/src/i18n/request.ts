import { getRequestConfig } from 'next-intl/server';

import { defaultLocale, type Locale } from './config';
import { normalizeLocale } from './locale';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale = normalizeLocale(requested) ?? defaultLocale;

  return {
    locale,
    messages: (await import(`../../translations/${locale}.json`)).default,
  };
});
