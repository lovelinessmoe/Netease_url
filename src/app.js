import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { program } from 'commander';
import { MusicController } from './controllers/musicController.js';
import { DEFAULT_CONFIG } from './config/constants.js';
import { CookieUtil } from './utils/cookieUtil.js';
import { MusicService } from './services/musicService.js';
import { PlaylistService } from './services/playlistService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function configureApp(app) {
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
        next();
    });
    // 静态资源目录改为绝对路径，兼容任意入口
    app.use(express.static(path.join(__dirname, '../public')));
    app.use(express.urlencoded({ extended: true }));

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'templates', 'index.html'));
    });

    app.all('/Song_V1', async (req, res) => {
        MusicController.handleSongRequest(req, res);
    });

    return app;
}

class NeteaseMusicApp {
    constructor() {
        this.app = configureApp();
    }

    startApi(port = DEFAULT_CONFIG.port) {
        this.app.listen(port, '0.0.0.0', () => {
            console.log(`服务器运行在 http://0.0.0.0:${port}`);
        });
    }

    static async startGui(url, level = 'lossless') {
        if (!url) {
            console.log("没有提供 URL 参数");
            return;
        }

        console.log(`正在处理 URL: ${url}，音质：${level}`);
        try {
            const cookies = CookieUtil.parseCookie(CookieUtil.readCookie());
            const songIds = await PlaylistService.parseIds(url);
            const urlv1 = await MusicService.getUrlV1(songIds, level, cookies);
            const namev1 = await MusicService.getNameV1(urlv1.data[0].id);
            const lyricv1 = await MusicService.getLyricV1(urlv1.data[0].id, cookies);

            console.log(`
                歌曲名称: ${namev1.songs[0].name}
                歌曲图片: ${namev1.songs[0].al.picUrl}
                歌手: ${namev1.songs[0].ar.map(ar => ar.name).join(', ')}
                专辑名称: ${namev1.songs[0].al.name}
                音质: ${MusicService.getMusicLevel(urlv1.data[0].level)}
                大小: ${formatSize(urlv1.data[0].size)}
                音乐链接: ${urlv1.data[0].url}
                歌词: ${lyricv1.lrc.lyric}
                翻译歌词: ${lyricv1.tlyric?.lyric || '没有翻译歌词'}
            `);
        } catch (error) {
            console.error('处理出错:', error);
        }
    }
}

// 命令行入口
if (import.meta.url === `file://${process.argv[1]}`) {
    program
        .option('--mode <mode>', '选择启动模式：api 或 gui', 'api')
        .option('--url <url>', '提供 URL 参数供 GUI 模式使用')
        .option('--level <level>', '选择音质等级', 'lossless')
        .parse(process.argv);

    const options = program.opts();
    const app = new NeteaseMusicApp();

    if (options.mode === 'api') {
        app.startApi();
    } else if (options.mode === 'gui') {
        NeteaseMusicApp.startGui(options.url, options.level);
    }
}

export default NeteaseMusicApp;