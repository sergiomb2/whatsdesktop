'use strict';

const Store = require('electron-store').default;

module.exports = new Store({
  defaults: {
    darkMode: false,
    closeToTray: false,
    minimizeToTray: false,
    zoomLevel: 0
  }
});
