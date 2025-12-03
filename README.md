<p align="center">
  <img src="https://img.icons8.com/color/96/cut.png" alt="SpriteSlicer Logo" width="80" />
</p>

<h1 align="center">🎨 SpriteSlicer</h1>

<p align="center">
  <strong>一款优雅的精灵图切割工具 | An Elegant Sprite Sheet Slicer</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.2-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5.1-646CFF?style=flat-square&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss" alt="Tailwind CSS" />
</p>

<p align="center">
  <a href="#-中文文档">中文</a> •
  <a href="#-english-documentation">English</a>
</p>

<p align="center">
  🌐 <strong>在线演示 | Live Demo:</strong> <a href="http://ss.qwq.team/" target="_blank">http://ss.qwq.team/</a>
</p>

---

## 📖 中文文档

### ✨ 功能特性

- 🖼️ **智能切割** - 支持按行列数切割精灵图，自动检测网格
- 🎯 **自动检测** - 智能识别精灵图网格，支持灵敏度调节 (1-10)
- 🔄 **拖拽排序** - 支持拖拽重新排列切片顺序
- ✅ **多选操作** - 支持 Ctrl/Shift 多选，批量删除或导出
- ↩️ **撤销重做** - 完整的操作历史记录，支持回滚
- 📦 **批量导出** - 支持单张下载或打包为 ZIP 文件
- 💾 **预设保存** - 保存常用的行列配置，快速切换
- 🌐 **双语支持** - 中文/英文界面切换
- 📱 **响应式设计** - 完美支持桌面和移动设备
- ⌨️ **快捷键支持** - Delete 删除、Ctrl+Z 撤销、Ctrl+Y 重做

### 🚀 快速开始

#### 安装依赖

```bash
npm install
```

#### 开发模式

```bash
npm run dev
```

#### 构建生产版本

```bash
npm run build
```

#### 预览构建结果

```bash
npm run preview
```

### 🎮 使用指南

1. **上传图片** - 点击上传区域或拖拽图片文件
2. **设置网格** - 调整行数和列数，或使用自动检测
3. **编辑切片** - 拖拽重新排序，点击选择，Ctrl+点击多选
4. **导出结果** - 点击下载单张图片，或选择多张后打包下载

### ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Delete` | 删除选中的切片 |
| `Ctrl + Z` | 撤销上一步操作 |
| `Ctrl + Y` / `Ctrl + Shift + Z` | 重做操作 |
| `Ctrl + 点击` | 多选/取消选择切片 |
| `Shift + 点击` | 范围选择切片 |

### 🛠️ 技术栈

- **框架**: React 18 + TypeScript
- **构建**: Vite 5
- **样式**: Tailwind CSS
- **拖拽**: dnd-kit
- **存储**: IndexedDB (idb-keyval)
- **打包**: JSZip + FileSaver

---

## 📖 English Documentation

### ✨ Features

- 🖼️ **Smart Slicing** - Slice sprite sheets by rows and columns with auto-detection
- 🎯 **Auto Detection** - Intelligent grid detection with adjustable sensitivity (1-10)
- 🔄 **Drag & Drop** - Reorder slices by dragging
- ✅ **Multi-Select** - Ctrl/Shift click for batch selection, delete or export
- ↩️ **Undo/Redo** - Complete operation history with rollback support
- 📦 **Batch Export** - Download individual images or export as ZIP
- 💾 **Presets** - Save frequently used row/column configurations
- 🌐 **Bilingual** - Chinese/English interface switching
- 📱 **Responsive** - Perfect support for desktop and mobile devices
- ⌨️ **Keyboard Shortcuts** - Delete, Ctrl+Z undo, Ctrl+Y redo

### 🚀 Quick Start

#### Install Dependencies

```bash
npm install
```

#### Development Mode

```bash
npm run dev
```

#### Build for Production

```bash
npm run build
```

#### Preview Build

```bash
npm run preview
```

### 🎮 User Guide

1. **Upload Image** - Click the upload area or drag & drop an image file
2. **Set Grid** - Adjust rows and columns, or use auto-detection
3. **Edit Slices** - Drag to reorder, click to select, Ctrl+click for multi-select
4. **Export** - Click to download individual images, or select multiple to download as ZIP

### ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Delete` | Delete selected slices |
| `Ctrl + Z` | Undo last action |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Redo action |
| `Ctrl + Click` | Multi-select/deselect slices |
| `Shift + Click` | Range select slices |

### 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS
- **Drag & Drop**: dnd-kit
- **Storage**: IndexedDB (idb-keyval)
- **Packaging**: JSZip + FileSaver

---

## 📄 License

MIT License © 2024

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/Arminosi">Arminosi</a>
</p>
