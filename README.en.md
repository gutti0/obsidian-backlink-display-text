# Obsidian Backlink Display Text

[日本語 README](./README.md)

An Obsidian plugin that updates the display text of backlinks to the active note using a frontmatter property such as `title`.

## Features

- Updates backlinks that point to the currently open note
- Command A always rewrites the display text to the configured property value
- Command B skips links that already have display text set
- Shows an Obsidian notice with the number of links updated
- Lets you choose which frontmatter property to use, with `title` as the default
- Shows an Obsidian notice when the target property is empty

## Commands

- `Replace backlink display text with property value`
- `Replace backlink display text with property value (skip links that already have display text)`

## Setting

- `Property used for display text`
  - Defaults to `title`
  - Uses the selected frontmatter property value as backlink display text

## BRAT Installation

1. Install the BRAT plugin in Obsidian.
2. Run `BRAT: Add a beta plugin for testing`.
3. Enter this repository URL: `https://github.com/gutti0/obsidian-backlink-display-text`
4. Enable `Backlink Display Text` in Community Plugins.

BRAT can install this plugin directly from the repository because the required plugin files are kept in the repository root:

- `manifest.json`
- `main.js`
- `versions.json`

## Development

```bash
npm install
npm run check
npm run build
```
