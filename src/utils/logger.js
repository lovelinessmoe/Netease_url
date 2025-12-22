import log from 'electron-log';
import path from 'path';
import fs from 'fs';

// 配置日志
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

// 日志文件格式
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';

// 设置日志文件名
const date = new Date().toISOString().split('T')[0];
log.transports.file.fileName = `app-${date}.log`;

// 日志文件保留最近7天
log.transports.file.maxSize = 10 * 1024 * 1024; // 10MB

/**
 * 日志工具类
 */
export class Logger {
    /**
     * 记录信息日志
     * @param {...any} args - 日志内容
     */
    static info(...args) {
        log.info(...args);
    }

    /**
     * 记录警告日志
     * @param {...any} args - 日志内容
     */
    static warn(...args) {
        log.warn(...args);
    }

    /**
     * 记录错误日志
     * @param {...any} args - 日志内容
     */
    static error(...args) {
        log.error(...args);
    }

    /**
     * 记录调试日志
     * @param {...any} args - 日志内容
     */
    static debug(...args) {
        log.debug(...args);
    }

    /**
     * 获取日志文件路径
     * @returns {string} 日志文件路径
     */
    static getLogPath() {
        return log.transports.file.getFile().path;
    }

    /**
     * 清理旧日志文件（保留最近7天）
     */
    static cleanOldLogs() {
        const logDir = path.dirname(log.transports.file.getFile().path);

        try {
            const files = fs.readdirSync(logDir);
            const now = Date.now();
            const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

            files.forEach(file => {
                if (file.startsWith('app-') && file.endsWith('.log')) {
                    const filePath = path.join(logDir, file);
                    const stats = fs.statSync(filePath);

                    if (stats.mtime.getTime() < sevenDaysAgo) {
                        fs.unlinkSync(filePath);
                        log.info(`已删除旧日志文件: ${file}`);
                    }
                }
            });
        } catch (error) {
            log.error('清理旧日志文件失败:', error);
        }
    }
}

// 应用启动时清理旧日志
Logger.info('='.repeat(50));
Logger.info('应用启动');
Logger.info(`日志文件位置: ${Logger.getLogPath()}`);
Logger.info('='.repeat(50));

// 启动时清理旧日志
Logger.cleanOldLogs();

export default Logger;
