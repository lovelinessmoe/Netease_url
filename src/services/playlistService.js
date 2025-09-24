import axios from 'axios';
import { CookieUtil } from '../utils/cookieUtil.js';

export class PlaylistService {
    static async parsePlaylist(url, cookies) {
        try {
            const response = await axios.get(url, {
                headers: {
                    'Cookie': Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; '),
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.2 Mobile/15E148 Safari/604.1'
                }
            });

            const songIds = [];
            const songList = response.data;
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
    }

    static async parseIds(ids) {
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
            ids = ids.replace('#/', '');

            if (ids.includes('/playlist?')) {
                const cookies = CookieUtil.parseCookie(CookieUtil.readCookie());
                return await this.parsePlaylist(ids, cookies);
            }
            
            const index = ids.indexOf('id=') + 3;
            ids = ids.slice(index).split('&')[0];
        }
        
        return ids;
    }
}

export default PlaylistService;