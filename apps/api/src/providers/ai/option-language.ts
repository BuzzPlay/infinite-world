import type { OptionLanguage } from '@infinite-world/api-contract';

export function optionLanguageInstruction(language: OptionLanguage | undefined) {
  return language === 'zh'
    ? 'Write every player-facing label and action in Simplified Chinese.'
    : 'Write every player-facing label and action in English.';
}
