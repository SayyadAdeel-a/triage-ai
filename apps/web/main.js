const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

const isDev = process.env.NODE_ENV === 'development';
let nextServer;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  if (isDev) {
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    // In production, Next.js standalone server runs on localhost:3000 by default
    win.loadURL('http://localhost:3000');
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
  if (!isDev) {
    // Start the Next.js standalone server
    const serverPath = path.join(__dirname, '.next', 'standalone', 'server.js');
    nextServer = spawn('node', [serverPath], {
      env: { ...process.env, PORT: '3000', HOSTNAME: 'localhost' }
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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (nextServer) nextServer.kill();
    app.quit();
  }
});
