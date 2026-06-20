const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const { setupMenu } = require('./menu');
const { setupTray } = require('./tray');

const isDev = process.env.NODE_ENV === 'development';
let nextServer;
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js')
    }
  });

  // Handle prevent window close for tray
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  ipcMain.on('open-external', (event, url) => {
    shell.openExternal(url);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('mailto:') || url.startsWith('http')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('mailto:')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, Next.js standalone server runs on localhost:3000 by default
    mainWindow.loadURL('http://localhost:3000');
  }
}

function waitForServer(url, cb) {
  const req = http.get(url, (res) => {
    if (res.statusCode === 200) {
      cb();
    } else {
      setTimeout(() => waitForServer(url, cb), 500);
    }
  });
  req.on('error', () => {
    setTimeout(() => waitForServer(url, cb), 500);
  });
}

app.whenReady().then(() => {
  setupMenu();
  setupTray(() => mainWindow);

  // Check for updates
  if (!isDev) {
    try {
      const { autoUpdater } = require('electron-updater');
      autoUpdater.checkForUpdatesAndNotify();
    } catch (e) {
      console.error('Failed to load electron-updater:', e);
    }
  }

  if (!isDev) {
    const fs = require('fs');
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'dev.db');

    // Ensure database file exists in user data folder
    if (!fs.existsSync(dbPath)) {
      const templatePath = path.join(app.getAppPath(), 'prisma', 'dev.db');
      if (fs.existsSync(templatePath)) {
        try {
          fs.mkdirSync(userDataPath, { recursive: true });
          fs.copyFileSync(templatePath, dbPath);
          console.log('Database template copied successfully to:', dbPath);
        } catch (copyErr) {
          console.error('Failed to copy database template:', copyErr);
        }
      } else {
        console.error('Database template not found at:', templatePath);
      }
    }

    // Start the Next.js standalone server
    const serverPath = path.join(__dirname, '../../.next', 'standalone', 'server.js');
    nextServer = spawn('node', [serverPath], {
      env: { 
        ...process.env, 
        PORT: '3000', 
        HOSTNAME: 'localhost',
        DATABASE_URL: `file:${dbPath}`
      }
    });

    nextServer.stdout.on('data', (data) => console.log(`[Next.js] ${data}`));
    nextServer.stderr.on('data', (data) => console.error(`[Next.js Error] ${data}`));

    waitForServer('http://localhost:3000', () => {
      createWindow();
    });
  } else {
    createWindow();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  app.isQuiting = true;
  if (nextServer) nextServer.kill();
});

app.on('window-all-closed', () => {
  // We handle minimizing to tray so this shouldn't fire if tray is active,
  // but if the app actually closes on Windows/Linux, we might want to keep the tray alive
  // For now, let's keep it running.
});
