import { CookieUtil } from '../utils/cookieUtil.js';
import { formatSize } from '../utils/formatUtil.js';
import { MusicService } from '../services/musicService.js';
import PlaylistService from '../services/playlistService.js';
import DownloadService from '../services/downloadService.js';
import fs from 'fs';

export class MusicController {
    static async handleSongRequest(req, res) {
        try {
            const { ids, url, level, type } = req.query;
            const selectedIds = req.query.selectedIds ? JSON.parse(req.query.selectedIds) : null;
            const cookies = CookieUtil.parseCookie(CookieUtil.readCookie());

            if (type === 'batchDown') {
                await this.handleBatchDownload(selectedIds, level, cookies, res);
                return;
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
            const parsedIds = await PlaylistService.parseIds(jsondata);

            if (Array.isArray(parsedIds)) {
                await this.handlePlaylistRequest(parsedIds, level, cookies, type, res);
            } else {
                await this.handleSingleSongRequest(parsedIds, level, cookies, type, res);
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: 500, msg: '服务器错误' });
        }
    }

    static async handleBatchDownload(selectedIds, level, cookies, res) {
        if (!selectedIds || selectedIds.length === 0) {
            return res.status(400).json({ error: '未选择任何歌曲' });
        }

        try {
            const files = [];
            for (const id of selectedIds) {
                const urlv1 = await MusicService.getUrlV1(id, level, cookies);
                const namev1 = await MusicService.getNameV1(urlv1.data[0].id);
                const lyricv1 = await MusicService.getLyricV1(urlv1.data[0].id, cookies);

                const songData = {
                    name: namev1.songs[0].name,
                    ar_name: namev1.songs[0].ar.map(ar => ar.name).join('/'),
                    al_name: namev1.songs[0].al.name,
                    pic: namev1.songs[0].al.picUrl,
                    url: urlv1.data[0].url.replace('http://', 'https://')
                };

                const { tempFile, fileName } = await DownloadService.downloadSingleSong(songData, lyricv1, namev1);
                files.push({ path: tempFile, name: fileName });
            }

            const { zipFile, tempDir } = await DownloadService.createBatchDownloadZip(files);
            res.download(zipFile, 'songs.zip', () => {
                DownloadService.cleanup(files, tempDir);
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: '批量下载失败' });
        }
    }

    static async handlePlaylistRequest(songIds, level, cookies, type, res) {
        const songs = await Promise.all(songIds.map(async (id) => {
            const urlv1 = await MusicService.getUrlV1(id, level, cookies);
            const namev1 = await MusicService.getNameV1(urlv1.data[0].id);
            const lyricv1 = await MusicService.getLyricV1(urlv1.data[0].id, cookies);

            return {
                id: urlv1.data[0].id,
                name: namev1.songs[0].name,
                pic: namev1.songs[0].al.picUrl,
                ar_name: namev1.songs[0].ar.map(ar => ar.name).join('/'),
                al_name: namev1.songs[0].al.name,
                level: MusicService.getMusicLevel(urlv1.data[0].level),
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
    }

    static async handleSingleSongRequest(id, level, cookies, type, res) {
        const urlv1 = await MusicService.getUrlV1(id, level, cookies);
        const namev1 = await MusicService.getNameV1(urlv1.data[0].id);
        const lyricv1 = await MusicService.getLyricV1(urlv1.data[0].id, cookies);

        if (!urlv1.data[0].url || !namev1.songs) {
            return res.status(400).json({ status: 400, msg: '信息获取不完整！' });
        }

        const songData = {
            id: urlv1.data[0].id,
            name: namev1.songs[0].name,
            pic: namev1.songs[0].al.picUrl,
            ar_name: namev1.songs[0].ar.map(ar => ar.name).join('/'),
            al_name: namev1.songs[0].al.name,
            level: MusicService.getMusicLevel(urlv1.data[0].level),
            size: formatSize(urlv1.data[0].size),
            url: urlv1.data[0].url.replace('http://', 'https://')
        };

        switch (type) {
            case 'text':
                res.send(`歌曲名称：${songData.name}<br>歌曲图片：${songData.pic}<br>歌手：${songData.ar_name}<br>歌曲专辑：${songData.al_name}<br>歌曲音质：${songData.level}<br>歌曲大小：${songData.size}<br>音乐地址：${songData.url}`);
                break;
            case 'down':
                try {
                    const { tempFile, fileName } = await DownloadService.downloadSingleSong(songData, lyricv1, namev1);
                    const finalData = fs.readFileSync(tempFile);

                    res.setHeader('Content-Type', 'application/octet-stream');
                    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
                    res.end(finalData);

                    fs.unlink(tempFile, () => {});
                } catch (error) {
                    console.error('Download error:', error);
                    res.status(500).json({ error: '下载出错' });
                }
                break;
            case 'json':
                res.json({
                    status: 200,
                    ...songData,
                    lyric: lyricv1.lrc.lyric,
                    tlyric: lyricv1.tlyric?.lyric || null
                });
                break;
            default:
                res.status(400).json({ status: 400, msg: '解析失败！请检查参数是否完整！' });
        }
    }
}