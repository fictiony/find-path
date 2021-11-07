import {
  app,
  BrowserWindow,
  nativeTheme,
  protocol,
  dialog,
  ipcMain
} from 'electron'
import util from './util'

try {
  if (
    process.platform === 'win32' &&
    nativeTheme.shouldUseDarkColors === true
  ) {
    require('fs').unlinkSync(
      require('path').join(app.getPath('userData'), 'DevTools Extensions')
    )
  }
} catch (_) {}

/**
 * Set `__statics` path to static files in production;
 * The reason we are setting it here is that the path needs to be evaluated at runtime
 */
if (process.env.PROD) {
  global.__statics = __dirname
}

let mainWindow

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    frame: false,
    useContentSize: true,
    webPreferences: {
      webSecurity: false,
      allowRunningInsecureContent: false,

      // Change from /quasar.conf.js > electron > nodeIntegration;
      // More info: https://quasar.dev/quasar-cli/developing-electron-apps/node-integration
      nodeIntegration: process.env.QUASAR_NODE_INTEGRATION,
      nodeIntegrationInWorker: process.env.QUASAR_NODE_INTEGRATION

      // More info: /quasar-cli/developing-electron-apps/electron-preload-script
      // preload: path.resolve(__dirname, 'electron-preload.js')
    }
  })

  mainWindow.loadURL(process.env.APP_URL)

  // 解决本地文件无法访问的问题
  app.whenReady().then(() => {
    protocol.interceptFileProtocol('file', (request, callback) => {
      const path = decodeURIComponent(request.url.substr(8))
      callback(path)
    })
  })

  // ----------------------------------------------------------------------------
  // 主窗口事件处理

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  const winEvents = ['maximize', 'unmaximize']
  winEvents.forEach(item => {
    mainWindow.on(item, () => {
      mainWindow.webContents.postMessage('win-event', item)
    })
  })
}

// ----------------------------------------------------------------------------
// 应用程序事件处理

app.on('ready', createWindow)

app.on('before-quit', e => {
  e.preventDefault()
  mainWindow.webContents.postMessage('win-event', 'before-quit')
})

// ----------------------------------------------------------------------------
// IPC消息处理

// 方法调用
function call (target, method, ...args) {
  switch (target) {
    case 'app':
      return app[method](...args)
    case 'win':
      return mainWindow[method](...args)
    case 'dlg':
      return dialog[method](mainWindow, ...args)
    case 'util':
      return util[method](...args)
  }
}
ipcMain.on('call', (e, ...args) => {
  e.returnValue = call(...args)
})
ipcMain.handle('call', (e, ...args) => {
  return call(...args)
})
