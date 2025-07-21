import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import { program } from 'commander';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { URLSearchParams } from 'url';
import tempWrite from 'temp-write';
// 在文件顶部添加 node-id3 导入
import NodeID3tag from 'node-id3tag';
import archiver from 'archiver';
import os from 'os';
// 获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 工具函数
const hexDigest = (data) => {
    return Buffer.from(data).toString('hex');
};

const hashDigest = (text) => {
    return crypto.createHash('md5').update(text).digest();
};

const hashHexDigest = (text) => {
    return hexDigest(hashDigest(text));
};

const parseCookie = (text) => {
    const cookie = {};
    text.split(';').forEach(item => {
        const parts = item.trim().split('=');
        if (parts.length === 2) {
            cookie[parts[0].trim()] = parts[1].trim();
        }
    });
    return cookie;
};

const readCookie = () => {
    const cookiePath = path.join(os.homedir(), 'NeteaseCookie.txt');
    return fs.readFileSync(cookiePath, 'utf-8');
};

const post = async (url, params, cookie) => {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36 Chrome/91.0.4472.164 NeteaseMusicDesktop/2.10.2.200154',
        'Referer': '',
        'Cookie': Object.entries({ os: 'pc', appver: '', osver: '', deviceId: 'pyncm!', ...cookie })
            .map(([k, v]) => `${k}=${v}`).join('; ')
    };

    const response = await axios.post(url, new URLSearchParams({ params }), { headers });
    return response.data;
};

// 添加解析歌单的函数
const parsePlaylist = async (url, cookies) => {
    try {
        const response = await axios.get(url, {
            headers: {
                'Cookie': Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; '),
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.2 Mobile/15E148 Safari/604.1'
            }
        });

        const songIds = [];
        const songList = response.data;

        // 使用新的正则表达式匹配移动版网页中的歌曲ID
        const regex = /\/\/music\.163\.com\/m\/song\?id=(\d+)/g;
        let match;

        while ((match = regex.exec(songList)) !== null) {
            songIds.push(match[1]);
        }

        if (songIds.length === 0) {
            throw new Error('未找到歌单内容');
        }

        return songIds;
    } catch (error) {
        console.error('解析歌单失败:', error);
        throw error;
    }
};

const parseIds = async (ids) => {
    if (ids.includes('163cn.tv')) {
        const response = await axios.get(ids, { maxRedirects: 0 }).catch(error => {
            if (error.response.status === 302) {
                return { headers: { location: error.response.headers.location } };
            }
            throw error;
        });
        ids = response.headers.location;
    }
    if (ids.includes('music.163.com')) {
        // 移除 #/ 
        ids = ids.replace('#/', '');

        if (ids.includes('/playlist?')) {
            // 如果是歌单链接，解析整个歌单
            const cookies = parseCookie(readCookie());
            return await parsePlaylist(ids, cookies);
        }
        const index = ids.indexOf('id=') + 3;
        ids = ids.slice(index).split('&')[0];
    }
    return ids;
};

const formatSize = (value) => {
    const units = ["B", "KB", "MB", "GB", "TB", "PB"];
    let size = 1024.0;
    for (let i = 0; i < units.length; i++) {
        if ((value / size) < 1) {
            return `${value.toFixed(2)}${units[i]}`;
        }
        value = value / size;
    }
    return value;
};

const getMusicLevel = (value) => {
    const levels = {
        'standard': "标准音质",
        'exhigh': "极高音质",
        'lossless': "无损音质",
        'hires': "Hires音质",
        'sky': "沉浸环绕声",
        'jyeffect': "高清环绕声",
        'jymaster': "超清母带"
    };
    return levels[value] || "未知音质";
};

