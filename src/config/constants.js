export const MUSIC_LEVELS = {
    'standard': "标准音质",
    'exhigh': "极高音质",
    'lossless': "无损音质",
    'hires': "Hires音质",
    'sky': "沉浸环绕声",
    'jyeffect': "高清环绕声",
    'jymaster': "超清母带"
};

export const API_ENDPOINTS = {
    MUSIC_URL: "https://interface3.music.163.com/eapi/song/enhance/player/url/v1",
    SONG_DETAIL: "https://interface3.music.163.com/api/v3/song/detail",
    SONG_LYRIC: "https://interface3.music.163.com/api/song/lyric"
};

export const DEFAULT_CONFIG = {
    os: "pc",
    appver: "",
    osver: "",
    deviceId: "pyncm!",
    port: 15001
};

export const AES_KEY = Buffer.from("e82ckenh8dichen8");

export const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36 Chrome/91.0.4472.164 NeteaseMusicDesktop/2.10.2.200154';