import {
  App,
  MarkdownView,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile
} from "obsidian";
import { t } from "./i18n";

interface RenameDisplayNameSettings {
  sourceProperty: string;
}

interface CachePosition {
  line: number;
  col: number;
  offset?: number;
}

interface LinkEdit {
  start: number;
  end: number;
  replacement: string;
}

const DEFAULT_SETTINGS: RenameDisplayNameSettings = {
  sourceProperty: "title"
};

export default class BacklinkDisplayTextPlugin extends Plugin {
  settings: RenameDisplayNameSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.addCommand({
      id: "replace-backlink-display-texts",
      name: t("commandReplace"),
      callback: async () => {
        await this.updateBacklinkDisplayTexts(false);
      }
    });

    this.addCommand({
      id: "replace-backlink-display-texts-skip-existing",
      name: t("commandReplaceSkipExisting"),
      callback: async () => {
        await this.updateBacklinkDisplayTexts(true);
      }
    });

    this.addSettingTab(new BacklinkDisplayTextSettingTab(this.app, this));
  }

  async loadSettings(): Promise<void> {
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...(await this.loadData())
    };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private async updateBacklinkDisplayTexts(skipIfDisplayTextExists: boolean): Promise<void> {
    const activeFile = this.getActiveMarkdownFile();
    if (!activeFile) {
      new Notice(t("noticeNoActiveFile"));
      return;
    }

    const propertyName = this.settings.sourceProperty.trim();
    const displayText = this.getDisplayTextFromProperty(activeFile, propertyName);
    if (!displayText) {
      new Notice(t("noticeEmptyProperty", { propertyName }));
      return;
    }

    const backlinkFiles = this.getBacklinkFiles(activeFile);
    let replacedCount = 0;

    for (const backlinkFile of backlinkFiles) {
      replacedCount += await this.replaceLinksInFile(
        backlinkFile,
        activeFile,
        displayText,
        skipIfDisplayTextExists
      );
    }

    new Notice(t("noticeUpdatedCount", { count: replacedCount }));
  }

  private getActiveMarkdownFile(): TFile | null {
    return this.app.workspace.getActiveViewOfType(MarkdownView)?.file ?? null;
  }

  private getDisplayTextFromProperty(file: TFile, propertyName: string): string | null {
    const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
    if (!frontmatter || !(propertyName in frontmatter)) {
      return null;
    }

    const rawValue = frontmatter[propertyName];
    if (Array.isArray(rawValue)) {
      const mergedValue = rawValue
        .map((value) => String(value).trim())
        .filter(Boolean)
        .join(", ");

      return mergedValue.length > 0 ? mergedValue : null;
    }

    if (rawValue === null || rawValue === undefined) {
      return null;
    }

    const textValue = String(rawValue).trim();
    return textValue.length > 0 ? textValue : null;
  }

  private getBacklinkFiles(targetFile: TFile): TFile[] {
    const backlinkFiles: TFile[] = [];

    for (const [sourcePath, destinations] of Object.entries(this.app.metadataCache.resolvedLinks)) {
      if (!(targetFile.path in destinations)) {
        continue;
      }

      const sourceFile = this.app.vault.getAbstractFileByPath(sourcePath);
      if (sourceFile instanceof TFile && sourceFile.extension === "md") {
        backlinkFiles.push(sourceFile);
      }
    }

    return backlinkFiles;
  }

  private async replaceLinksInFile(
    sourceFile: TFile,
    targetFile: TFile,
    displayText: string,
    skipIfDisplayTextExists: boolean
  ): Promise<number> {
    const linkCache = this.app.metadataCache.getFileCache(sourceFile)?.links ?? [];
    if (linkCache.length === 0) {
      return 0;
    }

    const content = await this.app.vault.read(sourceFile);
    const lineOffsets = this.buildLineOffsets(content);
    const edits: LinkEdit[] = [];

    for (const link of linkCache) {
      const destination = this.app.metadataCache.getFirstLinkpathDest(link.link, sourceFile.path);
      if (destination?.path !== targetFile.path) {
        continue;
      }

      const start = this.positionToOffset(lineOffsets, link.position.start);
      const end = this.positionToOffset(lineOffsets, link.position.end);
      const original = content.slice(start, end);
      const replacement = this.buildReplacement(original, displayText, skipIfDisplayTextExists);

      if (!replacement || replacement === original) {
        continue;
      }

      edits.push({ start, end, replacement });
    }

    if (edits.length === 0) {
      return 0;
    }

    const updatedContent = this.applyEdits(content, edits);
    await this.app.vault.modify(sourceFile, updatedContent);
    return edits.length;
  }

  private buildReplacement(
    original: string,
    displayText: string,
    skipIfDisplayTextExists: boolean
  ): string | null {
    if (original.startsWith("!")) {
      return null;
    }

    if (original.startsWith("[[")) {
      const inner = original.slice(2, -2);
      const separatorIndex = inner.indexOf("|");
      const target = separatorIndex >= 0 ? inner.slice(0, separatorIndex) : inner;
      const currentDisplay = separatorIndex >= 0 ? inner.slice(separatorIndex + 1) : null;

      if (skipIfDisplayTextExists && currentDisplay !== null) {
        return null;
      }

      return `[[${target}|${displayText}]]`;
    }

    if (original.startsWith("[")) {
      const separatorIndex = original.indexOf("](");
      if (separatorIndex < 0) {
        return null;
      }

      if (skipIfDisplayTextExists) {
        return null;
      }

      return `[${displayText}${original.slice(separatorIndex)}`;
    }

    return null;
  }

  private applyEdits(content: string, edits: LinkEdit[]): string {
    const sortedEdits = [...edits].sort((a, b) => b.start - a.start);
    let updatedContent = content;

    for (const edit of sortedEdits) {
      updatedContent =
        updatedContent.slice(0, edit.start) +
        edit.replacement +
        updatedContent.slice(edit.end);
    }

    return updatedContent;
  }

  private buildLineOffsets(content: string): number[] {
    const offsets = [0];

    for (let index = 0; index < content.length; index += 1) {
      if (content[index] === "\n") {
        offsets.push(index + 1);
      }
    }

    return offsets;
  }

  private positionToOffset(lineOffsets: number[], position: CachePosition): number {
    if (typeof position.offset === "number") {
      return position.offset;
    }

    return (lineOffsets[position.line] ?? 0) + position.col;
  }
}

class BacklinkDisplayTextSettingTab extends PluginSettingTab {
  plugin: BacklinkDisplayTextPlugin;

  constructor(app: App, plugin: BacklinkDisplayTextPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName(t("settingName"))
      .setDesc(t("settingDesc"))
      .addText((text) => {
        text
          .setPlaceholder("title")
          .setValue(this.plugin.settings.sourceProperty)
          .onChange(async (value) => {
            this.plugin.settings.sourceProperty = value.trim() || DEFAULT_SETTINGS.sourceProperty;
            await this.plugin.saveSettings();
          });
      });
  }
}
