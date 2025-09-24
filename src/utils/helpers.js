import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const hexDigest = (data) => {
    return Buffer.from(data).toString('hex');
};

export const hashDigest = (text) => {
    return crypto.createHash('md5').update(text).digest();
};

export const hashHexDigest = (text) => {
    return hexDigest(hashDigest(text));
};

export const parseCookie = (text) => {
    const cookie = {};
    text.split(';').forEach(item => {
        const parts = item.trim().split('=');
        if (parts.length === 2) {
            cookie[parts[0].trim()] = parts[1].trim();
        }
    });
    return cookie;
};

export const readCookie = () => {
    const cookiePath = path.join(os.homedir(), 'NeteaseCookie.txt');
    return fs.readFileSync(cookiePath, 'utf-8');
};

export const formatSize = (value) => {
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

export const sanitizeFilename = (filename) => {
    return filename
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};