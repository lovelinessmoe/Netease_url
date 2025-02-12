import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { configureApp } from './main.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let server;

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
  // mainWindow.webContents.openDevTools();

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