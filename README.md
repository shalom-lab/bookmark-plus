# Bookmark Plus

<p align="center">
  <img src="./public/icons/icon128.png" alt="Bookmark Plus Logo" width="128" height="128">
</p>

<div align="center">
  <h3>🚀 Smart Bookmark Management for Chrome</h3>
</div>

<p align="center">
  <img src="https://img.shields.io/github/v/release/shalom-lab/bookmark-plus?color=2080f0" alt="Version">
  <img src="https://img.shields.io/github/stars/shalom-lab/bookmark-plus?style=social" alt="GitHub stars">
  <img src="https://img.shields.io/badge/platform-Chrome%20%7C%20Edge%20%7C%20Arc-2080f0.svg" alt="Platform">
  <img src="https://img.shields.io/badge/languages-14-2080f0.svg" alt="Languages">
  <img src="https://img.shields.io/badge/license-MIT-2080f0.svg" alt="License">
</p>

<div align="center">
  <a href="README.md">English</a> | <a href="README_zh.md">中文</a>
</div>

---

### ✨ Features

- **Smart Organization**
  - Categorize bookmarks with intuitive category management
  - Tag system for flexible organization
  - Quick search and filter capabilities

- **GitHub Integration**
  - One-click upload bookmarks to GitHub repository
  - Manual backup to your GitHub repository
  - Secure token-based authentication

- **User Experience**
  - Clean and modern interface
  - Support for 14 languages
  - Customizable settings

- **Chrome data sync**
  - Bookmarks sync across devices when you are signed into Chrome and sync is enabled for extensions
  - Full copy kept in `chrome.storage.local` (large quota); `chrome.storage.sync` stores **chunked** data to avoid Chrome’s **~8 KB per-key** limit that used to break saves

### 📦 Chrome sync & capacity

| Topic | Status |
|--------|--------|
| **Per-key ~8 KB limit** | Addressed by splitting bookmark JSON across multiple sync keys (`bm_chunks_v1_*`). Saving large libraries no longer fails for that reason alone. |
| **Authoritative copy on device** | Full list is always written to `chrome.storage.local` first so the popup stays reliable even if sync is slow or hits quota. |
| **Conflicts** | When reading, newer data wins using stored timestamps (`updatedAt`), preferring chunked sync, then local, then legacy single-key sync if present. |
| **Total sync quota (~100 KB)** | Still enforced by Chrome for **all** keys of this extension’s sync area. Very large bookmark sets may stop syncing fully while **local data remains usable**; use **GitHub upload** (Upload tab) for heavy backups. |

<p align="center">
  <img src="./public/promo-large.png" alt="Bookmark Plus Promo" width="100%" style="max-width: 1400px">
</p>

### 🚀 Quick Start

1. Download the latest version from [Releases](https://github.com/shalom-lab/bookmark-plus/releases/latest)
2. Unzip the downloaded file
3. Go to `chrome://extensions/`
4. Enable "Developer mode" in the top right
5. Click "Load unpacked" and select the unzipped folder
6. Click the extension icon to open (or use shortcut `Alt+Q`)
7. Start organizing your bookmarks
8. (Optional) Configure GitHub sync

### 🔧 Configuration

#### GitHub Sync Setup
1. Generate a GitHub personal access token
2. Enter the token in extension settings
3. Select your repository
4. Choose storage path
5. Click upload to backup your bookmarks

#### Language Settings
- Supports: English, 中文, 日本語, 한국어, Français, Deutsch, Español, Português, Italiano, Русский, Nederlands, Türkçe, Tiếng Việt, Bahasa Indonesia
- Change language in settings

### 🤝 Contributing

We welcome contributions! Please feel free to:
- Star this project
- Submit issues
- Create pull requests
- Share feedback

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/shalom-lab">Shalom Lab</a></sub>
</div> 