import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const isDev = process.env.NODE_ENV === 'development'

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 720,
    minHeight: 520,
    frame: false,
    transparent: false,
    backgroundColor: '#0f1115',
    show: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(join(__dirname, '..', 'dist', 'index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

ipcMain.handle('window:minimize', () => {
  if (mainWindow) mainWindow.minimize()
})

ipcMain.handle('window:toggleMaximize', () => {
  if (!mainWindow) return false
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize()
    return false
  }
  mainWindow.maximize()
  return true
})

ipcMain.handle('window:isMaximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false
})

ipcMain.handle('window:close', () => {
  if (mainWindow) mainWindow.close()
})

ipcMain.handle('file:save', async (_event, { content, currentPath }) => {
  let targetPath = currentPath
  if (!targetPath) {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: '글 저장하기',
      defaultPath: '무제.txt',
      filters: [{ name: 'Text', extensions: ['txt'] }]
    })
    if (result.canceled || !result.filePath) {
      return { canceled: true }
    }
    targetPath = result.filePath
  }
  await writeFile(targetPath, content, 'utf-8')
  return { canceled: false, path: targetPath }
})

ipcMain.handle('file:saveAs', async (_event, { content }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: '다른 이름으로 저장',
    defaultPath: '무제.txt',
    filters: [{ name: 'Text', extensions: ['txt'] }]
  })
  if (result.canceled || !result.filePath) {
    return { canceled: true }
  }
  await writeFile(result.filePath, content, 'utf-8')
  return { canceled: false, path: result.filePath }
})

ipcMain.handle('file:open', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '글 불러오기',
    properties: ['openFile'],
    filters: [{ name: 'Text', extensions: ['txt', 'md'] }]
  })
  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true }
  }
  const path = result.filePaths[0]
  const content = await readFile(path, 'utf-8')
  return { canceled: false, path, content }
})

ipcMain.handle('image:pick', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '배경 이미지 선택',
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'] }]
  })
  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true }
  }
  const path = result.filePaths[0]
  const data = await readFile(path)
  const ext = path.split('.').pop().toLowerCase()
  const mime = ext === 'jpg' ? 'jpeg' : ext
  const dataUrl = `data:image/${mime};base64,${data.toString('base64')}`
  return { canceled: false, dataUrl }
})

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
