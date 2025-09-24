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

    // Create browser window
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // Load application
    await mainWindow.loadURL('http://127.0.0.1:15001');
    
    // 打开开发者工具
    mainWindow.webContents.openDevTools();
    // 注册开发者工具快捷键
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.control && input.shift && input.key.toLowerCase() === 'i') {
            mainWindow.webContents.toggleDevTools();
            event.preventDefault();
        }
    });
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

// async function createWindow() {
//     try {
//         // 确保 cookie 文件存在
//         const cookiePath = path.join(os.homedir(), 'NeteaseCookie.txt');
//         if (!fs.existsSync(cookiePath)) {
//             fs.writeFileSync(cookiePath, '', 'utf-8');
//         }

//         // 先启动 Express 服务器
//         await startExpressServer();

//         console.log('Creating window...');
        
//         // 创建浏览器窗口
//         mainWindow = new BrowserWindow({
//             width: 1200,
//             height: 800,
//             minWidth: 800,
//             minHeight: 600,
//             width: 1200,
//             height: 800,
//             minWidth: 800,
//             minHeight: 600,
//             backgroundColor: '#fff',
//             show: false,
//             webPreferences: {
//                 nodeIntegration: true,
//                 contextIsolation: false,
//                 webSecurity: true,
//                 spellcheck: false,
//                 enableWebSQL: false,
//                 backgroundThrottling: false
//             },
//             icon: path.join(__dirname, 'assets', process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
//             titleBarStyle: 'hiddenInset',
//             trafficLightPosition: { x: 10, y: 10 }
//         });

//         console.log('Loading application URL...');
        
//         // 等待服务器启动
//         await new Promise(resolve => setTimeout(resolve, 1000));
        
//         // 加载应用
//         try {
//             // 使用 http 协议加载页面
//             await mainWindow.loadURL('http://localhost:15001');
//             console.log('Page loaded successfully');
            
//             // 设置 CSP
//             mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
//                 callback({
//                     responseHeaders: {
//                         ...details.responseHeaders,
//                         'Content-Security-Policy': ["default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* https://fonts.loli.net"]
//                     }
//                 });
//             });
//         } catch (error) {
//             console.error('Failed to load URL:', error);
//             throw error;
//         }
        
//         // 默认打开开发者工具
//         mainWindow.webContents.openDevTools();

//         // 注册开发者工具快捷键
//         mainWindow.webContents.on('before-input-event', (event, input) => {
//             if (input.control && input.shift && input.key.toLowerCase() === 'i') {
//                 mainWindow.webContents.toggleDevTools();
//                 event.preventDefault();
//             }
//         });

//         console.log('Window ready to show');
        
//         // 优化显示
//         mainWindow.once('ready-to-show', () => {
//             console.log('Showing window');
//             mainWindow.show();
//             mainWindow.focus();
//         });

//         // 处理窗口关闭
//         mainWindow.on('closed', () => {
//             mainWindow = null;
//         });

//     } catch (error) {
//         console.error('创建窗口失败:', error);
//         dialog.showErrorBox('启动错误', `应用启动失败: ${error.message}`);
//         app.quit();
//     }
// }

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