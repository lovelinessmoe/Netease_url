# 网易云音乐下载工具

一个基于 Electron 的网易云音乐下载工具，支持桌面应用和 API 服务模式，可以下载不同音质的音乐文件。

## 功能特点

- 🎵 支持多种音质下载（标准、极高、无损、Hi-Res等）
- 🖥️ 桌面应用界面，简单易用
- 🌐 支持网页 API 服务模式
- ⚙️ 支持命令行工具模式
- 📝 自动获取歌曲信息（标题、艺术家、专辑等）
- 📄 支持歌词获取（包括翻译歌词）
- 🏷️ 自动写入音乐元数据
- 📊 支持进度显示
- 📦 支持批量下载
- 📋 自动记录日志，方便调试

## 下载安装

### 从 Release 下载

前往 [Releases](../../releases) 页面下载适合你系统的安装包：

#### Windows 用户

**推荐安装方式：**
- 下载 `Netease.Music.Downloader-1.0.0.Setup.exe`（约 132 MB）
- 双击运行，按照提示完成安装
- 安装后会在开始菜单创建快捷方式
- 支持自动更新

**便携版：**
- `netease-music-downloader.exe`（约 201 MB）- 单文件便携版，无需安装，双击即可运行
- `Netease.Music.Downloader-win32-x64-1.0.0.zip`（约 136 MB）- 压缩包便携版，解压后运行

#### macOS 用户

**推荐安装方式：**
- 下载 `Netease.Music.Downloader.dmg`（约 120 MB）
- 双击打开，将应用拖拽到 Applications 文件夹
- 首次运行可能需要在"系统偏好设置 > 安全性与隐私"中允许运行

**便携版：**
- `Netease.Music.Downloader-darwin-arm64-1.0.0.zip`（约 121 MB）- 适用于 Apple Silicon (M1/M2/M3) 芯片的便携版

### 日志文件位置

应用运行时会自动记录日志，方便排查问题：

- **Windows**: `C:\Users\你的用户名\AppData\Roaming\netease_url\logs\`
- **macOS**: `~/Library/Logs/netease_url/`
- **Linux**: `~/.config/netease_url/logs/`

日志文件按日期命名（如 `app-2025-12-22.log`），自动保留最近 7 天的日志。

## 从源码安装

### 前置要求

- Node.js 18 或更高版本
- npm 或 pnpm
- ffmpeg（用于音频处理）

### 安装步骤

1. 克隆仓库：
```bash
git clone https://github.com/你的用户名/Netease_url.git
cd Netease_url
```

2. 安装依赖：
```bash
npm install
```

3. 配置 cookie（可选，用于访问会员音质）：

   在**用户主目录**下创建 `NeteaseCookie.txt` 文件，填入网易云音乐的 cookie。

   文件位置：
   - **Windows**: `C:\Users\你的用户名\NeteaseCookie.txt`
   - **macOS/Linux**: `~/NeteaseCookie.txt`

   获取 cookie 的方法：
   1. 在浏览器中登录网易云音乐网页版
   2. 按 F12 打开开发者工具
   3. 切换到"Network"标签，刷新页面
   4. 找到任意请求，在 Request Headers 中复制 Cookie 值
   5. 粘贴到 `NeteaseCookie.txt` 文件中

## 使用方法

### 桌面应用模式（推荐）

启动 Electron 桌面应用：

```bash
npm run dev
```

应用将自动打开窗口，在浏览器界面中使用。

### API 服务模式

如果只需要 API 服务，不需要桌面窗口：

```bash
node main.js --mode api
```

服务将在 `http://localhost:15001` 启动。

### 支持的音质选项

- `standard`: 标准音质
- `exhigh`: 极高音质
- `lossless`: 无损音质
- `hires`: Hi-Res音质
- `sky`: 沉浸环绕声
- `jyeffect`: 高清环绕声
- `jymaster`: 超清母带

## 构建打包

### 本地构建

构建适合当前平台的应用：

```bash
npm run electron:make
```

构建 Windows 版本：

```bash
npm run electron:make-win
```

构建产物将输出到 `out/make/` 目录。

### 发布新版本

使用 GitHub Actions 自动构建和发布：

1. 创建新的版本标签：
```bash
git tag v1.0.1
git push origin v1.0.1
```

2. GitHub Actions 将自动：
   - 为 Windows 和 macOS 构建应用
   - 创建 Draft Release
   - 上传所有构建产物

3. 在 GitHub Releases 页面编辑并发布 Release

## API 接口说明

### 获取音乐信息

- **接口**： `/Song_V1`
- **方法**：GET
- **参数**：
  - `ids`: 音乐 ID
  - `url`: 网易云音乐链接
  - `level`: 音质等级
  - `type`: 返回类型（text/json/down）

## 技术栈

### 主要技术
- **Electron** - 桌面应用框架
- **Express** - Web 服务框架
- **Axios** - HTTP 客户端
- **electron-log** - 日志记录

### 音频处理
- **fluent-ffmpeg** - FFmpeg 封装
- **ffmetadata** - 音频元数据处理
- **node-id3tag** - ID3 标签处理

### 构建工具
- **Electron Forge** - 应用打包和分发
- **GitHub Actions** - 自动化构建和发布

## 常见问题

### Windows 上无法运行？
- 检查是否被杀毒软件拦截
- 右键选择"以管理员身份运行"
- 在"系统设置 > 应用和功能"中允许运行

### macOS 上提示"无法打开"？
- 前往"系统偏好设置 > 安全性与隐私"
- 点击"仍要打开"按钮
- 或在终端运行：`xattr -cr /Applications/Netease\ Music\ Downloader.app`

### 如何查看日志？
- 查看上面"日志文件位置"部分
- 或按 F12 打开开发者工具查看控制台

### 部分音质无法下载？
- 某些高音质需要 VIP 会员权限
- 确保在用户主目录下配置了有效的 `NeteaseCookie.txt` 文件
  - Windows: `C:\Users\你的用户名\NeteaseCookie.txt`
  - macOS/Linux: `~/NeteaseCookie.txt`
- Cookie 需要从已登录的网易云音乐网页版获取

### 如何获取 Cookie？
1. 在浏览器中打开 [music.163.com](https://music.163.com) 并登录
2. 按 F12 打开开发者工具
3. 切换到"Network"（网络）标签
4. 刷新页面或播放任意歌曲
5. 点击任意请求，在右侧找到"Request Headers"
6. 找到"Cookie"字段，复制完整的值
7. 将复制的内容保存到用户主目录下的 `NeteaseCookie.txt` 文件中

## 贡献

欢迎提交 Issue 和 Pull Request！

## License

MIT License

## 致谢

- 基于 [Netease_url](https://github.com/Suxiaoqinx/Netease_url) 修改为 Node.js 版本
- 使用 AI 辅助进行代码生成和转换
- 感谢所有贡献者

## 免责声明

本工具仅供学习交流使用，请勿用于商业用途。下载的音乐文件请在 24 小时内删除，支持正版音乐。
