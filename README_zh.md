# Bookmark Plus

<p align="center">
  <img src="./public/icons/icon128.png" alt="Bookmark Plus Logo" width="128" height="128">
</p>

<div align="center">
  <h3>🚀 智能的 Chrome 书签管理工具</h3>
</div>

<p align="center">
  <img src="https://img.shields.io/github/v/release/shalom-lab/bookmark-plus?color=2080f0" alt="版本">
  <img src="https://img.shields.io/github/stars/shalom-lab/bookmark-plus?style=social" alt="GitHub stars">
  <img src="https://img.shields.io/badge/platform-Chrome%20%7C%20Edge%20%7C%20Arc-2080f0.svg" alt="平台">
  <img src="https://img.shields.io/badge/languages-14-2080f0.svg" alt="语言">
  <img src="https://img.shields.io/badge/license-MIT-2080f0.svg" alt="许可证">
</p>

<div align="center">
  <a href="README.md">English</a> | <a href="README_zh.md">中文</a>
</div>

---

### ✨ 特色功能

- **智能管理**
  - 直观的书签分类管理
  - 灵活的标签系统
  - 快速搜索和筛选

- **GitHub 集成**
  - 一键上传书签至 GitHub 仓库
  - 手动备份到 GitHub 仓库
  - 安全的令牌认证

- **用户体验**
  - 清新现代的界面
  - 支持14种语言
  - 可自定义设置

- **Chrome 数据同步**
  - 在同一 Google / Chrome 账号下开启扩展同步时，书签可在多设备间同步
  - 完整数据保存在 `chrome.storage.local`（容量大）；`chrome.storage.sync` 使用**分片**写入，规避原先单个键 **约 8KB** 上限导致的保存失败

### 📦 Chrome 同步与容量说明

| 说明 | 现状 |
|------|------|
| **单键约 8KB 限制** | 已通过多分片键（`bm_chunks_v1_*`）规避，避免因单键过大而无法写入同步区。 |
| **本机权威数据** | 完整书签列表优先写入 `chrome.storage.local`，即使同步较慢或触顶，本机使用仍稳定。 |
| **多设备冲突** | 读取时按时间戳 `updatedAt` 取较新数据，优先级：分片 sync → 本地 → 旧版单键 sync（若仍存在）。 |
| **同步总配额约 100KB** | 仍为 Chrome 对扩展 `storage.sync` 的**整区**上限；数据量极大时可能无法全部进同步，但**本地数据仍可用**；大体量备份请用 **GitHub 上传**（上传页）。 |

<p align="center">
  <img src="./public/promo-large.png" alt="Bookmark Plus 功能展示" width="100%" style="max-width: 1400px">
</p>

### 🚀 快速开始

1. 从 [Releases](https://github.com/shalom-lab/bookmark-plus/releases/latest) 下载最新版本
2. 解压下载的文件
3. 访问 `chrome://extensions/`
4. 在右上角开启"开发者模式"
5. 点击"加载已解压的扩展程序"并选择解压后的文件夹
6. 点击扩展图标打开（或使用快捷键 `Alt+Q`）
7. 开始整理您的书签
8. （可选）配置 GitHub 同步

### 🔧 配置说明

#### GitHub 同步设置
1. 生成 GitHub 个人访问令牌
2. 在扩展设置中输入令牌
3. 选择您的仓库
4. 设置存储路径
5. 点击上传备份书签

#### 语言设置
- 支持：英语、中文、日语、韩语、法语、德语、西班牙语、葡萄牙语、意大利语、俄语、荷兰语、土耳其语、越南语、印尼语
- 在设置中更改语言

### 🤝 参与贡献

欢迎参与项目建设：
- 为项目点亮星标
- 提交问题反馈
- 创建拉取请求
- 分享使用体验

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/shalom-lab">Shalom Lab</a></sub>
</div> 