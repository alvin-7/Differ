# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Differ is an Electron-based desktop application for comparing Excel files side-by-side. It displays differences between two Excel files in a synchronized dual-table view with visual highlighting of changes.

## Development Commands

```bash
# Start development server (runs on port 7777 via webpack)
yarn start

# Debug with inspector on port 7778
yarn debug

# Debug with break on start
yarn debug-brk

# Lint TypeScript/TSX files
yarn lint

# Package application (creates platform-specific format, not distributable)
yarn package

# Create distributables based on forge config
yarn make

# Publish to configured targets (GitHub releases)
yarn run publish
```

## Application Usage

The application accepts Excel file paths via command-line arguments:

```bash
Differ.exe --excel /path/to/oldexcel --excel /path/to/newexcel
```

## Architecture

### Electron Structure

- **Main Process** (`src/main/index.ts`): Handles window creation, IPC communication, and command-line argument parsing for Excel file paths
- **Preload Script** (`src/preload.js`): Exposes secure APIs to renderer via `contextBridge`:
  - `readXlsx()`: Reads Excel files using XLSX library
  - `diffArrays()`: Compares Excel data arrays and generates diff objects
- **Renderer Process** (`src/renderer/`): React-based UI

### Build System

Uses Electron Forge with Webpack plugin:
- Main config: `webpack.main.config.js`
- Renderer config: `webpack.renderer.config.js`
- Dev server runs on port 7777 (configured in `forge.config.js`)

### State Management

Redux Toolkit manages application state (`src/renderer/redux/`):
- **layoutSetter slice**: Manages sheets list, current sheet, diff index, and diff keys
- State shape:
  ```typescript
  {
    sheets: string[],      // Available sheet names
    sheet: string,         // Currently selected sheet
    diffIdx: number,       // Current diff line index (-1 = none)
    diffKeys: number[]     // Array of line numbers with differences
  }
  ```

### Diff Algorithm

The preload script implements a custom diff algorithm (`diffArrays()` in `src/preload.js`):
1. Converts Excel rows to JSON strings for comparison
2. Uses `diff` library's `diffArrays()` to find added/removed rows
3. Inserts empty rows to align tables when row counts differ
4. Uses `deep-object-diff` to find cell-level differences
5. Returns:
   - `leftData`/`rightData`: Aligned data arrays with empty rows inserted
   - `diffObj`: Object mapping line numbers to cell-level differences
   - `nullLines`: Tracks which lines are empty placeholders

### UI Components

- **App.tsx**: Main layout with header (sheet tabs, diff navigation) and content area
- **table/table.tsx**: Core diff table component
  - Renders two synchronized Ant Design tables side-by-side
  - Pagination: 100 rows per page (`MAX_PAGE_SIZE`)
  - Synchronized scrolling between left/right tables
  - Row/cell highlighting based on diff type:
    - `diff-row-null`: Empty placeholder rows
    - `diff-row-delete`: Rows removed from left
    - `diff-row-add`: Rows added to right
    - `diff-row-left-item`/`diff-row-right-item`: Cells with differences
    - `diff-row-common-item`: Unchanged cells

### Diff Navigation

- **Pre Diff/Next Diff buttons**: Navigate through differences sequentially
- **Diff index dropdown**: Jump directly to a specific diff line
- Scrolling manually clears the diff index (sets to -1)
- Navigation triggers `handleScroll()` which uses `scroll-into-view` library

## Key Technical Details

- Excel parsing converts all cell values to strings and normalizes line endings (`\r\n` → `\n`)
- Tables use fixed layout with 150px default column width
- Auto-updates enabled via `update-electron-app` (checks GitHub releases hourly)
- Context isolation enabled for security (`contextIsolation: true`)
