'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { SettingsRow, SettingsRowGroup } from '../ui/settings-row';
import { isLocale } from '../../i18n/locale';
import { useTranslation } from '../../i18n/use-translation';

type ThemePreference = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'infinite-world.theme';

export function GeneralSettings() {
  const [theme, setTheme] = useState<ThemePreference>('light');
  const { locale, setLocale, t } = useTranslation('settings');

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemePreference(storedTheme)) setTheme(storedTheme);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', dark);
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    };

    applyTheme();
    if (theme !== 'system') return;
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [theme]);

  const changeTheme = (value: string) => {
    if (!isThemePreference(value)) return;
    setTheme(value);
    window.localStorage.setItem(THEME_STORAGE_KEY, value);
  };

  const changeLanguage = (value: string) => {
    if (isLocale(value)) setLocale(value);
  };

  return (
    <SettingsRowGroup className="divide-y-0 overflow-visible rounded-none border-0 bg-transparent">
      <SettingsRow
        label={t('theme')}
        description={t('themeDescription')}
        className="border-b border-border px-0 py-5"
      >
        <div
          className="bg-foreground/10 flex max-w-full items-center gap-1 overflow-x-auto rounded-md p-0.5"
          role="group"
          aria-label={t('theme')}
        >
          {[
            { value: 'light' as const, label: t('light'), icon: Sun },
            { value: 'dark' as const, label: t('dark'), icon: Moon },
            { value: 'system' as const, label: t('system'), icon: Monitor },
          ].map(({ value, label, icon: Icon }) => {
            const active = theme === value;
            return (
              <button
                key={value}
                type="button"
                aria-label={label}
                aria-pressed={active}
                onClick={() => changeTheme(value)}
                className="text-foreground inline-flex h-7 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-sm px-3 text-sm font-medium transition-[color,background-color,scale] duration-150 ease-out active:scale-[0.96] [&>svg]:size-4"
                style={{ backgroundColor: active ? 'var(--background)' : 'transparent' }}
              >
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </SettingsRow>

      <SettingsRow
        label={t('language')}
        description={t('languageDescription')}
        className="border-b border-border px-0 py-5"
      >
        <Select value={locale} onValueChange={changeLanguage}>
          <SelectTrigger
            id="language"
            className="w-[min(14rem,48vw)]"
            size="lg"
            aria-label={t('language')}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">{t('english')}</SelectItem>
            <SelectItem value="zh">{t('simplifiedChinese')}</SelectItem>
          </SelectContent>
        </Select>
      </SettingsRow>
    </SettingsRowGroup>
  );
}

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}
