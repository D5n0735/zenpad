const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  toggleMaximize: () => ipcRenderer.invoke('window:toggleMaximize'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  close: () => ipcRenderer.invoke('window:close'),
  forceClose: () => ipcRenderer.invoke('window:forceClose'),
  onCloseRequested: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('window:close-requested', handler)
    return () => ipcRenderer.removeListener('window:close-requested', handler)
  },
  saveFile: (payload) => ipcRenderer.invoke('file:save', payload),
  saveFileAs: (payload) => ipcRenderer.invoke('file:saveAs', payload),
  openFile: () => ipcRenderer.invoke('file:open'),
  renameFile: (payload) => ipcRenderer.invoke('file:rename', payload),
  exportMarkdown: (payload) => ipcRenderer.invoke('file:exportMarkdown', payload),
  exportHtml: (payload) => ipcRenderer.invoke('file:exportHtml', payload),
  pickImage: () => ipcRenderer.invoke('image:pick'),
  readDraft: () => ipcRenderer.invoke('draft:read'),
  writeDraft: (payload) => ipcRenderer.invoke('draft:write', payload),
  clearDraft: () => ipcRenderer.invoke('draft:clear'),
  loadLibrary: () => ipcRenderer.invoke('library:load'),
  saveLibrary: (payload) => ipcRenderer.invoke('library:save', payload)
})
