'use strict';
const path = require('path');
const fs = require('fs');
const {app, BrowserWindow, shell, Tray, Menu, MenuItem, ipcMain} = require('electron');
const appMenu = require('./menu');
const configStore = require('./config');
const files = require('./files');

let mainWindow;
let appIcon;

//app.commandLine.appendSwitch('lang', 'pt-PT');
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
    appIcon.setImage(path.join(__dirname, 'media', 'logo-tray-blue.png'));
  } else {
    appIcon.setImage(path.join(__dirname, 'media', 'logo-tray.png'));
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
    // autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'browser.js'),
      nodeIntegration: true,
      webSecurity: true,
      contextIsolation: true,
      enableRemoteModule: true,
      plugins: true
    }
  });

  mainWindowState.manage(win);

  win.loadURL('https://web.whatsapp.com', {
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36'
  });

  win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    // if (webContents.getURL() === host) {
      if (permission === 'notifications' && !configStore.get('ballonNotifications', true) ) {
        callback(false); // denied.
        return;
      // }
    }
    callback(true);
  });

  // console.log(win.webContents.session.setPermissionRequestHandler);
  // session.fromPartition(webview.partition).setPermissionRequestHandler()

  // win.webContents.session.setPermissionRequestHandler(
  //   function permissionRequestHandler(webContents, permission, callback) {

  //     console.log('a4');
  //    // Place a breakpoint here while debugging with the --inspect-brk command line switch
  //    return callback(false);
  //   }
  // );  

  // console.log('a2');

//    win.loadURL('file://' + __dirname + '/index.html');

//  const ses = win.webContents.session
//  console.log(ses.getUserAgent())

  win.on('closed', () => app.quit);
  win.on('page-title-updated', (error, title) => updateBadge(title));
  win.on('close', error => {
    if (process.platform === 'darwin' && !win.forceClose) {
      error.preventDefault();
      win.hide();
    } else if (process.platform === 'win32' && configStore.get('closeToTray', true) ) {
      win.hide();
      error.preventDefault();
    } else if (configStore.get('closeToTray')) {
      win.hide();
    }
  });
  win.on('minimize', () => {
    if (configStore.get('minimizeToTray', true)) {
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

    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });

  appIcon.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
}


// 请求获取实例锁，若成功则返回 true，否则表示已存在打开的应用实例
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // 当运行第二个实例时退出它，并聚焦到 mainWindow 窗口
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  })

app.on('ready', () => {
  Menu.setApplicationMenu(appMenu.mainMenu);

  mainWindow = createMainWindow();
  createTray();

  console.log("locale=" + app.getLocale());
  console.log("plataform=" + process.platform);

  const ses = mainWindow.webContents.session
  console.log(ses.getUserAgent());
  const possibleLanguages = ses.availableSpellCheckerLanguages
  console.log("possibleLanguages=" + possibleLanguages);

  mainWindow.webContents.session.setSpellCheckerLanguages(['pt-PT']);
  const page = mainWindow.webContents;

  // appMenu.webContents = page;

  page.on('dom-ready', () => {
    page.insertCSS(fs.readFileSync(path.join(__dirname, 'theme.css'), 'utf8'));
    mainWindow.show();
  });

  page.on('new-window', (error, url) => {
    //error.preventDefault();
    shell.openExternal(url);
  });

  page.on('did-finish-load', () => {
    mainWindow.setTitle(app.getName());
  });

  ipcMain.on('did-finish-load-from-renderer', function(event, arg)
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

  ipcMain.on('ctrl+w__pressed', function(event, arg)
  {
    mainWindow.hide();
  });

mainWindow.webContents.on('context-menu', (event, params) => {
  const menu = new Menu()

    menu.append(new MenuItem({
      label: "set PT",
      click: () => mainWindow.webContents.session.setSpellCheckerLanguages(['pt-PT'])
    }));
    menu.append(new MenuItem({
      label: "set En",
      click: () => mainWindow.webContents.session.setSpellCheckerLanguages(['en-US'])
    }))
  // Add each spelling suggestion
  for (const suggestion of params.dictionarySuggestions) {
    menu.append(new MenuItem({
      label: suggestion,
      click: () => mainWindow.webContents.replaceMisspelling(suggestion)
    }))
  }

  // Allow users to add the misspelled word to the dictionary
  if (params.misspelledWord) {
    menu.append(
      new MenuItem({
        label: 'Add to dictionary',
        click: () => mainWindow.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord)
      })
    )
  }
  menu.popup()
});
});
}

app.on('window-all-closed', () => {
  console.log("process.platform" + process.platform);
  if (process.platform !== 'darwin') {
  console.log("process.platform in and quit");
    app.quit();
  } else {
  console.log("process.platform out and not quit");
  } 

});

app.on('before-quit', () => {
  mainWindow.forceClose = true;
});

app.on('activate', () => {
  mainWindow.show();
});
