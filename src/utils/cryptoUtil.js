import crypto from 'crypto';

export class CryptoUtil {
    static hexDigest(data) {
        return Buffer.from(data).toString('hex');
    }

    static hashDigest(text) {
        return crypto.createHash('md5').update(text).digest();
    }

    static hashHexDigest(text) {
        return this.hexDigest(this.hashDigest(text));
    }
}

export default CryptoUtil;