import axios from 'axios';
import crypto from 'crypto';
import { URLSearchParams } from 'url';
import { CryptoUtil } from '../utils/cryptoUtil.js';
import { API_ENDPOINTS, AES_KEY, USER_AGENT, DEFAULT_CONFIG, MUSIC_LEVELS } from '../config/constants.js';

export class MusicService {
    static async post(url, params, cookie) {
        const headers = {
            'User-Agent': USER_AGENT,
            'Referer': '',
            'Cookie': Object.entries({ os: 'pc', appver: '', osver: '', deviceId: 'pyncm!', ...cookie })
                .map(([k, v]) => `${k}=${v}`).join('; ')
        };
        const response = await axios.post(url, new URLSearchParams({ params }), { headers });
        return response.data;
    }

    static async getUrlV1(id, level, cookies) {
        const url = API_ENDPOINTS.MUSIC_URL;
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
        const digest = CryptoUtil.hashHexDigest(`nobody${url2}use${JSON.stringify(payload)}md5forencrypt`);
        const params = `${url2}-36cd479b6b5-${JSON.stringify(payload)}-36cd479b6b5-${digest}`;

        const cipher = crypto.createCipheriv('aes-128-ecb', AES_KEY, null);
        let encrypted = cipher.update(params, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const response = await this.post(url, encrypted, cookies);

        if (!response || !response.data || response.data.length === 0) {
            throw new Error('获取音乐URL失败');
        }

        return response;
    }

    static async getNameV1(id) {
        const response = await axios.post(API_ENDPOINTS.SONG_DETAIL,
            new URLSearchParams({
                c: JSON.stringify([{ id, v: 0 }])
            }),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
        );
        return response.data;
    }

    static async getLyricV1(id, cookies) {
        const response = await axios.post(API_ENDPOINTS.SONG_LYRIC,
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
    }

    static getMusicLevel(level) {
        return MUSIC_LEVELS[level] || "未知音质";
    }
}