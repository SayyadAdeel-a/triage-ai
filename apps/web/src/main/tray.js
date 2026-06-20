const { Tray, Menu, nativeImage, app, BrowserWindow } = require('electron');
const path = require('path');

let tray = null;

function setupTray(getWindow) {
  // Use a simple built-in icon or create an empty image if icon is missing
  // Ideally, replace this with a real icon path
  const iconPath = path.join(__dirname, '../../public/icon.png');
  let icon;
  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      // Fallback if public/icon.png doesn't exist
      icon = nativeImage.createEmpty();
      icon.resize({ width: 16, height: 16 });
    }
  } catch (e) {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open TriageAI',
      click: () => {
        const win = getWindow();
        if (win) {
          if (win.isMinimized()) win.restore();
          win.show();
          win.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('TriageAI');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    const win = getWindow();
    if (win) {
      if (win.isVisible()) {
        win.hide();
      } else {
        win.show();
        win.focus();
      }
    }
  });

  return tray;
}

module.exports = { setupTray };
