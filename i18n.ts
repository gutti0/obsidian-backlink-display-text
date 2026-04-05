import { getLanguage } from "obsidian";

type TranslationValues = Record<string, number | string>;

interface Messages {
  commandReplace: string;
  commandReplaceSkipExisting: string;
  noticeNoActiveFile: string;
  noticeEmptyProperty: string;
  noticeUpdatedCount: string;
  settingName: string;
  settingDesc: string;
}

const EN_MESSAGES: Messages = {
  commandReplace: "Replace backlink display text with property value",
  commandReplaceSkipExisting:
    "Replace backlink display text with property value (skip links that already have display text)",
  noticeNoActiveFile: "No active Markdown file.",
  noticeEmptyProperty: 'Property "{{propertyName}}" is empty.',
  noticeUpdatedCount: "Updated {{count}} backlink(s).",
  settingName: "Property used for display text",
  settingDesc: "Frontmatter property name used when writing backlink display text."
};

const JA_MESSAGES: Messages = {
  commandReplace: "Backlinksのdisplay textをプロパティ値で置換",
  commandReplaceSkipExisting:
    "Backlinksのdisplay textをプロパティ値で置換（display text設定済みは維持）",
  noticeNoActiveFile: "アクティブなMarkdownファイルがありません。",
  noticeEmptyProperty: 'プロパティ「{{propertyName}}」が空です。',
  noticeUpdatedCount: "{{count}} 件のバックリンクを更新しました。",
  settingName: "display text に使うプロパティ",
  settingDesc: "バックリンクの display text に設定する frontmatter プロパティ名です。"
};

export type MessageKey = keyof Messages;

function getMessages(): Messages {
  const language = getLanguage().toLowerCase();

  if (language.startsWith("ja")) {
    return JA_MESSAGES;
  }

  return EN_MESSAGES;
}

export function t(key: MessageKey, values: TranslationValues = {}): string {
  return getMessages()[key].replace(/\{\{(\w+)\}\}/g, (_match, token: string) => {
    const value = values[token];
    return value === undefined ? "" : String(value);
  });
}
