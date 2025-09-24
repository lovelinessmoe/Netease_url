# Copilot Instructions for Netease_url

## 项目架构概览
- 本项目为网易云音乐下载工具，基于 Node.js，支持 API 服务和命令行两种模式。
- 主要入口文件：`main.js`（Node 服务与命令行逻辑）、`main.py`（可能为辅助脚本）、`electron.js`（桌面端集成）。
- 前端页面位于 `templates/index.html`，静态资源在 `public/js/download.js`。
- 下载相关逻辑和工具函数在 `utils/` 目录。
- 用户 Cookie 存储于根目录下 `cookie.txt`，用于网易云音乐鉴权。

## 关键开发流程
- 安装依赖：`npm install`
- 启动 API 服务：`node main.js --mode api`，默认端口 `15001`。
- 命令行下载：`node main.js --mode gui --url [音乐链接] --level [音质]`
- 音质参数：`standard`、`exhigh`、`lossless`、`hires`、`sky`、`jyeffect`、`jymaster`
- 需本地安装 `ffmpeg`，并保证 `cookie.txt` 有效。

## 主要约定与模式
- 所有下载请求需带有效 Cookie，部分高音质需 VIP。
- API 路径如 `/Song_V1`，参数包括 `ids`、`url`、`level`、`type`（text/json/down）。
- 歌曲元数据写入通过 `ffmetadata`，下载进度与状态通过命令行或 API 返回。
- 依赖管理仅通过 `npm`，无 yarn/pnpm 约定。
- 代码生成和部分迁移由 AI 工具辅助，风格可能混合。

## 典型文件/目录说明
- `main.js`：服务与命令行主逻辑，参数解析、API 路由、下载调度。
- `electron.js`：桌面端集成入口。
- `public/js/download.js`：前端下载交互逻辑。
- `utils/`：工具函数、下载实现细节。
- `cookie.txt`：用户鉴权 Cookie。
- `templates/index.html`：前端页面模板。

## 其他注意事项
- 依赖项：express、axios、commander、fluent-ffmpeg、ffmetadata、temp-write。
- 参考项目为 Python 版本，已完全迁移为 Node.js。
- 代码风格以实用为主，部分命名和结构可能不完全统一。

---
如需补充项目约定、开发流程或架构细节，请在 PR 或 Issue 中说明。
