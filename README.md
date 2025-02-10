# 网易云音乐下载工具

一个基于 Node.js 的网易云音乐下载工具，支持 API 服务模式和命令行模式，可以下载不同音质的音乐文件。

## 功能特点

- 支持多种音质下载（标准、极高、无损、Hi-Res等）
- 支持网页 API 服务模式
- 支持命令行工具模式
- 自动获取歌曲信息（标题、艺术家、专辑等）
- 支持歌词获取（包括翻译歌词）
- 自动写入音乐元数据
- 支持进度显示

## 安装

1. 克隆仓库：
```bash
git clone [你的仓库地址]
cd Netease_url
```
2. 安装依赖：
```bash
npm install
 ```

3. 配置 cookie：
   在项目根目录创建 cookie.txt 文件，填入网易云音乐的 cookie。
## 使用方法
### API 服务模式
启动 API 服务：

```bash
node main.js --mode api
 ```

服务将在 http://localhost:15001 启动

### 命令行模式
使用命令行模式下载音乐：

```bash
node main.js --mode gui --url [音乐链接] --level [音质]
 ```

音质选项：

- standard: 标准音质
- exhigh: 极高音质
- lossless: 无损音质
- hires: Hi-Res音质
- sky: 沉浸环绕声
- jyeffect: 高清环绕声
- jymaster: 超清母带
## API 接口说明
### 获取音乐信息
- 接口： /Song_V1
- 方法：GET
- 参数：
  - ids: 音乐 ID
  - url: 网易云音乐链接
  - level: 音质等级
  - type: 返回类型（text/json/down）
## 依赖项
- express
- axios
- commander
- fluent-ffmpeg
- ffmetadata
- temp-write
## 注意事项
- 需要安装 ffmpeg
- 需要有效的网易云音乐 cookie
- 部分音质可能需要 VIP 权限

## License
MIT License

## 参考
基于[Netease_url](https://github.com/Suxiaoqinx/Netease_url)修改为nodejs的版本
使用Trae进行代码生成 ，本程序完全由AI实现包括Python转Node以及需求通知