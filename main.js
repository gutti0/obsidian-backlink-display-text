var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => BacklinkDisplayTextPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");

// i18n.ts
var EN_MESSAGES = {
  commandReplace: "Replace backlink display text with property value",
  commandReplaceSkipExisting: "Replace backlink display text with property value (skip links that already have display text)",
  noticeNoActiveFile: "No active Markdown file.",
  noticeEmptyProperty: 'Property "{{propertyName}}" is empty.',
  noticeUpdatedCount: "Updated {{count}} backlink(s).",
  settingName: "Property used for display text",
  settingDesc: "Frontmatter property name used when writing backlink display text."
};
function t(key, values = {}) {
  return EN_MESSAGES[key].replace(/\{\{(\w+)\}\}/g, (_match, token) => {
    const value = values[token];
    return value === void 0 ? "" : String(value);
  });
}

// main.ts
var DEFAULT_SETTINGS = {
  sourceProperty: "title"
};
var BacklinkDisplayTextPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
  }
  async onload() {
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
  async loadSettings() {
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...await this.loadData()
    };
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  async updateBacklinkDisplayTexts(skipIfDisplayTextExists) {
    const activeFile = this.getActiveMarkdownFile();
    if (!activeFile) {
      new import_obsidian.Notice(t("noticeNoActiveFile"));
      return;
    }
    const propertyName = this.settings.sourceProperty.trim();
    const displayText = this.getDisplayTextFromProperty(activeFile, propertyName);
    if (!displayText) {
      new import_obsidian.Notice(t("noticeEmptyProperty", { propertyName }));
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
    new import_obsidian.Notice(t("noticeUpdatedCount", { count: replacedCount }));
  }
  getActiveMarkdownFile() {
    var _a, _b;
    return (_b = (_a = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView)) == null ? void 0 : _a.file) != null ? _b : null;
  }
  getDisplayTextFromProperty(file, propertyName) {
    var _a;
    const frontmatter = (_a = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter;
    if (!frontmatter || !(propertyName in frontmatter)) {
      return null;
    }
    const rawValue = frontmatter[propertyName];
    if (Array.isArray(rawValue)) {
      const mergedValue = rawValue.map((value) => String(value).trim()).filter(Boolean).join(", ");
      return mergedValue.length > 0 ? mergedValue : null;
    }
    if (rawValue === null || rawValue === void 0) {
      return null;
    }
    const textValue = String(rawValue).trim();
    return textValue.length > 0 ? textValue : null;
  }
  getBacklinkFiles(targetFile) {
    const backlinkFiles = [];
    for (const [sourcePath, destinations] of Object.entries(this.app.metadataCache.resolvedLinks)) {
      if (!(targetFile.path in destinations)) {
        continue;
      }
      const sourceFile = this.app.vault.getAbstractFileByPath(sourcePath);
      if (sourceFile instanceof import_obsidian.TFile && sourceFile.extension === "md") {
        backlinkFiles.push(sourceFile);
      }
    }
    return backlinkFiles;
  }
  async replaceLinksInFile(sourceFile, targetFile, displayText, skipIfDisplayTextExists) {
    var _a, _b;
    const linkCache = (_b = (_a = this.app.metadataCache.getFileCache(sourceFile)) == null ? void 0 : _a.links) != null ? _b : [];
    if (linkCache.length === 0) {
      return 0;
    }
    const content = await this.app.vault.read(sourceFile);
    const lineOffsets = this.buildLineOffsets(content);
    const edits = [];
    for (const link of linkCache) {
      const destination = this.app.metadataCache.getFirstLinkpathDest(link.link, sourceFile.path);
      if ((destination == null ? void 0 : destination.path) !== targetFile.path) {
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
  buildReplacement(original, displayText, skipIfDisplayTextExists) {
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
  applyEdits(content, edits) {
    const sortedEdits = [...edits].sort((a, b) => b.start - a.start);
    let updatedContent = content;
    for (const edit of sortedEdits) {
      updatedContent = updatedContent.slice(0, edit.start) + edit.replacement + updatedContent.slice(edit.end);
    }
    return updatedContent;
  }
  buildLineOffsets(content) {
    const offsets = [0];
    for (let index = 0; index < content.length; index += 1) {
      if (content[index] === "\n") {
        offsets.push(index + 1);
      }
    }
    return offsets;
  }
  positionToOffset(lineOffsets, position) {
    var _a;
    if (typeof position.offset === "number") {
      return position.offset;
    }
    return ((_a = lineOffsets[position.line]) != null ? _a : 0) + position.col;
  }
};
var BacklinkDisplayTextSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName(t("settingName")).setDesc(t("settingDesc")).addText((text) => {
      text.setPlaceholder("title").setValue(this.plugin.settings.sourceProperty).onChange(async (value) => {
        this.plugin.settings.sourceProperty = value.trim() || DEFAULT_SETTINGS.sourceProperty;
        await this.plugin.saveSettings();
      });
    });
  }
};
