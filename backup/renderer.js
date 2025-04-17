var ipc = require('electron').ipcRenderer;
var session = require('electron').session;

onload = function () {
  var webview = document.getElementById("wv");

  
  // session.fromPartition(webview.partition).setPermissionRequestHandler(
  //   function permissionRequestHandler(webContents, permission, callback) {
  //     console.log(permission);
  //     console.log('a4');
  //     // Place a breakpoint here while debugging with the --inspect-brk command line switch
  //     return callback(false);
  //   }
  // );

  webview.setAttribute('src', 'https://web.whatsapp.com');

  webview.addEventListener('page-title-set', function (title, explicitSet) {
    document.title = title.title;
  });

  webview.addEventListener('did-finish-load', function () {
    ipc.send('did-finish-load-from-renderer', '');
  });

  webview.addEventListener('dom-ready', function () {
  });

  webview.addEventListener('did-get-response-details', function () {
  });


  window.onkeypress = function (e) {
    if (e.keyCode == 23 && e.ctrlKey) // ctrl + w
    {
      ipc.send('ctrl+w__pressed', '');
      // alert("ctrl + w");
    }
    // console.log(e);

  }
}

ipc.on('set-theme', function (event, css) {
  var webview = document.getElementById("wv");
  // webview.executeJavaScript("document.body.style.backgroundColor = 'red'" );
  webview.executeJavaScript("document.getElementById('style').href ='';");
  webview.insertCSS(css);
});

ipc.on('reload', function () {
  var webview = document.getElementById("wv");
  webview.reload();
});

