import axios from 'axios';
import fs from 'fs';
import path from 'path';
import tempWrite from 'temp-write';
import archiver from 'archiver';
import NodeID3tag from 'node-id3tag';
import { sanitizeFilename } from '../utils/helpers.js';
import os from 'os';

class DownloadService {
    static async downloadSingleSong(songData, lyricv1, namev1) {
        const musicResponse = await axios({
            method: 'get',
            url: songData.url,
            responseType: 'arraybuffer'
        });

        const urlExt = songData.url.split('?')[0].split('.').pop().toLowerCase();
        const fileExt = ['mp3', 'flac'].includes(urlExt) ? `.${urlExt}` : '.mp3';
        const sanitizedName = sanitizeFilename(`${songData.ar_name} - ${songData.name}`);
        const fileName = `${sanitizedName}${fileExt}`;
        const tempFile = await tempWrite(musicResponse.data, `temp${fileExt}`);

        await this.writeTags(tempFile, songData, lyricv1, namev1);

        return { tempFile, fileName };
    }

    static async writeTags(tempFile, songData, lyricv1, namev1) {
        const tags = await this.prepareTags(songData, lyricv1, namev1);

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

        const success = NodeID3tag.write(tags, tempFile);
        if (!success) {
            throw new Error('标签写入失败');
        }
    }

    static async prepareTags(songData, lyricv1, namev1) {
        const tags = {
            title: songData.name,
            artist: songData.ar_name,
            album: songData.al_name,
            trackNumber: namev1.songs[0].no.toString(),
            year: new Date(namev1.songs[0].publishTime || Date.now()).getFullYear().toString(),
        };

        if (lyricv1.tlyric?.lyric) {
            const combinedLyrics = this.combineLyrics(lyricv1.lrc.lyric, lyricv1.tlyric.lyric);
            tags.unsynchronisedLyrics = {
                language: "chi",
                text: combinedLyrics
            };
        }

        return tags;
    }

    static combineLyrics(originalLyric, translatedLyric) {
        const lrcMap = new Map();
        const originalLyrics = originalLyric.split('\n');
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
            ...translatedLyric.split('\n').map(line => {
                const match = line.match(/^\[(\d{2}:\d{2}\.\d{2})\](.*)/);
                if (match && lrcMap.has(match[1])) {
                    return `[${match[1]}]${lrcMap.get(match[1]).trim()} ${match[2].trim()}`;
                }
                return line;
            })
        ].join('\n');

        return combinedLyrics;
    }

    static async createBatchDownloadZip(files) {
        const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'netease-'));
        const zipFile = path.join(tempDir, 'songs.zip');
        const archive = archiver('zip', { zlib: { level: 9 } });
        const output = fs.createWriteStream(zipFile);

        return new Promise((resolve, reject) => {
            output.on('close', () => resolve({ zipFile, tempDir }));
            output.on('error', reject);
            archive.on('error', reject);

            archive.pipe(output);
            files.forEach(file => {
                archive.file(file.path, { name: file.name });
            });
            archive.finalize();
        });
    }

    static cleanup(files, tempDir) {
        files.forEach(file => fs.unlink(file.path, () => {}));
        if (tempDir) {
            fs.rm(tempDir, { recursive: true }, () => {});
        }
    }
}

export default DownloadService;