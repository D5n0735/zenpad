import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { fileURLToPath } from 'node:url'
import { dirname, extname, join, basename } from 'node:path'
import { pathToFileURL } from 'node:url'
import { copyFile, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const isDev = process.env.NODE_ENV === 'development'

let mainWindow = null
let allowClose = false
const UTF8_BOM = '\ufeff'

function dataPath(...parts) {
  return join(app.getPath('userData'), 'zenpad-data', ...parts)
}

async function ensureDataDir(...parts) {
  const dir = dataPath(...parts)
  await mkdir(dir, { recursive: true })
  return dir
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(stripUtf8Bom(await readFile(path, 'utf-8')))
  } catch {
    return fallback
  }
}

function stripUtf8Bom(value) {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value
}

async function atomicWriteText(path, value, { bom = false } = {}) {
  await mkdir(dirname(path), { recursive: true })
  const tempPath = join(dirname(path), `.${basename(path)}.${process.pid}.${Date.now()}.tmp`)
  const text = `${bom ? UTF8_BOM : ''}${String(value ?? '')}`

  try {
    await writeFile(tempPath, text, 'utf-8')
    await rename(tempPath, path)
  } catch (error) {
    try {
      await unlink(tempPath)
    } catch {
      // Ignore cleanup failures so the real save error is returned to the UI.
    }
    throw error
  }
}

async function writeJson(path, value) {
  await atomicWriteText(path, JSON.stringify(value, null, 2))
}

function ok(value = {}) {
  return { ok: true, ...value }
}

function fail(error) {
  return { ok: false, error: error instanceof Error ? error.message : String(error) }
}

function safeName(name, fallback = '무제') {
  const cleaned = String(name || fallback).replace(/[<>:"/\\|?*\u0000-\u001F]/g, '').trim()
  return cleaned || fallback
}

function defaultLibrary() {
  const now = new Date().toISOString()
  return {
    projects: [
      {
        id: `project-${Date.now()}`,
        title: '나의 첫 작품',
        notes: '캐릭터, 세계관, 장면 아이디어를 여기에 적어두세요.',
        createdAt: now,
        updatedAt: now,
        chapters: [
          {
            id: `chapter-${Date.now()}`,
            title: '1화',
            content: '',
            createdAt: now,
            updatedAt: now
          }
        ]
      }
    ]
  }
}

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

  mainWindow.on('close', (event) => {
    if (allowClose) return
    event.preventDefault()
    mainWindow.webContents.send('window:close-requested')
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
  if (mainWindow) mainWindow.webContents.send('window:close-requested')
})

ipcMain.handle('window:forceClose', () => {
  allowClose = true
  if (mainWindow) mainWindow.close()
})

ipcMain.handle('file:save', async (_event, { content, currentPath }) => {
  try {
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
    await atomicWriteText(targetPath, content, { bom: true })
    return ok({ canceled: false, path: targetPath })
  } catch (error) {
    return fail(error)
  }
})

ipcMain.handle('file:saveAs', async (_event, { content }) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: '다른 이름으로 저장',
      defaultPath: '무제.txt',
      filters: [{ name: 'Text', extensions: ['txt'] }]
    })
    if (result.canceled || !result.filePath) {
      return { canceled: true }
    }
    await atomicWriteText(result.filePath, content, { bom: true })
    return ok({ canceled: false, path: result.filePath })
  } catch (error) {
    return fail(error)
  }
})

ipcMain.handle('file:open', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '글 불러오기',
      properties: ['openFile'],
      filters: [{ name: 'Text', extensions: ['txt', 'md'] }]
    })
    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true }
    }
    const path = result.filePaths[0]
    const content = stripUtf8Bom(await readFile(path, 'utf-8'))
    return ok({ canceled: false, path, content })
  } catch (error) {
    return fail(error)
  }
})

ipcMain.handle('image:pick', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '배경 이미지 선택',
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'] }]
    })
    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true }
    }
    const source = result.filePaths[0]
    const ext = extname(source).toLowerCase()
    const allowed = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'])
    if (!allowed.has(ext)) return fail('지원하지 않는 이미지 형식입니다.')

    const dir = await ensureDataDir('backgrounds')
    const target = join(dir, `${Date.now()}-${safeName(basename(source), 'background')}`)
    await copyFile(source, target)
    return ok({ canceled: false, path: target, url: pathToFileURL(target).toString() })
  } catch (error) {
    return fail(error)
  }
})

ipcMain.handle('file:rename', async (_event, { currentPath, nextName }) => {
  try {
    if (!currentPath) return ok({ path: null, name: safeName(nextName) })
    const oldExt = extname(currentPath)
    const clean = safeName(nextName)
    const hasExt = extname(clean)
    const finalName = hasExt ? clean : `${clean}${oldExt || '.txt'}`
    const target = join(dirname(currentPath), finalName)
    if (target !== currentPath) await rename(currentPath, target)
    return ok({ path: target, name: finalName })
  } catch (error) {
    return fail(error)
  }
})

ipcMain.handle('file:exportMarkdown', async (_event, { content, docName }) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Markdown으로 내보내기',
      defaultPath: `${safeName(docName)}.md`,
      filters: [{ name: 'Markdown', extensions: ['md'] }]
    })
    if (result.canceled || !result.filePath) return { canceled: true }
    await atomicWriteText(result.filePath, content, { bom: true })
    return ok({ canceled: false, path: result.filePath })
  } catch (error) {
    return fail(error)
  }
})

ipcMain.handle('file:exportHtml', async (_event, { html, docName }) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'HTML로 내보내기',
      defaultPath: `${safeName(docName)}.html`,
      filters: [{ name: 'HTML', extensions: ['html'] }]
    })
    if (result.canceled || !result.filePath) return { canceled: true }
    await atomicWriteText(result.filePath, html, { bom: true })
    return ok({ canceled: false, path: result.filePath })
  } catch (error) {
    return fail(error)
  }
})

ipcMain.handle('draft:read', async () => {
  return readJson(dataPath('drafts', 'autosave.json'), null)
})

ipcMain.handle('draft:write', async (_event, draft) => {
  try {
    await writeJson(dataPath('drafts', 'autosave.json'), {
      ...draft,
      savedAt: new Date().toISOString()
    })
    return ok()
  } catch (error) {
    return fail(error)
  }
})

ipcMain.handle('draft:clear', async () => {
  try {
    await writeJson(dataPath('drafts', 'autosave.json'), null)
    return ok()
  } catch (error) {
    return fail(error)
  }
})

ipcMain.handle('library:load', async () => {
  const library = await readJson(dataPath('library.json'), null)
  return library && Array.isArray(library.projects) ? library : defaultLibrary()
})

ipcMain.handle('library:save', async (_event, library) => {
  try {
    if (!library || !Array.isArray(library.projects)) return fail('잘못된 라이브러리 형식입니다.')
    await writeJson(dataPath('library.json'), library)
    return ok()
  } catch (error) {
    return fail(error)
  }
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
