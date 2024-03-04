'use strict';
const electron = require('electron');

const ipc = electron.ipcRenderer;
const configStore = require('./config');

function toggleDarkMode() {
  document.documentElement.classList.toggle('dark-mode', configStore.get('darkMode'));
}

function updateZoomLevel() {
  electron.webFrame.setZoomLevel(configStore.get('zoomLevel'));
}

function nukeWorkers() {
  if ('serviceWorker' in navigator) {
    caches.keys().then(function (cacheNames) {
      cacheNames.forEach(function (cacheName) {
        caches.delete(cacheName);
      });
    });
  }
}

ipc.on('toggleDarkMode', toggleDarkMode);

ipc.on('updateZoomLevel', updateZoomLevel);

document.addEventListener('DOMContentLoaded', () => {
  toggleDarkMode();
  updateZoomLevel();
  nukeWorkers();
});
