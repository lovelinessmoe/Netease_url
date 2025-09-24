# Copilot Instructions for Netease_url

## 项目架构概览

本项目为 Node.js + Electron 构建的网易云音乐下载工具，支持 API 服务和命令行两种模式。主要结构如下：

- `main.js`/`src/app.js`：入口文件，负责命令行参数解析、服务启动（API/GUI）、主流程调度。
- `electron.js`：Electron 主进程，负责窗口管理、开发者工具快捷键（F12）、桌面集成。
- `src/services/`：业务服务层，包含音乐信息获取（`musicService.js`）、下载与标签写入（`downloadService.js`）、歌单解析（`playlistService.js`）。
- `src/controllers/`：控制器层，处理路由和请求分发。
- `src/utils/`：工具函数，包括 cookie 处理、加密、格式化、辅助方法。
- `src/config/constants.js`：全局常量、API 地址、音质等级、默认配置。
- `public/`、`assets/`、`src/templates/`：前端资源与界面模板。

数据流：用户输入（命令行或 API）→ 歌曲/歌单解析 → 音乐信息/下载链接获取 → 下载/写入标签 → 返回结果或保存文件。

## 关键开发流程

### 启动与调试
- API 服务：`node main.js --mode api` 或 `npm run start`，监听端口 15001。
- 命令行下载：`node main.js --mode gui --url <链接> --level <音质>`。
- Electron 桌面：`npm run electron:dev` 或 `npm run electron:start`。
- 开发者工具：桌面端按 F12 快捷键。

### 构建与打包
- 使用 Electron Forge，相关命令见 `package.json`（如 `electron:package`, `electron:make`）。
- 配置见 `forge.config.js`，支持多平台打包（deb/dmg/zip/squirrel）。

### 依赖与集成
- 需安装 ffmpeg（本地依赖，非 npm）。
- 需在根目录配置 `cookie.txt`，内容为网易云音乐 cookie。
- 依赖包如 axios、express、commander、node-id3tag、temp-write、fluent-ffmpeg。

## 主要约定与模式

- 所有 API 地址、音质等级、默认参数集中于 `src/config/constants.js`。
- Cookie 读取与解析统一用 `src/utils/cookieUtil.js` 或 `helpers.js`。
- 文件名、标签写入需用 `sanitizeFilename` 工具，防止非法字符。
- 服务层方法多为静态方法，参数传递需包含 cookie、level 等上下文。
- 错误处理统一返回 `{ status, msg }`，并在控制台打印详细错误。
- 歌曲下载流程：解析链接 → 获取 ID → 获取下载链接 → 下载 → 写入标签 → 返回/保存。

## 典型文件/目录说明

- `main.js`/`src/app.js`：主入口，命令行与 API 服务启动逻辑。
- `electron.js`：桌面端窗口与调试集成。
- `src/services/musicService.js`：音乐信息与下载链接获取，API 封装。
- `src/services/downloadService.js`：下载与标签写入，集成 node-id3tag、temp-write。
- `src/utils/helpers.js`：通用工具函数。
- `src/config/constants.js`：全局常量。
- `public/`、`assets/`、`src/templates/`：前端资源与界面。

## 其他注意事项

- ffmpeg 必须本地安装，未安装会导致下载/标签写入失败。
- cookie 必须为有效网易云音乐 cookie，部分音质需 VIP 权限。
- API 服务默认端口 15001，可在 `constants.js` 配置。
- 参考实现基于 Python 版本自动转换，部分代码风格可能与常规 Node 项目不同。

如需补充项目约定、开发流程或架构细节，请在 PR 或 Issue 中说明。
