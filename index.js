'use strict';
const path = require('path');
const fs = require('fs');
const {app, BrowserWindow, shell, Tray, Menu} = require('electron');
const appMenu = require('./menu');
const configStore = require('./config');
const files = require('./files');
const ipc =  require('electron').ipcMain;

let mainWindow;
let appIcon;

function updateBadge(title) {
  const isOSX = Boolean(app.dock);

  const messageCount = (/\((\d+)\)/).exec(title);

  if (isOSX) {
    app.dock.setBadge(messageCount ? messageCount[1] : '');
    if (messageCount) {
      app.dock.bounce('informational');
    }
  }

  if (messageCount) {
    appIcon.setImage(path.join(__dirname, 'media', 'tray-notification.png'));
  } else {
    appIcon.setImage(path.join(__dirname, 'media', 'tray.png'));
  }
}

function createMainWindow() {
  const windowStateKeeper = require('electron-window-state');

  const mainWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 800
  });

  const win = new BrowserWindow({
    title: app.getName(),
    show: false,
    icon: process.platform === 'linux' && path.join(__dirname, 'media', 'logo.png'),
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 400,
    minHeight: 200,
    webPreferences: {
      preload: path.join(__dirname, 'browser.js'),
      nodeIntegration: false,
      webSecurity: false,
      plugins: true
    }
  });

  win.openDevTools();;

  mainWindowState.manage(win);

  win.loadURL('https://web.whatsapp.com', {
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.85 Safari/537.36'
  });
  win.on('closed', () => app.quit);
  win.on('page-title-updated', (error, title) => updateBadge(title));
  win.on('close', error => {
    if (process.platform === 'darwin' && !win.forceClose) {
      error.preventDefault();
      win.hide();
    } else if (process.platform === 'win32' && configStore.get('closeToTray')) {
      win.hide();
      error.preventDefault();
    }
  });
  win.on('minimize', () => {
    if (process.platform === 'win32' && configStore.get('minimizeToTray')) {
      win.hide();
    }
  });
  return win;
}

function createTray() {
  appIcon = new Tray(path.join(__dirname, 'media', 'logo-tray.png'));
  appIcon.setPressedImage(path.join(__dirname, 'media', 'logo-tray-white.png'));
  appIcon.setContextMenu(appMenu.trayMenu);
   // appIcon.setToolTip('This is my application.');

  appIcon.on('double-click', () => {

    if (mainWindow.isVisible())
    {
      mainWindow.hide();
    }
    else
    {
      mainWindow.show();
    }
  });

  appIcon.on('click', () => {
    if (mainWindow.isVisible())
    {
      mainWindow.hide();
    }
    else
    {
      mainWindow.show();
    }
  });
}

app.on('ready', () => {
  Menu.setApplicationMenu(appMenu.mainMenu);

  mainWindow = createMainWindow();
  createTray();

  const page = mainWindow.webContents;

  appMenu.webContents = page;

  page.on('dom-ready', () => {
    page.insertCSS(fs.readFileSync(path.join(__dirname, 'theme.css'), 'utf8'));
    mainWindow.show();
  });

  page.on('new-window', (e, url) => {
    e.preventDefault();
    shell.openExternal(url);
  });

  page.on('did-finish-load', () => {
    mainWindow.setTitle(app.getName());
  });

  ipc.on('did-finish-load-from-renderer', function(event, arg)
  {
    if (configStore.get('theme') == 'clean')
    {
       files.getThemeCss('clean', css =>
       {
          mainWindow.webContents.send('set-theme', css);
      });
    }
    else
    {
    }
  });

  ipc.on('ctrl+w__pressed', function(event, arg)
  {
    mainWindow.hide();
  });
  
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  mainWindow.forceClose = true;
});

app.on('activate', () => {
  mainWindow.show();
});
