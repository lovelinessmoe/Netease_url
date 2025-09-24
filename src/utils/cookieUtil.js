import fs from 'fs';
import path from 'path';
import os from 'os';

export class CookieUtil {
    static parseCookie(text) {
        const cookie = {};
        text.split(';').forEach(item => {
            const parts = item.trim().split('=');
            if (parts.length === 2) {
                cookie[parts[0].trim()] = parts[1].trim();
            }
        });
        return cookie;
    }

    static readCookie() {
        const cookiePath = path.join(os.homedir(), 'NeteaseCookie.txt');
        return fs.readFileSync(cookiePath, 'utf-8');
    }
}

export default CookieUtil;