type TranslationValues = Record<string, number | string>;

const EN_MESSAGES = {
  commandReplace: "Replace backlink display text with property value",
  commandReplaceSkipExisting:
    "Replace backlink display text with property value (skip links that already have display text)",
  noticeNoActiveFile: "No active Markdown file.",
  noticeEmptyProperty: 'Property "{{propertyName}}" is empty.',
  noticeUpdatedCount: "Updated {{count}} backlink(s).",
  settingName: "Property used for display text",
  settingDesc: "Frontmatter property name used when writing backlink display text."
} as const;

export type MessageKey = keyof typeof EN_MESSAGES;

export function t(key: MessageKey, values: TranslationValues = {}): string {
  return EN_MESSAGES[key].replace(/\{\{(\w+)\}\}/g, (_match, token: string) => {
    const value = values[token];
    return value === undefined ? "" : String(value);
  });
}
