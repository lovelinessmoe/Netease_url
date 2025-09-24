import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { configureApp } from './src/app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let server;

// 检查单实例锁
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        // 当运行第二个实例时，聚焦到主窗口
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}

// 针对 macOS 的优化
if (process.platform === 'darwin') {
    // 启用深色模式支持
    app.commandLine.appendSwitch('force-dark-mode');
    // 设置首选配色方案
    app.commandLine.appendSwitch('force-color-profile', 'srgb');
}

async function startExpressServer() {
    const expressApp = express();
    configureApp(expressApp);
    return new Promise((resolve) => {
        server = expressApp.listen(15001, '127.0.0.1', () => resolve());
    });
}

async function createWindow() {
    // Start Express server first
    await startExpressServer();

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        backgroundColor: '#fff',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: true,
            spellcheck: false,
            enableWebSQL: false,
            backgroundThrottling: false
        },
        // 平台自适应图标
        icon: path.join(
            __dirname,
            'assets',
            process.platform === 'darwin'
                ? 'icon.icns'
                : (process.platform === 'win32' ? 'icon.ico' : 'icon.png')
        ),
        // titleBarStyle: 'hidden',
        trafficLightPosition: { x: 10, y: 10 }
    });

    // Load application
    await mainWindow.loadURL('http://127.0.0.1:15001');
    
    // 打开开发者工具
    // mainWindow.webContents.openDevTools();
    // 注册开发者工具快捷键
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key.toLowerCase() === 'f12') {
            mainWindow.webContents.toggleDevTools();
            event.preventDefault();
        }
    });
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
    // Close Express server
    if (server) {
        server.close();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});

// Cleanup on quit
app.on('before-quit', () => {
    if (server) {
        server.close();
    }
});