const getUrlV1 = async (id, level, cookies) => {
    const url = "https://interface3.music.163.com/eapi/song/enhance/player/url/v1";
    const AES_KEY = Buffer.from("e82ckenh8dichen8");
    const config = {
        os: "pc",
        appver: "",
        osver: "",
        deviceId: "pyncm!",
        requestId: Math.floor(Math.random() * (30000000 - 20000000) + 20000000).toString()
    };

    const payload = {
        ids: [id],
        level,
        encodeType: 'flac',
        header: JSON.stringify(config)
    };

    if (level === 'sky') {
        payload.immerseType = 'c51';
    }

    const url2 = new URL(url).pathname.replace("/eapi/", "/api/");
    const digest = hashHexDigest(`nobody${url2}use${JSON.stringify(payload)}md5forencrypt`);
    const params = `${url2}-36cd479b6b5-${JSON.stringify(payload)}-36cd479b6b5-${digest}`;

    const cipher = crypto.createCipheriv('aes-128-ecb', AES_KEY, null);
    let encrypted = cipher.update(params, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const response = await post(url, encrypted, cookies);

    // 添加错误处理
    if (!response || !response.data || response.data.length === 0) {
        throw new Error('获取音乐URL失败');
    }

    return response;  // 返回完整的 response
};

const getNameV1 = async (id) => {
    const url = "https://interface3.music.163.com/api/v3/song/detail";
    const response = await axios.post(url,
        new URLSearchParams({
            c: JSON.stringify([{ id, v: 0 }])
        }),
        {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
    );
    return response.data;
};

const getLyricV1 = async (id, cookies) => {
    const url = "https://interface3.music.163.com/api/song/lyric";
    const response = await axios.post(url,
        new URLSearchParams({
            id,
            cp: 'false',
            tv: '0',
            lv: '0',
            rv: '0',
            kv: '0',
            yv: '0',
            ytv: '0',
            yrv: '0'
        }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ')
            }
        }
    );
    return response.data;
};

const Song_V1 = async (req, res) => {
    try {
        const { ids, url, level, type } = req.query;
        const selectedIds = req.query.selectedIds ? JSON.parse(req.query.selectedIds) : null;
        const cookies = parseCookie(readCookie());

        // 批量下载处理
        if (type === 'batchDown' && selectedIds && selectedIds.length > 0) {
            const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'netease-'));
            const files = [];

            try {
                // 下载选中的所有歌曲
                for (const id of selectedIds) {
                    const urlv1 = await getUrlV1(id, level, cookies);
                    const namev1 = await getNameV1(urlv1.data[0].id);
                    const lyricv1 = await getLyricV1(urlv1.data[0].id, cookies);

                    // 下载音乐文件
                    const musicResponse = await axios({
                        method: 'get',
                        url: urlv1.data[0].url.replace('http://', 'https://'),
                        responseType: 'arraybuffer'
                    });

                    // 从 URL 中获取文件扩展名
                    const urlExt = urlv1.data[0].url.split('?')[0].split('.').pop().toLowerCase();
                    const fileExt = ['mp3', 'flac'].includes(urlExt) ? `.${urlExt}` : '.mp3';

                    // 清理文件名
                    const sanitizedName = `${namev1.songs[0].ar.map(ar => ar.name).join('/')} - ${namev1.songs[0].name}`
                        .replace(/[<>:"/\\|?*]/g, '')
                        .replace(/\s+/g, ' ')
                        .trim();

                    // 创建临时文件
                    const tempFile = await tempWrite(musicResponse.data, `temp${fileExt}`);

                    // 准备 ID3 标签
                    const tags = {
                        title: namev1.songs[0].name,
                        artist: namev1.songs[0].ar.map(ar => ar.name).join('/'),
                        album: namev1.songs[0].al.name,
                        trackNumber: namev1.songs[0].no.toString(),
                        year: new Date(namev1.songs[0].publishTime || Date.now()).getFullYear().toString(),
                    };

                    // 添加歌词
                    if (lyricv1.tlyric?.lyric) {
                        const lrcMap = new Map();
                        const originalLyrics = lyricv1.lrc.lyric.split('\n');
                        const headerLines = originalLyrics
                            .filter(line => line.startsWith('[00:00.00]') || line.startsWith('[00:01.00]'));

                        originalLyrics.forEach(line => {
                            const match = line.match(/^\[(\d{2}:\d{2}\.\d{2})\](.*)/);
                            if (match) {
                                lrcMap.set(match[1], match[2]);
                            }
                        });

                        const combinedLyrics = [
                            ...headerLines,
                            ...lyricv1.tlyric.lyric.split('\n').map(line => {
                                const match = line.match(/^\[(\d{2}:\d{2}\.\d{2})\](.*)/);
                                if (match && lrcMap.has(match[1])) {
                                    return `[${match[1]}]${lrcMap.get(match[1]).trim()} ${match[2].trim()}`;
                                }
                                return line;
                            })
                        ].join('\n');

                        tags.unsynchronisedLyrics = {
                            language: "chi",
                            text: combinedLyrics
                        };
                    }

                    // 添加封面
                    if (namev1.songs[0].al.picUrl) {
                        try {
                            const imageResponse = await axios.get(namev1.songs[0].al.picUrl, {
                                responseType: 'arraybuffer'
                            });
                            const tempImagePath = await tempWrite(imageResponse.data, 'cover.jpg');
                            tags.APIC = tempImagePath;
                        } catch (error) {
                            console.error('封面下载失败:', error);
                        }
                    }

                    // 写入标签
                    const success = NodeID3tag.write(tags, tempFile);
                    if (!success) {
                        throw new Error('标签写入失败');
                    }

                    // 将处理后的文件添加到列表
                    files.push({
                        path: tempFile,
                        name: `${sanitizedName}${fileExt}`
                    });
                }

                // 创建 ZIP 文件
                const zipFile = path.join(tempDir, 'songs.zip');
                const archive = archiver('zip', { zlib: { level: 9 } });
                const output = fs.createWriteStream(zipFile);

                // 添加错误处理
                output.on('error', (err) => {
                    throw err;
                });

                archive.on('error', (err) => {
                    throw err;
                });

                // 等待 ZIP 文件完全写入
                await new Promise((resolve, reject) => {
                    output.on('close', resolve);
                    output.on('error', reject);

                    archive.pipe(output);
                    files.forEach(file => {
                        archive.file(file.path, { name: file.name });
                    });
                    archive.finalize();
                });

                // 发送 ZIP 文件
                res.download(zipFile, 'songs.zip', () => {
                    // 清理临时文件
                    files.forEach(file => fs.unlink(file.path, () => { }));
                    fs.rm(tempDir, { recursive: true }, () => { });
                });
                return;
            } catch (error) {
                fs.rm(tempDir, { recursive: true }, () => { });
                throw error;
            }
        }

        if (!ids && !url) {
            return res.status(400).json({ error: '必须提供 ids 或 url 参数' });
        }
        if (!level) {
            return res.status(400).json({ error: 'level参数为空' });
        }
        if (!type) {
            return res.status(400).json({ error: 'type参数为空' });
        }

        const jsondata = ids || url;
        const parsedIds = await parseIds(jsondata);

        // 处理单个ID或多个ID的情况
        if (Array.isArray(parsedIds)) {
            // 如果是歌单，返回所有歌曲的信息
            const songs = await Promise.all(parsedIds.map(async (id) => {
                const urlv1 = await getUrlV1(id, level, cookies);
                const namev1 = await getNameV1(urlv1.data[0].id);
                const lyricv1 = await getLyricV1(urlv1.data[0].id, cookies);

                return {
                    id: urlv1.data[0].id,  // 添加歌曲ID
                    name: namev1.songs[0].name,
                    pic: namev1.songs[0].al.picUrl,
                    ar_name: namev1.songs[0].ar.map(ar => ar.name).join('/'),
                    al_name: namev1.songs[0].al.name,
                    level: getMusicLevel(urlv1.data[0].level),
                    size: formatSize(urlv1.data[0].size),
                    url: urlv1.data[0].url.replace('http://', 'https://')
                };
            }));

            if (type === 'text') {
                res.send(songs.map(song =>
                    `歌曲名称：${song.name}<br>歌曲图片：${song.pic}<br>歌手：${song.ar_name}<br>歌曲专辑：${song.al_name}<br>歌曲音质：${song.level}<br>歌曲大小：${song.size}<br>音乐地址：${song.url}`
                ).join('<br><br>'));
            } else if (type === 'json') {
                res.json({
                    status: 200,
                    songs
                });
            }
        } else {
            // 原有的单曲处理逻辑
            const urlv1 = await getUrlV1(parsedIds, level, cookies);
            const namev1 = await getNameV1(urlv1.data[0].id);
            const lyricv1 = await getLyricV1(urlv1.data[0].id, cookies);

            if (!urlv1.data[0].url || !namev1.songs) {
                return res.status(400).json({ status: 400, msg: '信息获取不完整！' });
            }

            const songData = {
                id: urlv1.data[0].id,  // 添加这行
                name: namev1.songs[0].name,
                pic: namev1.songs[0].al.picUrl,
                ar_name: namev1.songs[0].ar.map(ar => ar.name).join('/'),
                al_name: namev1.songs[0].al.name,
                level: getMusicLevel(urlv1.data[0].level),
                size: formatSize(urlv1.data[0].size),
                url: urlv1.data[0].url.replace('http://', 'https://')
            };

            if (type === 'text') {
                res.send(`歌曲名称：${songData.name}<br>歌曲图片：${songData.pic}<br>歌手：${songData.ar_name}<br>歌曲专辑：${songData.al_name}<br>歌曲音质：${songData.level}<br>歌曲大小：${songData.size}<br>音乐地址：${songData.url}`);
                // 在 app.all('/Song_V1') 路由中，找到 type === 'down' 的部分，修改如下：
                // 在 type === 'down' 的部分，修改如下
            } else if (type === 'down') {
                try {
                    // 下载音乐文件
                    const musicResponse = await axios({
                        method: 'get',
                        url: songData.url,
                        responseType: 'arraybuffer'
                    });

                    // 从 URL 中获取文件扩展名
                    const urlExt = songData.url.split('?')[0].split('.').pop().toLowerCase();
                    const fileExt = ['mp3', 'flac'].includes(urlExt) ? `.${urlExt}` : '.mp3';

                    // 清理文件名，移除非法字符
                    const sanitizedName = `${songData.ar_name} - ${songData.name}`
                        .replace(/[<>:"/\\|?*]/g, '')
                        .replace(/\s+/g, ' ')
                        .trim();

                    const fileName = `${sanitizedName}${fileExt}`;

                    // 创建带扩展名的临时文件
                    const tempFile = await tempWrite(musicResponse.data, `temp${fileExt}`);

                    // 准备 ID3 标签
                    const tags = {
                        // 基本信息
                        title: songData.name,
                        artist: songData.ar_name,
                        album: songData.al_name,
                        trackNumber: namev1.songs[0].no.toString(),  // 专辑中的曲目编号
                        year: new Date(namev1.songs[0].publishTime || Date.now()).getFullYear().toString(),
                        size: songData.size,
                    };

                    // 如果有翻译歌词，将中英文合并
                    if (lyricv1.tlyric?.lyric) {
                        // 创建一个Map来存储时间戳和对应的英文歌词
                        const lrcMap = new Map();
                        const originalLyrics = lyricv1.lrc.lyric.split('\n');

                        // 先处理作词作曲信息
                        const headerLines = originalLyrics
                            .filter(line => line.startsWith('[00:00.00]') || line.startsWith('[00:01.00]'));

                        // 处理其余歌词
                        originalLyrics.forEach(line => {
                            const match = line.match(/^\[(\d{2}:\d{2}\.\d{2})\](.*)/);
                            if (match) {
                                lrcMap.set(match[1], match[2]);
                            }
                        });

                        // 合并歌词，先添加作词作曲信息
                        const combinedLyrics = [
                            ...headerLines,
                            ...lyricv1.tlyric.lyric.split('\n').map(line => {
                                const match = line.match(/^\[(\d{2}:\d{2}\.\d{2})\](.*)/);
                                if (match && lrcMap.has(match[1])) {
                                    const englishLyric = lrcMap.get(match[1]).trim();
                                    const chineseLyric = match[2].trim();
                                    return `[${match[1]}]${englishLyric} ${chineseLyric}`;
                                }
                                return line;
                            })
                        ].join('\n');

                        tags.unsynchronisedLyrics = {
                            language: "chi",
                            text: combinedLyrics
                        };
                    }

                    // 如果有封面图片的处理保持不变...
                    if (songData.pic) {
                        try {
                            const imageResponse = await axios.get(songData.pic, {
                                responseType: 'arraybuffer'
                            });
                            const tempImagePath = await tempWrite(imageResponse.data, 'cover.jpg');
                            tags.APIC = tempImagePath;
                        } catch (error) {
                            console.error('封面下载失败:', error);
                        }
                    }

                    // 写入 ID3 标签
                    try {
                        const success = NodeID3tag.write(tags, tempFile);

                        if (success) {
                            // 读取处理后的文件
                            const finalData = fs.readFileSync(tempFile);

                            // 设置响应头
                            res.setHeader('Content-Type', 'application/octet-stream');
                            res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);

                            // 发送文件
                            res.end(finalData);
                        } else {
                            throw new Error('标签写入失败');
                        }
                    } catch (error) {
                        console.error('标签写入错误:', error);
                        res.status(500).json({ error: '标签写入失败' });
                    }

                    // 清理临时文件
                    fs.unlink(tempFile, () => { });

                } catch (error) {
                    console.error('Download error:', error);
                    res.status(500).json({ error: '下载出错' });
                }
            } else if (type === 'json') {
                res.json({
                    status: 200,
                    ...songData,
                    lyric: lyricv1.lrc.lyric,
                    tlyric: lyricv1.tlyric?.lyric || null
                });
            } else {
                res.status(400).json({ status: 400, msg: '解析失败！请检查参数是否完整！' });
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, msg: '服务器错误' });
    }
}

// Express 应用
const app = express();
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

app.all('/Song_V1', async (req, res) => {
    Song_V1(req, res);
});

// CLI 功能
const startGui = async (url, level = 'lossless') => {
    if (!url) {
        console.log("没有提供 URL 参数");
        return;
    }

    console.log(`正在处理 URL: ${url}，音质：${level}`);
    try {
        const songIds = await parseIds(url);
        const cookies = parseCookie(readCookie());
        const urlv1 = await getUrlV1(songIds, level, cookies);
        const namev1 = await getNameV1(urlv1.data[0].id);
        const lyricv1 = await getLyricV1(urlv1.data[0].id, cookies);

        console.log(`
                歌曲名称: ${namev1.songs[0].name}
                歌曲图片: ${namev1.songs[0].al.picUrl}
                歌手: ${namev1.songs[0].ar.map(ar => ar.name).join(', ')}
                专辑名称: ${namev1.songs[0].al.name}
                音质: ${getMusicLevel(urlv1.data[0].level)}
                大小: ${formatSize(urlv1.data[0].size)}
                音乐链接: ${urlv1.data[0].url}
                歌词: ${lyricv1.lrc.lyric}
                翻译歌词: ${lyricv1.tlyric?.lyric || '没有翻译歌词'}
            `);
    } catch (error) {
        console.error('处理出错:', error);
    }
};

const startApi = () => {
    const port = 15002;
    app.listen(port, '0.0.0.0', () => {
        console.log(`服务器运行在 http://0.0.0.0:${port}`);
    });
};

// 命令行参数解析
program
    .option('--mode <mode>', '选择启动模式：api 或 gui', 'api')
    .option('--url <url>', '提供 URL 参数供 GUI 模式使用')
    .option('--level <level>', '选择音质等级', 'lossless')
    .parse(process.argv);

const options = program.opts();

if (options.mode === 'api') {
    startApi();
} else if (options.mode === 'gui') {
    startGui(options.url, options.level);
}


export function configureApp(app) {
    app.use(express.static('public'));
    app.use(express.urlencoded({ extended: true }));

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'templates', 'index.html'));
    });

    app.all('/Song_V1', async (req, res) => {
        Song_V1(req, res);
    });

    return app;
}

// For standalone Node.js execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const app = express();
    configureApp(app);
    const port = 15001;
    app.listen(port, '0.0.0.0', () => {
        console.log(`Server running at http://0.0.0.0:${port}`);
    });
}