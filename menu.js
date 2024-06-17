'use strict';
const {app, BrowserWindow, Menu, shell} = require('electron');
const os = require('os');
const configStore = require('./config');

const appName = app.getName();
const files = require('./files');

function restoreWindow() {
  const win = BrowserWindow.getAllWindows()[0];
  win.show();
  return win;
}

function sendAction(action) {
  const win = BrowserWindow.getAllWindows()[0];
  win.webContents.send(action);
}

const trayTpl = [
  {
    label: 'Show',
    click() {
        restoreWindow();
    }
  },
  {
    label: 'Enable dark mode',
    type: 'checkbox',
    checked: configStore.get('darkMode'),
    click(item) {
      configStore.set('darkMode', item.checked);
      sendAction('toggleDarkMode');
    }
  },
  {
    type: 'separator'
  },
  {
    label: `Quit`,
    click() {
      app.exit(0);
    }
  }
];

const viewTpl = {
  label: 'View',
  submenu: [
    {
      label: 'Reset Text Size',
      accelerator: 'CmdOrCtrl+0',
      click() {
        configStore.set('zoomLevel', 0);
        sendAction('updateZoomLevel');
      }
    },
    {
      label: 'Increase Text Size',
      accelerator: 'CmdOrCtrl+Plus',
      click() {
        configStore.set('zoomLevel', configStore.get('zoomLevel') + 1);
        sendAction('updateZoomLevel');
      }
    },
    {
      label: 'Decrease Text Size',
      accelerator: 'CmdOrCtrl+-',
      click() {
        configStore.set('zoomLevel', configStore.get('zoomLevel') - 1);
        sendAction('updateZoomLevel');
      }
    },
    {
      label: 'Debug mode',
      click() { const win = BrowserWindow.getAllWindows()[0];  win.openDevTools();
      }
    }
  ]
};

const winTpl = [
  {
    label: appName,
    submenu: [
      {
        label: `About ${appName}`,
        role: 'about'
      },
      {
        type: 'separator'
      },
      {
        label: 'Services',
        role: 'services',
        submenu: []
      },
      {
        type: 'separator'
      },
      {
        label: `Hide ${appName}`,
        accelerator: 'Cmd+H',
        role: 'hide'
      },
      {
        label: 'Hide Others',
        accelerator: 'Cmd+Shift+H',
        role: 'hideothers'
      },
      {
        label: 'Show All',
        role: 'unhide'
      },
      {
        type: 'separator'
      },
      {
        label: `Quit ${appName}`,
        accelerator: 'Cmd+Q',
        click() {
          app.quit();
        }
      }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      {
        label: 'Undo',
        accelerator: 'CmdOrCtrl+Z',
        role: 'undo'
      },
      {
        label: 'Redo',
        accelerator: 'Shift+CmdOrCtrl+Z',
        role: 'redo'
      },
      {
        type: 'separator'
      },
      {
        label: 'Cut',
        accelerator: 'CmdOrCtrl+X',
        role: 'cut'
      },
      {
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        role: 'copy'
      },
      {
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        role: 'paste'
      },
      {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        role: 'selectall'
      }
    ]
  },
  {
    label: 'Theme',
    submenu: [
      {
        label: 'Default',
        type: 'radio',
        checked: configStore.get('theme', '') == 'default',
        click(item)
        {
          configStore.set('theme', 'default');
          sendAction('toggleDarkMode');
          module.exports.webContents.send('set-default-theme', 'ping');
          module.exports.webContents.send('reload');
        }
      },
      {
        label: 'Clean',
        type: 'radio',
        checked: configStore.get('theme', '') == 'clean',
        click(item) {
          configStore.set('theme', 'clean');
          module.exports.webContents.send('reload');
          files.getThemeCss('clean', css => {
            module.exports.webContents.send('set-theme', css);
          });
        }
      },
    ]
  },
  {
    label: 'Settings',
    submenu: [
      {
        label: 'Minimize to tray',
        type: 'checkbox',
        checked: configStore.get('minimizeToTray', true),
        click(item) {
          configStore.set('minimizeToTray', item.checked);
        }
      },
      {
        label: 'Close to tray',
        type: 'checkbox',
        checked: configStore.get('closeToTray', true),
        click(item) {
          configStore.set('closeToTray', item.checked);
        }
      },
      {
        label: 'Ballon Notifications',
        type: 'checkbox',
        checked: configStore.get('ballonNotifications', true),
        click(item) {
          configStore.set('ballonNotifications', item.checked);
          module.exports.webContents.send('reload');
        }
      },
      {
        label: 'Enable dark mode',
        type: 'checkbox',
        checked: configStore.get('darkMode'),
        click(item) {
          configStore.set('darkMode', item.checked);
          sendAction('toggleDarkMode');
        }
      }
    ]
  },
  viewTpl,
  {
    label: 'Window',
    role: 'window',
    submenu: [
      {
        label: 'Minimize',
        accelerator: 'CmdOrCtrl+M',
        role: 'minimize'
      },
      {
        label: 'Close',
        accelerator: 'CmdOrCtrl+W',
        role: 'close'
      },
      {
        type: 'separator'
      },
      {
        label: 'Bring All to Front',
        role: 'front'
      },
      {
        label: 'Toggle Full Screen',
        accelerator: 'CmdOrCtrl+F',
        click() {
          const win = BrowserWindow.getAllWindows()[0];
          win.setFullScreen(!win.isFullScreen());
        }
      }
    ]
  },
  {
    label: 'Help',
    role: 'help',
    submenu: [
      {
        label: `${appName} Website...`,
        click() {
          shell.openExternal('https://github.com/sergiomb2/whatsdesktop');
        }
      },
      {
        label: 'Report an Issue...',
        click() {
          const body = `
    **Please succinctly describe your issue and steps to reproduce it.**

    -

    ${app.getName()} ${app.getVersion()}
    ${process.platform} ${process.arch} ${os.release()}`;

          shell.openExternal(`https://github.com/sergiomb2/whatsdesktop/issues/new?body=${encodeURIComponent(body)}`);
        }
      }
    ]
  }
];


module.exports = {
  mainMenu: Menu.buildFromTemplate(winTpl),
  trayMenu: Menu.buildFromTemplate(trayTpl)
//  webContents: webContents
};
